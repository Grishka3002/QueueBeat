import {
  CatalogProvider,
  LicenseType,
  ProviderItemStatus,
  ProviderRunStatus,
} from "./generated/prisma/index.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { importFromUrl } from "./import-service.js";

const maxTitleLength = 300;
const maxArtistLength = 300;

export type CreateHitmosRunInput = {
  catalogRootUrl: string;
  agreementReference: string;
  maxTracks?: number;
  licenseType?: LicenseType;
  rightsHolder?: string;
  expiresAt?: string;
  territory?: string;
  notes?: string;
};

export type HitmosCatalogItemInput = {
  providerItemId: string;
  sourcePageUrl: string;
  audioSourceUrl?: string;
  title?: string;
  artist?: string;
  durationSec?: number;
  isrc?: string;
};

export class ProviderImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderImportError";
  }
}

function requiredText(value: unknown, field: string, maxLength = 2_000): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ProviderImportError(`${field} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ProviderImportError(`${field} is too long`);
  }

  return normalized;
}

function optionalText(value: unknown, field: string, maxLength = 2_000): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredText(value, field, maxLength);
}

function httpUrl(value: unknown, field: string): string {
  const raw = requiredText(value, field);
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("invalid protocol");
    }
    return parsed.toString();
  } catch {
    throw new ProviderImportError(`${field} must be an HTTP(S) URL`);
  }
}

function hitmosUrl(value: unknown, field: string): string {
  const url = httpUrl(value, field);
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname !== "hitmos.me" && !hostname.endsWith(".hitmos.me")) {
    throw new ProviderImportError(`${field} must point to a Hitmos domain`);
  }
  return url;
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new ProviderImportError("expiresAt must be an ISO date");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new ProviderImportError("expiresAt must be an ISO date");
  }
  return parsed;
}

function parseMaxTracks(value: unknown): number {
  if (value === undefined || value === null) return config.providers.maxTracksPerRun;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > config.providers.maxTracksPerRun) {
    throw new ProviderImportError(
      `maxTracks must be an integer between 1 and ${config.providers.maxTracksPerRun}`,
    );
  }
  return parsed;
}

function parseLicenseType(value: unknown): LicenseType {
  if (value === undefined || value === null) return LicenseType.DIRECT_CONTRACT;
  if (typeof value !== "string" || !Object.values(LicenseType).includes(value as LicenseType)) {
    throw new ProviderImportError("licenseType is not supported");
  }
  return value as LicenseType;
}

export async function createHitmosRun(input: CreateHitmosRunInput) {
  const maxTracks = parseMaxTracks(input.maxTracks);
  if (maxTracks > 10_000 && config.storageDriver !== "s3") {
    throw new ProviderImportError(
      "A run larger than 10,000 tracks requires STORAGE_DRIVER=s3. PostgreSQL is reserved for metadata at this scale.",
    );
  }

  return prisma.providerImportRun.create({
    data: {
      provider: CatalogProvider.HITMOS,
      catalogRootUrl: hitmosUrl(input.catalogRootUrl, "catalogRootUrl"),
      agreementReference: requiredText(input.agreementReference, "agreementReference"),
      maxTracks,
      licenseType: parseLicenseType(input.licenseType),
      rightsHolder: optionalText(input.rightsHolder, "rightsHolder", 300),
      expiresAt: parseOptionalDate(input.expiresAt),
      territory: optionalText(input.territory, "territory", 120) ?? "worldwide",
      notes: optionalText(input.notes, "notes", 2_000),
    },
  });
}

function validateCatalogItem(input: HitmosCatalogItemInput) {
  const durationSec = input.durationSec;
  if (durationSec !== undefined && (!Number.isInteger(durationSec) || durationSec <= 0)) {
    throw new ProviderImportError("durationSec must be a positive integer");
  }

  return {
    providerItemId: requiredText(input.providerItemId, "providerItemId", 300),
    sourcePageUrl: hitmosUrl(input.sourcePageUrl, "sourcePageUrl"),
    audioSourceUrl:
      input.audioSourceUrl === undefined ? undefined : httpUrl(input.audioSourceUrl, "audioSourceUrl"),
    title: optionalText(input.title, "title", maxTitleLength),
    artist: optionalText(input.artist, "artist", maxArtistLength),
    durationSec,
    isrc: optionalText(input.isrc, "isrc", 32),
  };
}

export async function queueHitmosCatalogItems(runId: string, inputs: HitmosCatalogItemInput[]) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new ProviderImportError("items must be a non-empty array");
  }
  if (inputs.length > config.providers.maxQueueChunk) {
    throw new ProviderImportError(
      `items cannot contain more than ${config.providers.maxQueueChunk} catalog entries`,
    );
  }

  const run = await prisma.providerImportRun.findUnique({
    where: { id: runId },
    select: { id: true, provider: true, maxTracks: true, status: true, catalogSealed: true },
  });
  if (!run || run.provider !== CatalogProvider.HITMOS) {
    throw new ProviderImportError("Hitmos import run was not found");
  }
  if (run.status === ProviderRunStatus.COMPLETED || run.status === ProviderRunStatus.FAILED) {
    throw new ProviderImportError("This import run is closed");
  }
  if (run.catalogSealed) {
    throw new ProviderImportError("This import run has been sealed and cannot accept more catalog items");
  }

  const distinctItems = Array.from(
    new Map(inputs.map((item) => [item.providerItemId, validateCatalogItem(item)])).values(),
  );
  const currentCount = await prisma.providerCatalogItem.count({ where: { runId } });
  const remainingCapacity = run.maxTracks - currentCount;
  if (remainingCapacity <= 0) {
    throw new ProviderImportError(`The run has reached its ${run.maxTracks} track limit`);
  }

  const acceptedItems = distinctItems.slice(0, remainingCapacity);
  const created = await prisma.providerCatalogItem.createMany({
    data: acceptedItems.map((item) => ({
      runId,
      ...item,
      status: item.audioSourceUrl ? ProviderItemStatus.PENDING : ProviderItemStatus.BLOCKED,
      lastError: item.audioSourceUrl ? undefined : "Waiting for an authorized direct audio URL",
    })),
    skipDuplicates: true,
  });

  if (created.count > 0) {
    await prisma.providerImportRun.update({
      where: { id: runId },
      data: {
        discoveredCount: { increment: created.count },
        status: ProviderRunStatus.RUNNING,
        finishedAt: null,
      },
    });
  }

  return {
    queued: created.count,
    alreadyKnown: acceptedItems.length - created.count,
    omittedByRunLimit: distinctItems.length - acceptedItems.length,
  };
}

function retryAt(attempt: number): Date {
  const delayMs = Math.min(60 * 60 * 1_000, 30_000 * 2 ** Math.min(attempt, 7));
  return new Date(Date.now() + delayMs);
}

export async function processHitmosCatalogItems(runId: string, requestedLimit?: number) {
  const limit = Math.min(
    Math.max(1, Math.floor(requestedLimit ?? config.providers.maxProcessBatch)),
    config.providers.maxProcessBatch,
  );
  const run = await prisma.providerImportRun.findUnique({ where: { id: runId } });
  if (!run || run.provider !== CatalogProvider.HITMOS) {
    throw new ProviderImportError("Hitmos import run was not found");
  }
  if (run.status === ProviderRunStatus.COMPLETED || run.status === ProviderRunStatus.FAILED) {
    throw new ProviderImportError("This import run is closed");
  }

  await prisma.providerImportRun.update({
    where: { id: runId },
    data: { status: ProviderRunStatus.RUNNING, startedAt: run.startedAt ?? new Date() },
  });

  const now = new Date();
  const candidates = await prisma.providerCatalogItem.findMany({
    where: {
      runId,
      status: { in: [ProviderItemStatus.PENDING, ProviderItemStatus.FAILED] },
      attempts: { lt: config.providers.maxItemAttempts },
      audioSourceUrl: { not: null },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: [{ attempts: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  let imported = 0;
  let failed = 0;

  for (const item of candidates) {
    const claimed = await prisma.providerCatalogItem.updateMany({
      where: {
        id: item.id,
        status: { in: [ProviderItemStatus.PENDING, ProviderItemStatus.FAILED] },
      },
      data: { status: ProviderItemStatus.PROCESSING, lockedAt: new Date(), lastError: null },
    });
    if (claimed.count === 0 || !item.audioSourceUrl) continue;

    const job = await importFromUrl({
      sourceUrl: item.audioSourceUrl,
      title: item.title ?? undefined,
      artist: item.artist ?? undefined,
      durationSec: item.durationSec ?? undefined,
      license: {
        type: run.licenseType,
        proofUrl: run.agreementReference,
        rightsHolder: run.rightsHolder ?? undefined,
        expiresAt: run.expiresAt?.toISOString(),
        territory: run.territory,
        notes: run.notes ?? undefined,
      },
    });

    if (job.status === "COMPLETED" && job.trackId) {
      await prisma.$transaction([
        prisma.providerCatalogItem.update({
          where: { id: item.id },
          data: {
            status: ProviderItemStatus.COMPLETED,
            trackId: job.trackId,
            completedAt: new Date(),
            lockedAt: null,
            lastError: null,
          },
        }),
        prisma.providerImportRun.update({
          where: { id: runId },
          data: { importedCount: { increment: 1 }, lastError: null },
        }),
      ]);
      imported += 1;
      continue;
    }

    const attempts = item.attempts + 1;
    const exhausted = attempts >= config.providers.maxItemAttempts;
    const message = exhausted
      ? `${job.reason ?? "The audio import failed"} Retry limit reached.`
      : job.reason ?? "The audio import failed";
    await prisma.$transaction([
      prisma.providerCatalogItem.update({
        where: { id: item.id },
        data: {
          status: exhausted ? ProviderItemStatus.BLOCKED : ProviderItemStatus.FAILED,
          attempts,
          nextAttemptAt: exhausted ? null : retryAt(attempts),
          lockedAt: null,
          lastError: message,
        },
      }),
      prisma.providerImportRun.update({
        where: { id: runId },
        data: { failedCount: { increment: 1 }, lastError: message },
      }),
    ]);
    failed += 1;
  }

  const statusCounts = await prisma.providerCatalogItem.groupBy({
    by: ["status"],
    where: { runId },
    _count: { _all: true },
  });
  const countFor = (status: ProviderItemStatus) =>
    statusCounts.find((entry) => entry.status === status)?._count._all ?? 0;
  const pending = countFor(ProviderItemStatus.PENDING) + countFor(ProviderItemStatus.PROCESSING);
  const blocked = countFor(ProviderItemStatus.BLOCKED);
  const retryableFailures = countFor(ProviderItemStatus.FAILED);
  const status =
    pending > 0 || retryableFailures > 0
      ? ProviderRunStatus.RUNNING
      : !run.catalogSealed
        ? ProviderRunStatus.READY
        : blocked > 0
          ? ProviderRunStatus.PAUSED
          : ProviderRunStatus.COMPLETED;

  await prisma.providerImportRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt: status === ProviderRunStatus.COMPLETED ? new Date() : null,
    },
  });

  return { selected: candidates.length, imported, failed, pending, blocked, retryableFailures, status };
}

export async function sealHitmosRun(runId: string) {
  const run = await prisma.providerImportRun.findUnique({
    where: { id: runId },
    select: { id: true, provider: true, status: true },
  });
  if (!run || run.provider !== CatalogProvider.HITMOS) {
    throw new ProviderImportError("Hitmos import run was not found");
  }
  if (run.status === ProviderRunStatus.COMPLETED || run.status === ProviderRunStatus.FAILED) {
    throw new ProviderImportError("This import run is closed");
  }

  return prisma.providerImportRun.update({
    where: { id: runId },
    data: { catalogSealed: true, status: ProviderRunStatus.RUNNING },
  });
}

export async function getHitmosRun(runId: string) {
  const run = await prisma.providerImportRun.findUnique({
    where: { id: runId },
    include: {
      _count: { select: { items: true } },
    },
  });
  if (!run || run.provider !== CatalogProvider.HITMOS) return null;

  const statusCounts = await prisma.providerCatalogItem.groupBy({
    by: ["status"],
    where: { runId },
    _count: { _all: true },
  });

  return { ...run, statusCounts };
}
