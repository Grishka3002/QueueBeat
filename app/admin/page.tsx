import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  await requireAdmin();
  const dashboard = await getAdminDashboard();

  return (
    <AdminShell
      title="Venues overview"
      description="Управляйте ценой музыкального запроса, разрешенной библиотекой треков, очередью и QR-кодом для каждого заведения."
    >
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/45">Venues</div>
              <div className="mt-2 text-3xl font-semibold">{dashboard.venues.length}</div>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/45">Tracks</div>
              <div className="mt-2 text-3xl font-semibold">{dashboard.tracksCount}</div>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/45">Paid orders</div>
              <div className="mt-2 text-3xl font-semibold">{dashboard.ordersCount}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            {dashboard.venues.map((venue) => (
              <Link
                key={venue.id}
                href={`/admin/venues/${venue.id}`}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xl font-semibold">{venue.name}</div>
                    <Badge tone={venue.isAcceptingRequests ? "success" : "warning"}>
                      {venue.isAcceptingRequests ? "Open" : "Paused"}
                    </Badge>
                  </div>
                  <div className="text-sm text-white/45">
                    /v/{venue.slug} • {formatPrice(venue.requestPriceCents)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/55">
                  <span>{venue._count.venueTracks} tracks</span>
                  <span>{venue._count.queueItems} queue items</span>
                  <span>{venue._count.orders} orders</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
