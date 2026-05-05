import { Prisma, QueueItemStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { getDemoDashboard, getDemoVenueById, getDemoVenueBySlug } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const publicTrackSelect = {
  id: true,
  title: true,
  artist: true,
  durationSec: true,
  coverUrl: true
} satisfies Prisma.TrackSelect;

export async function getVenueBySlug(slug: string) {
  if (env.demoMode) {
    return getDemoVenueBySlug(slug);
  }

  try {
    return await prisma.venue.findUnique({
      where: { slug },
      include: {
        venueTracks: {
          include: {
            track: {
              select: publicTrackSelect
            }
          },
          orderBy: {
            track: {
              title: "asc"
            }
          }
        },
        queueItems: {
          where: { status: QueueItemStatus.QUEUED },
          include: {
            track: {
              select: publicTrackSelect
            }
          },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          take: 8
        }
      }
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getVenueOr404(slug: string) {
  const venue = await getVenueBySlug(slug);
  if (!venue) {
    notFound();
  }

  return venue;
}

export async function getAdminDashboard() {
  if (env.demoMode) {
    return getDemoDashboard();
  }

  try {
    const [venues, tracksCount, ordersCount] = await Promise.all([
      prisma.venue.findMany({
        include: {
          _count: {
            select: {
              venueTracks: true,
              queueItems: true,
              orders: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      }),
      prisma.track.count(),
      prisma.order.count({
        where: {
          status: "PAID"
        }
      })
    ]);

    return {
      venues,
      tracksCount,
      ordersCount
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getAdminVenueById(venueId: string) {
  if (env.demoMode) {
    const demoVenue = getDemoVenueById(venueId);
    if (!demoVenue) {
      notFound();
    }

    return demoVenue;
  }

  try {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        venueTracks: {
          include: {
            track: true
          },
          orderBy: {
            track: {
              title: "asc"
            }
          }
        },
        queueItems: {
          include: {
            track: true,
            order: true
          },
          orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }]
        }
      }
    });

    if (!venue) {
      notFound();
    }

    const allTracks = await prisma.track.findMany({
      orderBy: [{ artist: "asc" }, { title: "asc" }]
    });

    return {
      venue,
      allTracks
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
