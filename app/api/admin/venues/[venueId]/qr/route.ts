import QRCode from "qrcode";
import { NextResponse } from "next/server";

import { canManageVerifiedVenue } from "@/lib/auth";
import { getDemoDashboard } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let venue = null;
  if (env.demoMode) {
    venue =
      getDemoDashboard().venues.find((item) => item.id === venueId) ?? null;
  } else {
    venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        name: true,
        slug: true
      }
    });
  }

  if (!venue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const url = `${env.appUrl}/v/${venue.slug}`;
  const png = await QRCode.toBuffer(url, {
    width: 900,
    margin: 2,
    color: {
      dark: "#0a0a11",
      light: "#ffffff"
    }
  });

  const download = new URL(request.url).searchParams.get("download");
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition":
        download === "1" ? `attachment; filename="${venue.slug}-qr.png"` : "inline"
    }
  });
}
