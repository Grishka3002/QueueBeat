import { NextResponse } from "next/server";

import { getUserSessionToken, verifyPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseLoginInput, ValidationError } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const data = parseLoginInput(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user?.passwordHash || user.role !== "VENUE_OWNER" || !verifyPassword(data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
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
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
