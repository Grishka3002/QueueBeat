import { AddTrackForm } from "@/components/admin/add-track-form";
import { BrandingPicker } from "@/components/admin/branding-picker";
import { LibrarySyncButton } from "@/components/admin/library-sync-button";
import { PresetApplyButton } from "@/components/admin/preset-apply-button";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { TrackPickerForm } from "@/components/admin/track-picker-form";
import { VibePlaylistForm } from "@/components/admin/vibe-playlist-form";
import { VenueSettingsForm } from "@/components/admin/venue-settings-form";
import { getAdminVenueById } from "@/lib/data";
import { env, isMusicLibraryConfigured } from "@/lib/env";
import { tariffOf } from "@/lib/tariffs";
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
  const data = await getAdminVenueById(venueId);
  const { venue, allTracks } = data;
  const presets = "presets" in data ? data.presets : [];
  const latestSubscription = "subscriptions" in venue ? venue.subscriptions[0] : null;
  const selectedTrackIds = venue.venueTracks.map((item) => item.trackId);
  const tariff = tariffOf("tariff" in venue ? (venue.tariff as string) : "start");
  const brandingUnlocked = tariff.id === "all";
  const accentColor = "accentColor" in venue ? (venue.accentColor as string) : "#F849A6";
  const musicLibraryUnavailableReason = env.demoMode
    ? "Синхронизация появится после настройки основной БД и переключения DEMO_MODE в false."
    : !isMusicLibraryConfigured
      ? "Подключение не настроено: добавьте MUSIC_LIBRARY_URL и MUSIC_LIBRARY_API_KEY в .env.local основного приложения."
      : null;

  return (
    <>
      <div className="grid gap-3.5 xl:grid-cols-2">
        <div className="rounded-[18px] border border-line bg-panel p-[22px]">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-bold text-white">Основные настройки</div>
            <span
              className={
                venue.isAcceptingRequests
                  ? "mono-chip border-cyan/40 text-cyan"
                  : "mono-chip border-warn/45 text-warn"
              }
            >
              {venue.isAcceptingRequests ? "приём открыт" : "приём закрыт"}
            </span>
          </div>
          <div className="mt-4">
            <VenueSettingsForm
              venue={{
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                requestPriceCents: venue.requestPriceCents,
                isAcceptingRequests: venue.isAcceptingRequests
              }}
            />
          </div>
          <div className="mt-4 rounded-xl bg-white/[0.04] p-3.5 text-sm text-white/55">
            Ссылка для гостей:{" "}
            <a href={`/v/${venue.slug}`} className="text-cyan hover:text-[#A5EFF8]" target="_blank">
              /v/{venue.slug}
            </a>
            <div className="mt-1.5 font-mono text-xs">цена заявки — {formatPrice(venue.requestPriceCents)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* брендинг */}
          <div
            className="rounded-[18px] bg-panel p-[22px]"
            style={{
              border: brandingUnlocked
                ? "1px solid rgba(248,73,166,0.4)"
                : "1px solid rgba(255,255,255,0.07)"
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="text-[15px] font-bold text-white">Брендинг страницы</div>
              <span
                className={
                  brandingUnlocked ? "mono-chip border-accent/50 text-accent" : "mono-chip"
                }
              >
                {brandingUnlocked ? "ТАРИФ «ВСЁ ВКЛЮЧЕНО»" : "🔒 ТАРИФ «ВСЁ ВКЛЮЧЕНО»"}
              </span>
            </div>
            {brandingUnlocked ? (
              <BrandingPicker venueId={venue.id} venueName={venue.name} initialAccent={accentColor} />
            ) : (
              <div className="mt-3 text-[13px] leading-relaxed text-white/55">
                Фирменный цвет гостевой страницы, плеера и пульта — на тарифе «Всё включено». Сейчас
                действует тариф «{tariff.name}» с комиссией {tariff.commissionPct} %.
              </div>
            )}
          </div>

          {/* подписка */}
          <div className="rounded-[18px] border border-line bg-panel p-[22px] text-sm leading-relaxed text-white/55">
            <div className="text-[15px] font-bold text-white">Подписка</div>
            <div className="mt-1.5">
              {latestSubscription
                ? `${formatSubscriptionStatus(latestSubscription.status)} до ${formatDateTime(latestSubscription.currentPeriodEnd)}`
                : "Активной подписки пока нет."}
            </div>
            <div className="mt-4">
              <SubscriptionActions venueId={venue.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[18px] border border-line bg-panel p-[22px]">
          <div className="text-[15px] font-bold text-white">Пресеты плейлистов</div>
          {presets.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
              Пресеты пока не настроены.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="rounded-2xl bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">{preset.name}</div>
                      <div className="mt-1 text-sm leading-relaxed text-white/50">{preset.description}</div>
                      <div className="mt-1 font-mono text-xs text-white/35">
                        {preset.presetTracks.length} треков
                      </div>
                    </div>
                    <PresetApplyButton venueId={venue.id} presetId={preset.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-line bg-panel p-[22px]">
          <AddTrackForm venueId={venue.id} />
        </div>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-[22px]">
        <VibePlaylistForm venueId={venue.id} />
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-[22px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[15px] font-bold text-white">Музыкальная витрина</div>
              <p className="mt-1 text-sm text-white/50">
                Новые лицензированные треки появляются здесь после синхронизации.
              </p>
            </div>
            <LibrarySyncButton venueId={venue.id} unavailableReason={musicLibraryUnavailableReason} />
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-white/50">
            Глобальный каталог может быть большим, но гость видит только выбранный заведением плейлист.
            Это защищает UX: меньше случайных песен, быстрее выбор и понятнее музыкальная политика
            площадки.
          </p>
          <TrackPickerForm
            key={selectedTrackIds.join("-")}
            venueId={venue.id}
            selectedTrackIds={selectedTrackIds}
            allTracks={allTracks}
          />
        </div>
      </div>
    </>
  );
}
