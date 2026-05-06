import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { updateDemoVenueSettings } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseVenueSettingsInput, ValidationError } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;
    if (!(await canManageVerifiedVenue(venueId))) {
      return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
    }

    const data = parseVenueSettingsInput(await request.json());

    if (env.demoMode) {
      const result = updateDemoVenueSettings(venueId, {
        name: data.name,
        slug: data.slug,
        requestPriceCents: data.priceCents,
        isAcceptingRequests: data.isAcceptingRequests
      });

      if ("error" in result) {
        const status = result.error === "Этот slug уже занят." ? 409 : 404;
        return NextResponse.json({ error: result.error }, { status });
      }

      return NextResponse.json({ message: "Настройки заведения обновлены." });
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...data,
        isAcceptingRequests: data.isAcceptingRequests
      }
    });

    return NextResponse.json({ message: "Настройки заведения обновлены." });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Этот slug уже занят." }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
