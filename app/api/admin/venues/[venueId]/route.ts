import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { updateDemoVenueSettings } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseVenueSettingsInput, ValidationError } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { venueId } = await params;
    const data = parseVenueSettingsInput(await request.json());

    if (env.demoMode) {
      const result = updateDemoVenueSettings(venueId, {
        name: data.name,
        slug: data.slug,
        requestPriceCents: data.priceCents,
        isAcceptingRequests: data.isAcceptingRequests
      });

      if ("error" in result) {
        const status = result.error === "Slug already exists." ? 409 : 404;
        return NextResponse.json({ error: result.error }, { status });
      }

      return NextResponse.json({ message: "Venue settings updated." });
    }

    await prisma.venue.update({
      where: { id: venueId },
      data
    });

    return NextResponse.json({ message: "Venue settings updated." });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
