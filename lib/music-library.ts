import { env, isMusicLibraryConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 100;
const MAX_TRACKS_PER_SYNC = 5_000;

type LibraryAsset = {
  durationSec: number | null;
};

type LibraryTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number | null;
  assets: LibraryAsset[];
};

type LibraryTrackPage = {
  items: LibraryTrack[];
  nextCursor: string | null;
};

type SyncResult = {
  created: number;
  updated: number;
  skipped: number;
  hasMore: boolean;
};

export class MusicLibraryConfigurationError extends Error {
  constructor() {
    super(
      "Медиатека не подключена. Укажите MUSIC_LIBRARY_URL и MUSIC_LIBRARY_API_KEY в .env основного приложения."
    );
    this.name = "MusicLibraryConfigurationError";
  }
}

export class MusicLibraryRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MusicLibraryRequestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asDuration(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

function parseTrack(value: unknown): LibraryTrack | null {
  if (!isRecord(value)) return null;

  const id = asText(value.id);
  const title = asText(value.title);
  const artist = asText(value.artist);
  if (!id || !title || !artist || title.length > 120 || artist.length > 120) return null;

  const assets = Array.isArray(value.assets)
    ? value.assets.flatMap((asset) => {
        if (!isRecord(asset)) return [];
        return [{ durationSec: asDuration(asset.durationSec) }];
      })
    : [];

  return {
    id,
    title,
    artist,
    durationSec: asDuration(value.durationSec),
    assets
  };
}

function parseTrackPage(payload: unknown): LibraryTrackPage {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new MusicLibraryRequestError("Медиатека вернула ответ в неизвестном формате.");
  }

  return {
    items: payload.items.flatMap((item) => {
      const track = parseTrack(item);
      return track ? [track] : [];
    }),
    nextCursor: asText(payload.nextCursor)
  };
}

async function fetchTrackPage(cursor?: string): Promise<LibraryTrackPage> {
  const url = new URL("/v1/tracks", `${env.musicLibraryUrl}/`);
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (cursor) url.searchParams.set("cursor", cursor);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "x-api-key": env.musicLibraryApiKey },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store"
    });
  } catch {
    throw new MusicLibraryRequestError(
      "Не удалось подключиться к медиатеке. Проверьте, что music-library-service запущен на указанном адресе."
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MusicLibraryRequestError(
        "Медиатека отклонила ключ доступа. Проверьте MUSIC_LIBRARY_API_KEY."
      );
    }

    throw new MusicLibraryRequestError(
      `Медиатека вернула ошибку ${response.status}. Попробуйте снова или откройте её интерфейс диагностики.`
    );
  }

  try {
    return parseTrackPage(await response.json());
  } catch (error) {
    if (error instanceof MusicLibraryRequestError) throw error;
    throw new MusicLibraryRequestError("Не удалось прочитать ответ медиатеки.");
  }
}

function trackDuration(track: LibraryTrack) {
  return track.durationSec ?? track.assets.find((asset) => asset.durationSec !== null)?.durationSec ?? 0;
}

export async function syncMusicLibrary(): Promise<SyncResult> {
  if (!isMusicLibraryConfigured) {
    throw new MusicLibraryConfigurationError();
  }

  let cursor: string | undefined;
  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let pageCount = 0;

  do {
    pageCount += 1;
    const page = await fetchTrackPage(cursor);
    const uniqueTracks = Array.from(new Map(page.items.map((track) => [track.id, track])).values());
    skipped += page.items.length - uniqueTracks.length;

    if (uniqueTracks.length > 0) {
      const existing = await prisma.track.findMany({
        where: { libraryTrackId: { in: uniqueTracks.map((track) => track.id) } },
        select: { libraryTrackId: true }
      });
      const existingIds = new Set(
        existing.flatMap((track) => (track.libraryTrackId ? [track.libraryTrackId] : []))
      );
      const syncedAt = new Date();

      await prisma.$transaction(
        uniqueTracks.map((track) =>
          prisma.track.upsert({
            where: { libraryTrackId: track.id },
            create: {
              libraryTrackId: track.id,
              librarySyncedAt: syncedAt,
              title: track.title,
              artist: track.artist,
              durationSec: trackDuration(track)
            },
            update: {
              librarySyncedAt: syncedAt,
              title: track.title,
              artist: track.artist,
              durationSec: trackDuration(track)
            }
          })
        )
      );

      created += uniqueTracks.filter((track) => !existingIds.has(track.id)).length;
      updated += uniqueTracks.filter((track) => existingIds.has(track.id)).length;
      processed += uniqueTracks.length;
    }

    cursor = page.nextCursor ?? undefined;
  } while (cursor && processed < MAX_TRACKS_PER_SYNC && pageCount < MAX_TRACKS_PER_SYNC / PAGE_SIZE);

  return { created, updated, skipped, hasMore: Boolean(cursor) };
}
