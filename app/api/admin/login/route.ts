import { NextResponse } from "next/server";

import { getAdminSessionToken } from "@/lib/auth";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  if (!env.hasAdminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD не настроен." }, { status: 500 });
  }

  const body = (await request.json()) as { password?: string };
  if (body.password !== env.adminPassword) {
    return NextResponse.json({ error: "Неверный пароль администратора." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: env.adminCookieName,
    value: getAdminSessionToken(),
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8
  });

  return response;
}
