import { NextResponse } from "next/server";

import { canManageVenue } from "@/lib/auth";
import {
  applyDemoPlayerCommand,
  getDemoPlayerSnapshot,
  type DemoPlayerCommand
} from "@/lib/demo-store";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const ACTIONS = new Set([
  "toggle",
  "skip",
  "restart",
  "volume",
  "mute",
  "moveUp",
  "playNow",
  "remove",
  "accept"
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!(await canManageVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  }

  if (!env.demoMode) {
    return NextResponse.json(
      { error: "Плеер доступен в демо-режиме. Продовый realtime-движок — следующий этап." },
      { status: 501 }
    );
  }

  const snapshot = getDemoPlayerSnapshot(venueId);
  if (!snapshot) {
    return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!(await canManageVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  }

  if (!env.demoMode) {
    return NextResponse.json(
      { error: "Управление плеером доступно в демо-режиме." },
      { status: 501 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const action = String(body.action ?? "");
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: "Неизвестная команда." }, { status: 400 });
  }

  const command = {
    action,
    value: body.value,
    queueItemId: body.queueItemId
  } as unknown as DemoPlayerCommand;

  const result = applyDemoPlayerCommand(venueId, command);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.snapshot);
}
