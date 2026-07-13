import { getAdminVenueById } from "@/lib/data";
import { getDemoPlaybackLog, getDemoVenueOrders } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/utils";

const DAY_LABELS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

export default async function VenueStatsPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const data = await getAdminVenueById(venueId);
  const { venue } = data;

  // агрегируем оплаченные заявки за 7 дней
  const paidOrders = env.demoMode
    ? getDemoVenueOrders(venueId).filter((order) => order.status === "PAID")
    : venue.queueItems.map((item) => ({
        amountCents: "order" in item ? item.order.amountCents : 0,
        paidAt: item.createdAt,
        createdAt: item.createdAt,
        track: item.track
      }));

  const now = new Date();
  const days: { label: string; count: number; isToday: boolean }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const count = paidOrders.filter((order) => {
      const at = order.paidAt ?? order.createdAt;
      return at >= day && at < next;
    }).length;
    days.push({ label: DAY_LABELS[day.getDay()], count, isToday: offset === 0 });
  }
  const maxCount = Math.max(1, ...days.map((day) => day.count));

  const totalCount = paidOrders.length;
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amountCents, 0);
  const avgCheck = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

  // топ треков по заявкам
  const byTrack = new Map<string, { title: string; count: number }>();
  for (const order of paidOrders) {
    if (!order.track) {
      continue;
    }
    const key = `${order.track.title} — ${order.track.artist}`;
    const entry = byTrack.get(key) ?? { title: key, count: 0 };
    entry.count += 1;
    byTrack.set(key, entry);
  }
  const topTracks = [...byTrack.values()].sort((left, right) => right.count - left.count).slice(0, 5);

  // источник проигрываний из журнала
  const log = env.demoMode ? getDemoPlaybackLog(venueId, 200) : [];
  const requestPlays = log.filter((entry) => entry.source === "request").length;
  const requestShare = log.length > 0 ? Math.round((requestPlays / log.length) * 100) : 0;

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Заявок оплачено</div>
          <div className="mt-2 font-display text-[26px] font-bold text-white">{totalCount}</div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Выручка с заявок</div>
          <div className="mt-2 whitespace-nowrap font-display text-[22px] font-bold text-accent">
            {formatPrice(totalRevenue)}
          </div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Средний чек</div>
          <div className="mt-2 font-display text-[26px] font-bold text-white">
            {formatPrice(avgCheck)}
          </div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="text-xs text-white/50">Треков в плейлисте</div>
          <div className="mt-2 font-display text-[26px] font-bold text-white">
            {venue.venueTracks.length}
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[15px] font-bold text-white">Заявки за неделю</div>
          <span className="font-mono text-[11.5px] text-white/45">
            {totalCount} заявок · {formatPrice(totalRevenue)}
          </span>
        </div>
        <div className="mt-4 flex h-[150px] items-end gap-3">
          {days.map((day, index) => (
            <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="font-mono text-[10.5px] text-white/55">{day.count}</div>
              <div
                className="w-full max-w-[38px] rounded-t-[7px] rounded-b-[3px]"
                style={{
                  height: `${Math.max(6, Math.round((day.count / maxCount) * 100))}%`,
                  background: day.isToday
                    ? "#F849A6"
                    : day.count === maxCount && day.count > 0
                      ? "rgba(91,215,232,0.75)"
                      : "rgba(255,255,255,0.14)",
                  boxShadow: day.isToday ? "0 6px 22px rgba(248,73,166,0.35)" : "none"
                }}
              />
              <div
                className="font-mono text-[10.5px]"
                style={{ color: day.isToday ? "#F849A6" : "rgba(242,241,247,0.45)" }}
              >
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="rounded-[18px] border border-line bg-panel p-5">
          <div className="text-[15px] font-bold text-white">Топ треков по заявкам</div>
          {topTracks.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
              Появится после первых оплаченных заявок.
            </div>
          ) : (
            <div className="mt-3.5 flex flex-col gap-[11px]">
              {topTracks.map((track, index) => (
                <div key={track.title} className="flex items-center gap-[11px]">
                  <span className="w-[18px] font-mono text-[11px] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-white">{track.title}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((track.count / topTracks[0].count) * 100)}%`,
                          background: index === 0 ? "#F849A6" : "rgba(91,215,232,0.6)"
                        }}
                      />
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[11.5px] text-white/55">
                    {track.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-line bg-panel p-5">
          <div className="text-[15px] font-bold text-white">Источник проигрываний</div>
          {log.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
              Данные копятся из журнала воспроизведений плеера.
            </div>
          ) : (
            <>
              <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full">
                <span style={{ width: `${requestShare}%`, background: "#F849A6" }} />
                <span style={{ width: `${100 - requestShare}%`, background: "rgba(255,255,255,0.14)" }} />
              </div>
              <div className="mt-3 flex flex-col gap-2 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="flex-1 text-white/75">Заявки гостей</span>
                  <span className="font-mono text-white/55">{requestShare} %</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/30" />
                  <span className="flex-1 text-white/75">Фоновый плейлист</span>
                  <span className="font-mono text-white/55">{100 - requestShare} %</span>
                </div>
              </div>
              <div className="mt-3.5 border-t border-line pt-3 text-xs leading-relaxed text-white/50">
                По {log.length} последним проигрываниям из журнала.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
