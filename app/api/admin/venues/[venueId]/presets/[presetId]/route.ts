import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ venueId: string; presetId: string }> }
) {
  const { venueId, presetId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const preset = await prisma.playlistPreset.findUnique({
    where: { id: presetId },
    include: {
      presetTracks: {
        orderBy: { position: "asc" }
      }
    }
  });

  if (!preset) {
    return NextResponse.json({ error: "Пресет не найден." }, { status: 404 });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.venueTrack.deleteMany({
      where: { venueId }
    });

    await transaction.venueTrack.createMany({
      data: preset.presetTracks.map((item) => ({
        venueId,
        trackId: item.trackId
      })),
      skipDuplicates: true
    });
  });

  return NextResponse.json({ message: `Пресет «${preset.name}» применён.` });
}
