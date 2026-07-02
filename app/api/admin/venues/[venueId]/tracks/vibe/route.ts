import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { getDemoTracks, getDemoVenueById, replaceDemoVenueTracks } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseVibePlaylistInput, ValidationError } from "@/lib/validators";
import { buildVibePlaylist } from "@/lib/vibe-playlists";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;
    if (!(await canManageVerifiedVenue(venueId))) {
      return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
    }

    const input = parseVibePlaylistInput(await request.json());

    if (env.demoMode) {
      const demoData = getDemoVenueById(venueId);
      if (!demoData) {
        return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
      }

      const recommendation = buildVibePlaylist({
        prompt: input.prompt,
        tracks: getDemoTracks(),
        count: input.count
      });
      const currentTrackIds = demoData.venue.venueTracks.map((item) => item.trackId);
      const nextTrackIds =
        input.mode === "replace"
          ? recommendation.tracks.map((track) => track.id)
          : Array.from(new Set([...currentTrackIds, ...recommendation.tracks.map((track) => track.id)]));

      const result = replaceDemoVenueTracks(venueId, nextTrackIds);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        message:
          input.mode === "replace"
            ? "Витрина заменена треками под выбранный вайб."
            : "Треки под выбранный вайб добавлены в витрину.",
        tracks: recommendation.tracks,
        profileLabels: recommendation.profileLabels,
        reason: recommendation.reason
      });
    }

    const [venue, tracks, currentVenueTracks] = await Promise.all([
      prisma.venue.findUnique({
        where: { id: venueId },
        select: { id: true }
      }),
      prisma.track.findMany({
        orderBy: [{ artist: "asc" }, { title: "asc" }]
      }),
      prisma.venueTrack.findMany({
        where: { venueId },
        select: { trackId: true }
      })
    ]);

    if (!venue) {
      return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
    }

    if (tracks.length === 0) {
      return NextResponse.json({ error: "Глобальная библиотека треков пока пустая." }, { status: 400 });
    }

    const recommendation = buildVibePlaylist({
      prompt: input.prompt,
      tracks,
      count: input.count
    });
    const recommendedTrackIds = recommendation.tracks.map((track) => track.id);
    const currentTrackIds = currentVenueTracks.map((item) => item.trackId);
    const nextTrackIds =
      input.mode === "replace"
        ? recommendedTrackIds
        : Array.from(new Set([...currentTrackIds, ...recommendedTrackIds]));

    await prisma.$transaction(async (transaction) => {
      if (input.mode === "replace") {
        await transaction.venueTrack.deleteMany({
          where: { venueId }
        });
      }

      await transaction.venueTrack.createMany({
        data: nextTrackIds.map((trackId) => ({
          venueId,
          trackId
        })),
        skipDuplicates: true
      });
    });

    return NextResponse.json({
      message:
        input.mode === "replace"
          ? "Витрина заменена треками под выбранный вайб."
          : "Треки под выбранный вайб добавлены в витрину.",
      tracks: recommendation.tracks,
      profileLabels: recommendation.profileLabels,
      reason: recommendation.reason
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
