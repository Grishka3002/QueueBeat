import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddTrackForm } from "@/components/admin/add-track-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { LibrarySyncButton } from "@/components/admin/library-sync-button";
import { PresetApplyButton } from "@/components/admin/preset-apply-button";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { TrackPickerForm } from "@/components/admin/track-picker-form";
import { VibePlaylistForm } from "@/components/admin/vibe-playlist-form";
import { VenueNav } from "@/components/admin/venue-nav";
import { VenueSettingsForm } from "@/components/admin/venue-settings-form";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { canManageVerifiedVenue } from "@/lib/auth";
import { isSubscriptionUsable } from "@/lib/commercial";
import { getAdminVenueById } from "@/lib/data";
import { env, isMusicLibraryConfigured } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/utils";

function formatSubscriptionStatus(status: string) {
  const labels: Record<string, string> = {
    TRIAL: "Пробный период",
    ACTIVE: "Активна",
    PAST_DUE: "Есть задолженность",
    CANCELED: "Отменена"
  };

  return labels[status] ?? status;
}

export default async function AdminVenueSettingsPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!env.demoMode && !(await canManageVerifiedVenue(venueId))) {
    redirect("/admin/login");
  }

  const data = await getAdminVenueById(venueId);
  const { venue, allTracks } = data;
  const presets = "presets" in data ? data.presets : [];
  const baseHref = `/admin/venues/${venue.id}` as Route;
  const subscriptionActive = isSubscriptionUsable(venue);
  const latestSubscription = "subscriptions" in venue ? venue.subscriptions[0] : null;
  const selectedTrackIds = venue.venueTracks.map((item) => item.trackId);
  const musicLibraryUnavailableReason = env.demoMode
    ? "Синхронизация появится после настройки основной БД и переключения DEMO_MODE в false."
    : !isMusicLibraryConfigured
      ? "Подключение не настроено: добавьте MUSIC_LIBRARY_URL и MUSIC_LIBRARY_API_KEY в .env.local основного приложения."
      : null;

  return (
    <AdminShell
      badge="Настройки"
      title={venue.name}
      description="Цена заявки, QR-код, подписка и музыкальная витрина заведения."
      homeHref="/admin"
      homeLabel="Мои заведения"
      previewHref={`/v/${venue.slug}` as Route}
    >
      <VenueNav baseHref={baseHref} active="settings" />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Основные настройки</h2>
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
            <div className="surface-tile rounded-[1.2rem] p-4 text-sm text-white/55">
              Ссылка для гостей:{" "}
              <Link
                href={`/v/${venue.slug}`}
                className="text-white underline underline-offset-4 transition-[color] duration-150 hover:text-fuchsia-200"
              >
                /v/{venue.slug}
              </Link>
              <div className="mt-2">Цена заявки: {formatPrice(venue.requestPriceCents)}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">QR-код</h2>
                {subscriptionActive ? (
                  <a href={`/api/admin/venues/${venue.id}/qr?download=1`} className="secondary-action px-4 py-2 text-sm">
                    Скачать PNG
                  </a>
                ) : null}
              </div>
              {subscriptionActive ? (
                <div className="rounded-[1.7rem] bg-white p-5 shadow-[0_18px_54px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.12)]">
                  <Image
                    src={`/api/admin/venues/${venue.id}/qr`}
                    alt={`QR-код для ${venue.name}`}
                    width={320}
                    height={320}
                    priority
                    unoptimized
                    className="mx-auto aspect-square w-full max-w-xs rounded-[1.2rem]"
                  />
                </div>
              ) : (
                <div className="status-message border border-dashed border-amber-300/25 bg-amber-300/10 text-sm leading-6 text-amber-100/80">
                  QR-код закрыт, пока у заведения нет активной подписки или пробного периода.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="surface-tile rounded-[1.2rem] p-4 text-sm leading-6 text-white/55">
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
              <div className="surface-tile rounded-[1.2rem] p-4 text-sm leading-6 text-white/55">
                QR-код ведёт на публичную страницу заведения. Если подписка закончится, гости увидят аккуратную страницу-паузу.
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Пресеты плейлистов</h2>
            {presets.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
                Пресеты пока не настроены.
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div key={preset.id} className="surface-tile rounded-[1.3rem] p-4">
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
          <AddTrackForm venueId={venue.id} />
        </SectionCard>
      </div>

      <SectionCard>
        <VibePlaylistForm venueId={venue.id} />
      </SectionCard>

      <SectionCard>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Музыкальная витрина</h2>
              <p className="mt-1 text-sm text-white/50">
                Новые лицензированные треки появляются здесь после синхронизации.
              </p>
            </div>
            <LibrarySyncButton venueId={venue.id} unavailableReason={musicLibraryUnavailableReason} />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-white/50">
            Глобальный каталог может быть большим, но гость видит только выбранный заведением плейлист. Это защищает UX:
            меньше случайных песен, быстрее выбор и понятнее музыкальная политика площадки.
          </p>
          <TrackPickerForm
            key={selectedTrackIds.join("-")}
            venueId={venue.id}
            selectedTrackIds={selectedTrackIds}
            allTracks={allTracks}
          />
        </div>
      </SectionCard>
    </AdminShell>
  );
}
