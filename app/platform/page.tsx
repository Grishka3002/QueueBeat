import Link from "next/link";
import type { Route } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { VerifyVenueButton } from "@/components/platform/verify-venue-button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

function formatVerificationStatus(status: "PENDING" | "VERIFIED" | "REJECTED") {
  const labels = {
    PENDING: "Ожидает проверки",
    VERIFIED: "Проверено",
    REJECTED: "Отклонено"
  };

  return labels[status];
}

export default async function PlatformPage() {
  await requireAdmin();

  const [venues, usersCount, ordersCount] = await Promise.all([
    prisma.venue.findMany({
      include: {
        owner: true,
        businessProfile: true,
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
      badge="Платформа"
      title="Панель платформы QueueBeat"
      description="Проверяйте заведения, контролируйте подключение клиентов и открывайте любые кабинеты для поддержки."
      homeHref="/platform"
      homeLabel="Платформа"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <SectionCard>
          <div className="text-sm text-white/45">Заведения</div>
          <div className="mt-2 text-3xl font-semibold">{venues.length}</div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Пользователи</div>
          <div className="mt-2 text-3xl font-semibold">{usersCount}</div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Заказы</div>
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
                    {formatVerificationStatus(venue.verificationStatus)}
                  </Badge>
                  <Badge tone={venue.isAcceptingRequests ? "success" : "default"}>
                    {venue.isAcceptingRequests ? "Приём открыт" : "На паузе"}
                  </Badge>
                </div>
                <div className="text-sm text-white/45">
                  Владелец: {venue.owner?.email ?? "Не назначен"} - /v/{venue.slug} -{" "}
                  {formatPrice(venue.requestPriceCents)}
                </div>
                {venue.businessProfile ? (
                  <div className="text-sm leading-6 text-white/45">
                    {venue.businessProfile.businessType === "LLC" ? "ООО" : "ИП"} -{" "}
                    {venue.businessProfile.legalName} - ИНН {venue.businessProfile.inn}
                    {venue.businessProfile.kpp ? ` - КПП ${venue.businessProfile.kpp}` : ""}
                    {venue.businessProfile.ogrn ? ` - ОГРН ${venue.businessProfile.ogrn}` : ""}
                    {venue.businessProfile.ogrnip ? ` - ОГРНИП ${venue.businessProfile.ogrnip}` : ""}
                    <br />
                    {venue.businessProfile.legalAddress}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3 text-sm text-white/55">
                  <span>{venue._count.venueTracks} треков</span>
                  <span>{venue._count.queueItems} в очереди</span>
                  <span>{venue._count.orders} заказов</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/platform/venues/${venue.id}` as Route}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
                >
                  Открыть
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
