import { NextResponse } from "next/server";

import {
  demoOwnerCookieName,
  getDemoOwnerSessionToken,
  getUserSessionToken,
  verifyPassword
} from "@/lib/auth";
import { findDemoOwnerByCredentials } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseLoginInput, ValidationError } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const data = parseLoginInput(await request.json());

    if (env.demoMode) {
      const owner = findDemoOwnerByCredentials(data.email, data.password);
      if (!owner) {
        return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set({
        name: demoOwnerCookieName,
        value: getDemoOwnerSessionToken(owner.id),
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 14
      });
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user?.passwordHash || user.role !== "VENUE_OWNER" || !verifyPassword(data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: env.sessionCookieName,
      value: getUserSessionToken(user.id, user.passwordHash),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14
    });

    return response;
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
