import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";

export function AdminShell({
  title,
  description,
  children,
  badge = "Админ",
  homeHref = "/admin" as Route,
  homeLabel = "Мои заведения",
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
        <SectionCard className="page-enter overflow-hidden bg-hero-radial">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>{badge}</Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm text-white/70">
              <Link className="secondary-action" href={homeHref}>
                {homeLabel}
              </Link>
              <Link className="secondary-action" href={previewHref}>
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
