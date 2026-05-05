import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { replaceDemoVenueTracks } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseTrackIdsInput, ValidationError } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { venueId } = await params;
    const { trackIds } = parseTrackIdsInput(await request.json());

    if (env.demoMode) {
      const result = replaceDemoVenueTracks(venueId, trackIds);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.error === "Venue not found." ? 404 : 400 });
      }

      return NextResponse.json({ message: "Allowed track library updated." });
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
      return NextResponse.json({ error: "Some tracks do not exist." }, { status: 400 });
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

    return NextResponse.json({ message: "Allowed track library updated." });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
