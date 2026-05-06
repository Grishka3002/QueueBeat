import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { replaceDemoVenueTracks } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseTrackIdsInput, ValidationError } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;
    if (!(await canManageVerifiedVenue(venueId))) {
      return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
    }

    const { trackIds } = parseTrackIdsInput(await request.json());

    if (env.demoMode) {
      const result = replaceDemoVenueTracks(venueId, trackIds);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.error === "Заведение не найдено." ? 404 : 400 });
      }

      return NextResponse.json({ message: "Разрешённая библиотека треков обновлена." });
    }

    const existingTracks = await prisma.track.findMany({
      where: {
        id: {
          in: trackIds
        }
      },
      select: {
        id: true
      }
    });

    if (existingTracks.length !== trackIds.length) {
      return NextResponse.json({ error: "Некоторые треки не существуют." }, { status: 400 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.venueTrack.deleteMany({
        where: { venueId }
      });

      if (trackIds.length > 0) {
        await transaction.venueTrack.createMany({
          data: trackIds.map((trackId) => ({
            venueId,
            trackId
          }))
        });
      }
    });

    return NextResponse.json({ message: "Разрешённая библиотека треков обновлена." });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
