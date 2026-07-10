import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { QueueControls } from "@/components/admin/queue-controls";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { VenueNav } from "@/components/admin/venue-nav";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { canManageVerifiedVenue } from "@/lib/auth";
import { isSubscriptionUsable } from "@/lib/commercial";
import { getAdminVenueById } from "@/lib/data";
import { env } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/utils";

function formatQueueStatus(status: "QUEUED" | "PLAYED" | "REMOVED") {
  const labels = {
    QUEUED: "В очереди",
    PLAYED: "Проигран",
    REMOVED: "Удалён"
  };

  return labels[status];
}

export default async function AdminVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!env.demoMode && !(await canManageVerifiedVenue(venueId))) {
    redirect("/admin/login");
  }

  const data = await getAdminVenueById(venueId);
  const { venue } = data;
  const analytics =
    "analytics" in data
      ? data.analytics
      : {
          balanceCents: 0,
          venueRevenueCents: 0,
          platformFeesCents: 0,
          paidOrdersCount: 0,
          dailyOrders: {}
        };
  const baseHref = `/admin/venues/${venue.id}` as Route;
  const subscriptionActive = isSubscriptionUsable(venue);
  const grossCents = analytics.venueRevenueCents + analytics.platformFeesCents;
  const queuedItems = venue.queueItems.filter((item) => item.status === "QUEUED");

  return (
    <AdminShell
      badge="Заведение"
      title={venue.name}
      description="Короткий обзор денег, заявок и текущей очереди. Основное управление вынесено в настройки заведения."
      homeHref="/admin"
      homeLabel="Мои заведения"
      previewHref={`/v/${venue.slug}` as Route}
    >
      <VenueNav baseHref={baseHref} active="overview" />

      <div className="grid gap-5 md:grid-cols-4">
        <SectionCard className="md:col-span-2" interactive>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white/45">Баланс к выплате</div>
              <div className="mt-2 text-4xl font-semibold text-gradient tabular-nums">
                {formatPrice(analytics.balanceCents)}
              </div>
              <div className="mt-2 text-sm text-white/45">Доля заведения после комиссии платформы.</div>
            </div>
            <Badge tone={subscriptionActive ? "success" : "danger"}>
              {subscriptionActive ? "QR активен" : "QR заблокирован"}
            </Badge>
          </div>
        </SectionCard>

        <SectionCard interactive>
          <div className="text-sm text-white/45">Оплаченные заявки</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{analytics.paidOrdersCount}</div>
          <div className="mt-2 text-xs text-white/40">За последние 14 дней</div>
        </SectionCard>

        <SectionCard interactive>
          <div className="text-sm text-white/45">Оборот</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{formatPrice(grossCents)}</div>
          <div className="mt-2 text-xs text-white/40">До разделения комиссии</div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard>
          <RevenueChart dailyOrders={analytics.dailyOrders} />
        </SectionCard>

        <SectionCard>
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <h2 className="text-xl font-semibold">Что важно сейчас</h2>
              <div className="mt-4 space-y-3">
                <div className="surface-tile rounded-[1.2rem] p-4">
                  <div className="text-sm text-white/45">Приём заявок</div>
                  <div className="mt-1 font-semibold">
                    {venue.isAcceptingRequests ? "Включён" : "На паузе"}
                  </div>
                </div>
                <div className="surface-tile rounded-[1.2rem] p-4">
                  <div className="text-sm text-white/45">Цена заявки</div>
                  <div className="mt-1 font-semibold tabular-nums">{formatPrice(venue.requestPriceCents)}</div>
                </div>
                <div className="surface-tile rounded-[1.2rem] p-4">
                  <div className="text-sm text-white/45">Разрешено треков</div>
                  <div className="mt-1 font-semibold tabular-nums">{venue.venueTracks.length}</div>
                </div>
              </div>
            </div>
            <Link href={`${baseHref}/settings` as Route} className="primary-action px-5 py-3 text-sm">
              Перейти в настройки
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Текущая очередь</h2>
            <p className="mt-1 text-sm text-white/45">Только активные заявки, которые ещё нужно проиграть.</p>
          </div>
          <Badge>{queuedItems.length} в очереди</Badge>
        </div>

        {queuedItems.length === 0 ? (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
            Очередь пока пустая. Новые оплаченные заявки появятся здесь.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[1.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr_1fr] gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/35">
              <span>Трек</span>
              <span>Позиция</span>
              <span>Добавлен</span>
              <span>Действие</span>
            </div>
            <div className="divide-y divide-white/10">
              {queuedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-white/75 transition-[background-color] duration-150 hover:bg-white/[0.035] md:grid-cols-[1.4fr_0.7fr_0.9fr_1fr]"
                >
                  <div>
                    <div className="font-medium text-white">{item.track.title}</div>
                    <div className="text-white/45">{item.track.artist}</div>
                  </div>
                  <div>
                    <Badge>{formatQueueStatus(item.status)}</Badge>
                    <div className="mt-2 text-white/45 tabular-nums">#{item.position}</div>
                  </div>
                  <div className="text-white/45 tabular-nums">{formatDateTime(item.createdAt)}</div>
                  <QueueControls venueId={venue.id} itemId={item.id} status={item.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </AdminShell>
  );
}
