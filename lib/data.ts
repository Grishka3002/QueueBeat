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
        },
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 3
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
        },
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { currentPeriodEnd: "desc" },
          take: 3
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 20
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!venue) {
      notFound();
    }

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [allTracks, presets, ledgerEntries, paidOrders] = await Promise.all([
      prisma.track.findMany({
        orderBy: [{ artist: "asc" }, { title: "asc" }]
      }),
      prisma.playlistPreset.findMany({
        include: {
          presetTracks: {
            include: { track: true },
            orderBy: { position: "asc" }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.ledgerEntry.findMany({
        where: { venueId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.findMany({
        where: {
          venueId,
          status: "PAID",
          paidAt: {
            gte: since
          }
        },
        select: {
          amountCents: true,
          paidAt: true
        },
        orderBy: { paidAt: "asc" }
      })
    ]);

    const balanceCents = ledgerEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
    const venueRevenueCents = ledgerEntries
      .filter((entry) => entry.type === "VENUE_SHARE")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const platformFeesCents = ledgerEntries
      .filter((entry) => entry.type === "PLATFORM_FEE")
      .reduce((sum, entry) => sum + Math.abs(entry.amountCents), 0);
    const dailyOrders = paidOrders.reduce<Record<string, { orders: number; grossCents: number }>>(
      (result, order) => {
        const key = (order.paidAt ?? new Date()).toISOString().slice(0, 10);
        result[key] = result[key] ?? { orders: 0, grossCents: 0 };
        result[key].orders += 1;
        result[key].grossCents += order.amountCents;
        return result;
      },
      {}
    );

    return {
      venue,
      allTracks,
      presets,
      analytics: {
        balanceCents,
        venueRevenueCents,
        platformFeesCents,
        paidOrdersCount: paidOrders.length,
        dailyOrders
      }
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
