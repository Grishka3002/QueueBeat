import type { Route } from "next";
import Link from "next/link";

import { QueueControls } from "@/components/admin/queue-controls";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { isSubscriptionUsable } from "@/lib/commercial";
import { getAdminVenueById } from "@/lib/data";
import { formatDateTime, formatPrice } from "@/lib/utils";

function formatQueueStatus(status: "QUEUED" | "PLAYED" | "REMOVED") {
  const labels = {
    QUEUED: "в очереди",
    PLAYED: "проиграно",
    REMOVED: "снято"
  };

  return labels[status];
}

export default async function AdminVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
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
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Оплаченные заявки</div>
          <div className="mt-2 font-display text-[26px] font-bold text-white">
            {analytics.paidOrdersCount}
          </div>
          <div className="mt-1 font-mono text-[11px] text-white/45">за последние 14 дней</div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Оборот</div>
          <div className="mt-2 font-display text-[22px] font-bold text-accent">
            {formatPrice(grossCents)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-white/45">до вычета комиссии</div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Сейчас в очереди</div>
          <div className="mt-2 font-display text-[26px] font-bold text-white">{queuedItems.length}</div>
          <div className="mt-1 font-mono text-[11px] text-white/45">дальше — фоновый плейлист</div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Баланс к выплате</div>
          <div className="mt-2 font-display text-[22px] font-bold text-white">
            {formatPrice(analytics.balanceCents)}
          </div>
          <Link href={`${baseHref}/payouts` as Route} className="mt-1 inline-block font-mono text-[11px] text-cyan">
            к выплатам →
          </Link>
        </div>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[18px] border border-line bg-panel p-5">
          <RevenueChart dailyOrders={analytics.dailyOrders} />
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="rounded-[18px] border border-line bg-panel p-5">
            <div className="text-[15px] font-bold text-white">Что важно сейчас</div>
            <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3">
                <span className="text-white/55">Приём заявок</span>
                <span className={venue.isAcceptingRequests ? "font-semibold text-cyan" : "font-semibold text-warn"}>
                  {venue.isAcceptingRequests ? "включён" : "на паузе"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3">
                <span className="text-white/55">Цена заявки</span>
                <span className="font-mono font-semibold text-white">{formatPrice(venue.requestPriceCents)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3">
                <span className="text-white/55">Треков доступно гостям</span>
                <span className="font-mono font-semibold text-white">{venue.venueTracks.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3">
                <span className="text-white/55">QR-код</span>
                <span className={subscriptionActive ? "font-semibold text-cyan" : "font-semibold text-warn"}>
                  {subscriptionActive ? "активен" : "заблокирован"}
                </span>
              </div>
            </div>
            <Link href={`${baseHref}/settings` as Route} className="primary-action mt-4 w-full px-5 py-3 text-sm">
              Перейти в настройки
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[15px] font-bold text-white">Текущая очередь</div>
          <span className="font-mono text-[11.5px] text-white/45">{queuedItems.length} активных заявок</span>
        </div>

        {queuedItems.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
            Очередь пока пустая — играет фоновый плейлист. Новые оплаченные заявки появятся здесь.
          </div>
        ) : (
          <div className="mt-2 flex flex-col">
            {queuedItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b border-hairline py-3.5 last:border-none md:flex-row md:items-center"
              >
                <span className="w-8 flex-none font-mono text-xs text-white/40">
                  #{item.position}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{item.track.title}</div>
                  <div className="text-xs text-white/45">{item.track.artist}</div>
                </div>
                <span className="mono-chip">{formatQueueStatus(item.status)}</span>
                <span className="w-36 font-mono text-xs text-white/45">{formatDateTime(item.createdAt)}</span>
                <QueueControls venueId={venue.id} itemId={item.id} status={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
