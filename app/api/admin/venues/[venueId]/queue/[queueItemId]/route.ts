import { QueueItemStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { updateDemoQueueItem } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string; queueItemId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { venueId, queueItemId } = await params;
  const body = (await request.json()) as { status?: QueueItemStatus };
  if (body.status !== "PLAYED" && body.status !== "REMOVED") {
    return NextResponse.json({ error: "Invalid queue status." }, { status: 400 });
  }

  if (env.demoMode) {
    const result = updateDemoQueueItem(venueId, queueItemId, body.status);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      message: body.status === "PLAYED" ? "Track marked as played." : "Track removed from queue."
    });
  }

  try {
    const updateResult = await prisma.queueItem.updateMany({
      where: {
        id: queueItemId,
        venueId
      },
      data: {
        status: body.status,
        playedAt: body.status === "PLAYED" ? new Date() : null,
        removedAt: body.status === "REMOVED" ? new Date() : null
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: body.status === "PLAYED" ? "Track marked as played." : "Track removed from queue."
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
