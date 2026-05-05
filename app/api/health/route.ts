import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    ok: true,
    demoMode: env.demoMode,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAdminPassword: env.hasAdminPassword,
    database: {
      ok: false,
      venues: 0,
      tracks: 0
    },
    error: null as null | {
      name: string;
      message: string;
    }
  };

  if (env.demoMode) {
    return NextResponse.json({
      ...checks,
      database: {
        ok: true,
        venues: 0,
        tracks: 0
      }
    });
  }

  try {
    const [venues, tracks] = await Promise.all([prisma.venue.count(), prisma.track.count()]);
    return NextResponse.json({
      ...checks,
      database: {
        ok: true,
        venues,
        tracks
      }
    });
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message
          }
        : {
            name: "UnknownError",
            message: "Unknown database error."
          };

    return NextResponse.json(
      {
        ...checks,
        ok: false,
        error: normalizedError
      },
      { status: 503 }
    );
  }
}
