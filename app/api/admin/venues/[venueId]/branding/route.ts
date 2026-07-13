import { NextResponse } from "next/server";

import { canManageVenue } from "@/lib/auth";
import { updateDemoVenueBranding } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const ALLOWED_ACCENTS = new Set(["#F849A6", "#3BD6EA", "#B8F23C", "#9D6BFF"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!(await canManageVenue(venueId))) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  }

  let body: { accentColor?: string };
  try {
    body = (await request.json()) as { accentColor?: string };
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const accentColor = String(body.accentColor ?? "");
  if (!ALLOWED_ACCENTS.has(accentColor)) {
    return NextResponse.json({ error: "Недопустимый цвет." }, { status: 400 });
  }

  if (env.demoMode) {
    const result = updateDemoVenueBranding(venueId, accentColor);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.venue.update({ where: { id: venueId }, data: { accentColor } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
