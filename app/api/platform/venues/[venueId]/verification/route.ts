import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as { status?: string };
  if (body.status !== "VERIFIED" && body.status !== "REJECTED") {
    return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
  }

  const { venueId } = await params;
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      verificationStatus: body.status,
      isAcceptingRequests: body.status === "VERIFIED"
    }
  });

  return NextResponse.json({ message: "Venue verification updated." });
}
