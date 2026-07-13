import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/admin/logout-button";
import { getSessionOwner, isAdminAuthenticated } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";
import { tariffOf } from "@/lib/tariffs";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  const owner = await getSessionOwner();
  const isPlatform = await isAdminAuthenticated();

  if (!owner && !isPlatform) {
    redirect("/login");
  }

  const dashboard = await getAdminDashboard();
  const venues = owner
    ? dashboard.venues.filter((venue) => owner.venueIds.includes(venue.id))
    : dashboard.venues;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-[13px] font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
            <span className="font-mono text-[10px] text-white/45">кабинет</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {owner ? (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/45 bg-accent/[0.14] font-mono text-[11px] text-accent">
                  {owner.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="text-[12.5px] font-semibold text-white/80">{owner.name}</div>
              </div>
            ) : (
              <span className="mono-chip">платформа</span>
            )}
            <LogoutButton />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-panel bg-hero-glow p-7">
          <h1 className="font-display text-[26px] font-bold text-white">
            {venues.length === 1 ? "Моё заведение" : "Мои заведения"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
            Выберите заведение: плейлист, цена заявки, очередь, статистика, выплаты и пульт смены — внутри.
          </p>
        </div>

        <div className="grid gap-3.5">
          {venues.map((venue) => {
            const tariff = tariffOf(venue.tariff);
            return (
              <Link
                key={venue.id}
                href={`/admin/venues/${venue.id}` as Route}
                className="group flex flex-col gap-4 rounded-[20px] border border-line bg-panel p-5 transition-colors hover:border-accent/40 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-display text-lg font-bold text-white">{venue.name}</div>
                    <span
                      className={
                        venue.isAcceptingRequests
                          ? "mono-chip border-cyan/40 text-cyan"
                          : "mono-chip border-warn/45 text-warn"
                      }
                    >
                      {venue.isAcceptingRequests ? "приём открыт" : "приём закрыт"}
                    </span>
                    <span className="mono-chip">
                      тариф «{tariff.name}» · {tariff.commissionPct} %
                    </span>
                  </div>
                  <div className="font-mono text-xs text-white/45">
                    /v/{venue.slug} · заявка {formatPrice(venue.requestPriceCents)}
                  </div>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-white/55">
                    <span>{venue._count.venueTracks} треков</span>
                    <span>{venue._count.queueItems} в очереди</span>
                    <span>{venue._count.orders} заказов</span>
                  </div>
                </div>
                <span className="secondary-action px-4 py-2 text-sm group-hover:border-accent/50">
                  Открыть кабинет →
                </span>
              </Link>
            );
          })}
          {venues.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-white/[0.14] bg-panel p-8 text-center text-sm text-white/45">
              У этого аккаунта пока нет заведений.{" "}
              <Link href="/register" className="text-cyan hover:text-[#A5EFF8]">
                Зарегистрировать заведение
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
