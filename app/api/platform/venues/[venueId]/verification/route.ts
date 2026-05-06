import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as { status?: string };
  if (body.status !== "VERIFIED" && body.status !== "REJECTED") {
    return NextResponse.json({ error: "Некорректный статус проверки." }, { status: 400 });
  }

  const { venueId } = await params;
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await prisma.venue.update({
    where: { id: venueId },
    data: {
      verificationStatus: body.status,
      isAcceptingRequests: body.status === "VERIFIED",
      trialEndsAt: body.status === "VERIFIED" ? trialEndsAt : null
    }
  });

  return NextResponse.json({ message: "Статус проверки заведения обновлён." });
}
