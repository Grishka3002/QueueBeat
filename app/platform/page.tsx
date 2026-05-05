import Link from "next/link";
import type { Route } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { VerifyVenueButton } from "@/components/platform/verify-venue-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function PlatformPage() {
  await requireAdmin();

  const [venues, usersCount, ordersCount] = await Promise.all([
    prisma.venue.findMany({
      include: {
        owner: true,
        _count: {
          select: {
            venueTracks: true,
            orders: true,
            queueItems: true
          }
        }
      },
      orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }]
    }),
    prisma.user.count(),
    prisma.order.count()
  ]);

  return (
    <AdminShell
      badge="Platform"
      title="QueueBeat platform console"
      description="Approve venue accounts, monitor customer setup, and open any venue dashboard for support."
      homeHref="/platform"
      homeLabel="Platform"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <SectionCard>
          <div className="text-sm text-white/45">Venues</div>
          <div className="mt-2 text-3xl font-semibold">{venues.length}</div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Users</div>
          <div className="mt-2 text-3xl font-semibold">{usersCount}</div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Orders</div>
          <div className="mt-2 text-3xl font-semibold">{ordersCount}</div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="space-y-4">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xl font-semibold">{venue.name}</div>
                  <Badge tone={venue.verificationStatus === "VERIFIED" ? "success" : "warning"}>
                    {venue.verificationStatus}
                  </Badge>
                  <Badge tone={venue.isAcceptingRequests ? "success" : "default"}>
                    {venue.isAcceptingRequests ? "Open" : "Paused"}
                  </Badge>
                </div>
                <div className="text-sm text-white/45">
                  Owner: {venue.owner?.email ?? "Unassigned"} - /v/{venue.slug} -{" "}
                  {formatPrice(venue.requestPriceCents)}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/55">
                  <span>{venue._count.venueTracks} tracks</span>
                  <span>{venue._count.queueItems} queue items</span>
                  <span>{venue._count.orders} orders</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/platform/venues/${venue.id}` as Route}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
                >
                  Open
                </Link>
                <VerifyVenueButton venueId={venue.id} status={venue.verificationStatus} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AdminShell>
  );
}
