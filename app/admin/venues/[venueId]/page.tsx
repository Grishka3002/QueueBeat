import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { QueueControls } from "@/components/admin/queue-controls";
import { PresetApplyButton } from "@/components/admin/preset-apply-button";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { TrackPickerForm } from "@/components/admin/track-picker-form";
import { VenueSettingsForm } from "@/components/admin/venue-settings-form";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { canManageVerifiedVenue, isAdminAuthenticated } from "@/lib/auth";
import { isSubscriptionUsable } from "@/lib/commercial";
import { getAdminVenueById } from "@/lib/data";
import { formatDateTime, formatPrice } from "@/lib/utils";

function formatQueueStatus(status: "QUEUED" | "PLAYED" | "REMOVED") {
  const labels = {
    QUEUED: "В очереди",
    PLAYED: "Проигран",
    REMOVED: "Удалён"
  };

  return labels[status];
}

function formatSubscriptionStatus(status: string) {
  const labels: Record<string, string> = {
    TRIAL: "Пробный период",
    ACTIVE: "Активна",
    PAST_DUE: "Есть задолженность",
    CANCELED: "Отменена"
  };

  return labels[status] ?? status;
}

export default async function AdminVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    redirect("/login");
  }

  const data = await getAdminVenueById(venueId);
  const { venue, allTracks } = data;
  const isPlatform = await isAdminAuthenticated();
  const presets = "presets" in data ? data.presets : [];
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
  const latestSubscription = "subscriptions" in venue ? venue.subscriptions[0] : null;
  const subscriptionActive = isSubscriptionUsable(venue);
  const platformFeeBps = "platformFeeBps" in venue ? venue.platformFeeBps : 2000;

  return (
    <AdminShell
      badge="Заведение"
      title={venue.name}
      description="Настройки заведения, разрешённый плейлист, QR-код, подписка и живая очередь заявок."
      homeHref={isPlatform ? "/platform" : "/dashboard"}
      homeLabel={isPlatform ? "Платформа" : "Кабинет"}
      previewHref={`/v/${venue.slug}` as Route}
    >
      <div className="grid gap-5 md:grid-cols-4">
        <SectionCard>
          <div className="text-sm text-white/45">Статус QR-кода</div>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={subscriptionActive ? "success" : "danger"}>
              {subscriptionActive ? "Активен" : "Заблокирован"}
            </Badge>
          </div>
          <div className="mt-3 text-xs leading-5 text-white/45">
            {subscriptionActive
              ? "Гости могут открыть QR-страницу и заказать трек."
              : "Гости увидят страницу-паузу, пока подписка не активна."}
          </div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Баланс к выплате</div>
          <div className="mt-2 text-3xl font-semibold">{formatPrice(analytics.balanceCents)}</div>
          <div className="mt-2 text-xs text-white/40">Доля заведения после комиссии платформы.</div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Оплаченные заявки за 14 дней</div>
          <div className="mt-2 text-3xl font-semibold">{analytics.paidOrdersCount}</div>
          <div className="mt-2 text-xs text-white/40">
            Оборот: {formatPrice(analytics.venueRevenueCents + analytics.platformFeesCents)}
          </div>
        </SectionCard>
        <SectionCard>
          <div className="text-sm text-white/45">Комиссия платформы</div>
          <div className="mt-2 text-3xl font-semibold">{platformFeeBps / 100}%</div>
          <div className="mt-2 text-xs text-white/40">Текущий сплит: заведению {100 - platformFeeBps / 100}%.</div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.7fr_0.7fr_1fr]">
        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Настройки</h2>
              <Badge tone={venue.isAcceptingRequests ? "success" : "warning"}>
                {venue.isAcceptingRequests ? "Приём включён" : "Приём на паузе"}
              </Badge>
            </div>
            <VenueSettingsForm
              venue={{
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                requestPriceCents: venue.requestPriceCents,
                isAcceptingRequests: venue.isAcceptingRequests
              }}
            />
            <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4 text-sm text-white/55">
              Ссылка для гостей:{" "}
              <Link href={`/v/${venue.slug}`} className="text-white underline underline-offset-4">
                /v/{venue.slug}
              </Link>
              <div className="mt-2">Цена заявки: {formatPrice(venue.requestPriceCents)}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">QR-код</h2>
              {subscriptionActive ? (
                <a
                  href={`/api/admin/venues/${venue.id}/qr?download=1`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
                >
                  Скачать PNG
                </a>
              ) : null}
            </div>
            {subscriptionActive ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white p-5">
                <Image
                  src={`/api/admin/venues/${venue.id}/qr`}
                  alt={`QR-код для ${venue.name}`}
                  width={320}
                  height={320}
                  unoptimized
                  className="mx-auto aspect-square w-full max-w-xs rounded-[1.2rem]"
                />
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100/80">
                Генерация QR-кода закрыта, пока у заведения нет активной подписки или пробного периода.
              </div>
            )}
            <div className="text-sm leading-6 text-white/55">
              Этот QR-код открывает публичную страницу для гостей. Его можно распечатать и разместить на столах.
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/55">
              <div className="font-semibold text-white">Подписка</div>
              <div className="mt-1">
                {latestSubscription
                  ? `${formatSubscriptionStatus(latestSubscription.status)} до ${formatDateTime(latestSubscription.currentPeriodEnd)}`
                  : "Активной подписки пока нет."}
              </div>
              <div className="mt-4">
                <SubscriptionActions venueId={venue.id} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Разрешённые треки</h2>
            <TrackPickerForm
              venueId={venue.id}
              selectedTrackIds={venue.venueTracks.map((item) => item.trackId)}
              allTracks={allTracks}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Пресеты плейлистов</h2>
            {presets.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-white/10 p-5 text-sm text-white/45">
                Пресеты пока не настроены.
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div key={preset.id} className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold">{preset.name}</div>
                        <div className="mt-1 text-sm leading-6 text-white/50">{preset.description}</div>
                        <div className="mt-1 text-xs text-white/35">{preset.presetTracks.length} треков</div>
                      </div>
                      <PresetApplyButton venueId={venue.id} presetId={preset.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Заявки по дням</h2>
            {Object.keys(analytics.dailyOrders).length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-white/10 p-5 text-sm text-white/45">
                За последние 14 дней ещё не было оплаченных заявок.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(analytics.dailyOrders).map(([day, item]) => (
                  <div
                    key={day}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <span className="text-white/70">{day}</span>
                    <span className="text-white/45">{item.orders} заявок</span>
                    <span className="font-semibold">{formatPrice(item.grossCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Очередь заведения</h2>
          {venue.queueItems.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/10 p-5 text-sm text-white/45">
              Очередь пока пустая.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/35">
                <span>Трек</span>
                <span>Статус</span>
                <span>Позиция</span>
                <span>Добавлен</span>
                <span>Действие</span>
              </div>
              <div className="divide-y divide-white/10">
                {venue.queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-white/75 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr]"
                  >
                    <div>
                      <div className="font-medium text-white">{item.track.title}</div>
                      <div className="text-white/45">{item.track.artist}</div>
                    </div>
                    <div>
                      <Badge
                        tone={
                          item.status === "PLAYED"
                            ? "success"
                            : item.status === "REMOVED"
                              ? "danger"
                              : "default"
                        }
                      >
                        {formatQueueStatus(item.status)}
                      </Badge>
                    </div>
                    <div>{item.position}</div>
                    <div className="text-white/45">{formatDateTime(item.createdAt)}</div>
                    <QueueControls venueId={venue.id} itemId={item.id} status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AdminShell>
  );
}
