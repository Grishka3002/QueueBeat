import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { addDemoCustomTrack } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseCustomTrackInput, ValidationError } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;
    if (!(await canManageVerifiedVenue(venueId))) {
      return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
    }

    const data = parseCustomTrackInput(await request.json());

    if (env.demoMode) {
      const result = addDemoCustomTrack(venueId, data);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        message: "Трек добавлен в каталог и разрешён для заведения.",
        trackId: result.track.id
      });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true }
    });

    if (!venue) {
      return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
    }

    const track = await prisma.$transaction(async (transaction) => {
      const createdTrack = await transaction.track.create({
        data
      });

      await transaction.venueTrack.create({
        data: {
          venueId,
          trackId: createdTrack.id
        }
      });

      return createdTrack;
    });

    return NextResponse.json({
      message: "Трек добавлен в каталог и разрешён для заведения.",
      trackId: track.id
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
