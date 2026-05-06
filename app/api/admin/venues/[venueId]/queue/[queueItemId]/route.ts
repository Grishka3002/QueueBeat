import { QueueItemStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { updateDemoQueueItem } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string; queueItemId: string }> }
) {
  const { venueId, queueItemId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as { status?: QueueItemStatus };
  if (body.status !== "PLAYED" && body.status !== "REMOVED") {
    return NextResponse.json({ error: "Некорректный статус очереди." }, { status: 400 });
  }

  if (env.demoMode) {
    const result = updateDemoQueueItem(venueId, queueItemId, body.status);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      message: body.status === "PLAYED" ? "Трек отмечен как проигранный." : "Трек удалён из очереди."
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
      return NextResponse.json({ error: "Элемент очереди не найден." }, { status: 404 });
    }

    return NextResponse.json({
      message: body.status === "PLAYED" ? "Трек отмечен как проигранный." : "Трек удалён из очереди."
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
