import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  if (!env.demoMode && !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const dashboard = await getAdminDashboard();

  return (
    <main className="min-h-screen bg-[#080910] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <SectionCard className="page-enter overflow-hidden bg-hero-radial">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Админ заведения</Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Мои заведения</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                  Упрощённый режим: выберите заведение, настройте музыку, цену, QR-код и живую очередь.
                </p>
              </div>
            </div>
            <Link href="/v/velvet-room" className="secondary-action">
              Страница гостя
            </Link>
          </div>
        </SectionCard>

        <div className="grid gap-5 md:grid-cols-3">
          <SectionCard interactive>
            <div className="text-sm text-white/45">Заведений</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{dashboard.venues.length}</div>
          </SectionCard>
          <SectionCard interactive>
            <div className="text-sm text-white/45">Треков в каталоге</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{dashboard.tracksCount}</div>
          </SectionCard>
          <SectionCard interactive>
            <div className="text-sm text-white/45">Оплаченных заявок</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{dashboard.ordersCount}</div>
          </SectionCard>
        </div>

        <SectionCard>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Выберите заведение</h2>
                <p className="mt-1 text-sm text-white/45">
                  Для MVP это основной админский экран. Позже сюда можно вернуть аккаунты, роли и верификацию.
                </p>
              </div>
              <Badge>{dashboard.venues.length} доступно</Badge>
            </div>

            <div className="grid gap-3">
              {dashboard.venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/admin/venues/${venue.id}` as Route}
                  className="surface-tile flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xl font-semibold">{venue.name}</div>
                      <Badge tone={venue.isAcceptingRequests ? "success" : "warning"}>
                        {venue.isAcceptingRequests ? "Приём открыт" : "На паузе"}
                      </Badge>
                    </div>
                    <div className="text-sm text-white/45">
                      /v/{venue.slug} · {formatPrice(venue.requestPriceCents)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-white/55 tabular-nums">
                      <span>{venue._count.venueTracks} треков</span>
                      <span>{venue._count.queueItems} в очереди</span>
                      <span>{venue._count.orders} заказов</span>
                    </div>
                  </div>
                  <span className="secondary-action px-4 py-2 text-sm">Открыть</span>
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
