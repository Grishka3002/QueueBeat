import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

export function VenueNav({
  baseHref,
  active
}: {
  baseHref: Route;
  active: "overview" | "settings";
}) {
  const links: { href: Route; label: string; key: "overview" | "settings" }[] = [
    { href: baseHref, label: "Обзор", key: "overview" },
    { href: `${baseHref}/settings` as Route, label: "Настройки", key: "settings" }
  ];

  return (
    <nav className="flex flex-wrap gap-2 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-2">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            active === link.key
              ? "bg-white text-black"
              : "text-white/55 hover:bg-white/5 hover:text-white"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
