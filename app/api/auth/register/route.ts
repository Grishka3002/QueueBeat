import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getUserSessionToken, hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseVenueRegistrationInput, ValidationError } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const data = parseVenueRegistrationInput(await request.json());
    const passwordHash = hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.ownerName,
        passwordHash,
        role: "VENUE_OWNER",
        venues: {
          create: {
            name: data.venueName,
            slug: data.slug,
            requestPriceCents: 50000,
            isAcceptingRequests: false,
            verificationStatus: "PENDING"
          }
        }
      }
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: env.sessionCookieName,
      value: getUserSessionToken(user.id, passwordHash),
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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email or venue slug already exists." }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
