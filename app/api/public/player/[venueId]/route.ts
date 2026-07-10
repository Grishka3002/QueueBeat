import { NextResponse } from "next/server";
import { QueueItemStatus } from "@prisma/client";

import { getDemoPlayerSnapshot } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  const orderId = new URL(request.url).searchParams.get("orderId");

  if (env.demoMode) {
    const snapshot = getDemoPlayerSnapshot(venueId);
    if (!snapshot) {
      return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
    }

    const yourPosition = orderId
      ? snapshot.queue.find((item) => item.orderId === orderId)?.position ?? null
      : null;

    return NextResponse.json({ ...snapshot, yourPosition });
  }

  try {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        queueItems: {
          where: { status: QueueItemStatus.QUEUED },
          include: { track: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }]
        }
      }
    });

    if (!venue) {
      return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
    }

    const queue = venue.queueItems.map((item, index) => ({
      id: item.id,
      orderId: item.orderId,
      trackId: item.trackId,
      title: item.track.title,
      artist: item.track.artist,
      durationSec: item.track.durationSec,
      position: index + 1
    }));

    return NextResponse.json({
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        accentColor: venue.accentColor,
        requestPriceCents: venue.requestPriceCents,
        isAcceptingRequests: venue.isAcceptingRequests,
        backgroundMode: venue.backgroundMode
      },
      playing: true,
      volume: 65,
      muted: false,
      playedRequestsTonight: 0,
      nowPlaying: null,
      queue,
      yourPosition: orderId
        ? queue.find((item) => item.orderId === orderId)?.position ?? null
        : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
