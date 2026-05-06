import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";

export function AdminShell({
  title,
  description,
  children,
  badge = "Кабинет",
  homeHref = "/dashboard" as Route,
  homeLabel = "Кабинет",
  previewHref = "/v/velvet-room" as Route
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: string;
  homeHref?: Route;
  homeLabel?: string;
  previewHref?: Route;
}) {
  return (
    <div className="min-h-screen bg-[#080910] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <SectionCard className="overflow-hidden bg-hero-radial">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>{badge}</Badge>
              <div>
                <h1 className="text-3xl font-semibold">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm text-white/70">
              <Link className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/5" href={homeHref}>
                {homeLabel}
              </Link>
              <Link
                className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/5"
                href={previewHref}
              >
                Страница гостя
              </Link>
            </nav>
          </div>
        </SectionCard>

        {children}
      </div>
    </div>
  );
}
