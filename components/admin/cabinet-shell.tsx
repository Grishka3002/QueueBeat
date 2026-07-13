"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

type ShellVenue = {
  id: string;
  name: string;
  slug: string;
  isAcceptingRequests: boolean;
  tariffName: string;
  commissionPct: number;
};

const SECTIONS: { suffix: string; label: string; icon: string }[] = [
  { suffix: "", label: "Обзор", icon: "◧" },
  { suffix: "/stats", label: "Статистика", icon: "∿" },
  { suffix: "/settings", label: "Плейлист и настройки", icon: "♪" },
  { suffix: "/qr", label: "QR-точки", icon: "▦" },
  { suffix: "/payouts", label: "Выплаты", icon: "₽" },
  { suffix: "/legal", label: "Юр. чистота", icon: "§" }
];

const TITLES: Record<string, string> = {
  "": "Обзор",
  "/stats": "Статистика",
  "/settings": "Плейлист и настройки",
  "/qr": "QR-точки",
  "/payouts": "Выплаты",
  "/legal": "Юридическая чистота"
};

export function CabinetShell({
  venue,
  ownerName,
  children
}: {
  venue: ShellVenue;
  ownerName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const base = `/admin/venues/${venue.id}`;
  const suffix = pathname.startsWith(base) ? pathname.slice(base.length) : "";

  // пульт — самостоятельный мобильный экран, каркас кабинета ему не нужен
  if (suffix.startsWith("/remote")) {
    return <>{children}</>;
  }

  const sectionTitle = TITLES[suffix] ?? "Кабинет";
  const initials = (ownerName ?? "Владелец")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-[232px] flex-none flex-col gap-1 border-r border-line px-3.5 py-[22px] lg:flex">
        <div className="flex items-baseline gap-2 px-2.5 pb-1.5">
          <span className="font-display text-[13px] font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
          <span className="font-mono text-[10px] text-white/45">кабинет</span>
        </div>
        <Link href={"/admin" as Route} className="px-2.5 pb-3 font-mono text-[10.5px] text-white/40 hover:text-white/70">
          ← мои заведения
        </Link>

        {SECTIONS.map((section) => {
          const active = suffix === section.suffix;
          return (
            <Link
              key={section.suffix}
              href={`${base}${section.suffix}` as Route}
              className={cn(
                "flex items-center gap-[11px] rounded-xl border px-3 py-[11px] text-sm font-semibold",
                active
                  ? "border-accent/40 bg-accent/[0.11] text-white"
                  : "border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white/80"
              )}
            >
              <span className="w-[18px] text-center text-sm">{section.icon}</span>
              <span className="flex-1">{section.label}</span>
              {active ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-2.5">
          <Link
            href={`/v/${venue.slug}` as Route}
            target="_blank"
            className="block rounded-xl border border-dashed border-cyan/40 px-3 py-[11px] text-xs leading-normal text-cyan hover:bg-white/[0.04]"
          >
            страница гостя ↗<br />
            <span className="text-white/45">как видят посетители</span>
          </Link>
          <Link
            href={`/player/${venue.id}` as Route}
            target="_blank"
            className="block rounded-xl border border-dashed border-accent/40 px-3 py-[11px] text-xs leading-normal text-white/80 hover:bg-white/[0.04]"
          >
            плеер заведения ↗<br />
            <span className="text-white/45">устройство у колонок</span>
          </Link>
          <Link
            href={`${base}/remote` as Route}
            className="block rounded-xl border border-dashed border-accent/40 px-3 py-[11px] text-xs leading-normal text-white/80 hover:bg-white/[0.04]"
          >
            пульт смены ↗<br />
            <span className="text-white/45">громкость и очередь с телефона</span>
          </Link>
          <div className="flex items-center gap-2.5 border-t border-line px-2.5 pt-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-accent/45 bg-accent/[0.14] font-mono text-[11px] text-accent">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-white">
                {ownerName ?? "Платформа"}
              </div>
              <div className="text-[10.5px] text-white/45">{ownerName ? "владелец" : "админ"}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center gap-3.5 border-b border-line bg-[rgba(11,11,18,0.85)] px-5 py-4 backdrop-blur-lg lg:px-7">
          <Link href={"/admin" as Route} className="font-display text-[11px] font-bold tracking-[3px] text-cyan lg:hidden">
            ТРЕКНИ
          </Link>
          <div className="font-display text-base font-bold text-white">{sectionTitle}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="mono-chip hidden sm:inline-flex">
              тариф «{venue.tariffName}» · комиссия {venue.commissionPct} %
            </span>
            <span
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-[7px] text-[12.5px] font-semibold",
                venue.isAcceptingRequests
                  ? "border-cyan/50 bg-cyan/[0.07] text-cyan"
                  : "border-warn/50 bg-warn/[0.07] text-warn"
              )}
            >
              <span
                className={cn("h-[7px] w-[7px] rounded-full", venue.isAcceptingRequests ? "bg-cyan" : "bg-warn")}
              />
              {venue.isAcceptingRequests ? "приём открыт" : "приём закрыт"}
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-white/[0.12] px-3.5 py-[7px] text-[13px] font-semibold md:flex">
              <span className="h-[7px] w-[7px] rounded-full bg-accent" />
              {venue.name}
            </span>
          </div>
        </div>

        {/* мобильная навигация по разделам */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2 lg:hidden">
          {SECTIONS.map((section) => {
            const active = suffix === section.suffix;
            return (
              <Link
                key={section.suffix}
                href={`${base}${section.suffix}` as Route}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold",
                  active ? "bg-accent text-ink" : "border border-white/[0.13] text-white/60"
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>

        <div className="flex max-w-[1080px] flex-col gap-4 px-5 pb-10 pt-6 lg:px-7">{children}</div>
      </div>
    </div>
  );
}
