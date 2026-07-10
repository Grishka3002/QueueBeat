import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

export function VenueNav({
  baseHref,
  active
}: {
  baseHref: Route;
  active: "overview" | "settings" | "remote";
}) {
  const links: { href: Route; label: string; key: "overview" | "settings" | "remote" }[] = [
    { href: baseHref, label: "Обзор", key: "overview" },
    { href: `${baseHref}/remote` as Route, label: "Пульт", key: "remote" },
    { href: `${baseHref}/settings` as Route, label: "Настройки", key: "settings" }
  ];

  const venueId = String(baseHref).split("/").pop() ?? "";

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-[1.55rem] border border-line bg-white/[0.035] p-2">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={cn(
            "min-h-10 rounded-full px-4 py-2 text-sm font-semibold transition-[transform,background-color,color] duration-150 ease-silk active:scale-[0.96]",
            active === link.key
              ? "bg-accent text-ink"
              : "text-white/60 hover:bg-white/[0.07] hover:text-white"
          )}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href={`/player/${venueId}` as Route}
        target="_blank"
        className="ml-auto min-h-10 rounded-full border border-dashed border-accent/40 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/[0.06]"
      >
        плеер заведения ↗
      </Link>
    </nav>
  );
}
