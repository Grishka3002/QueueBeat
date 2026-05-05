import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireVenueOwner } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireVenueOwner();
  const venue = user.venues[0];

  if (!venue) {
    return (
      <AdminShell
        badge="Venue"
        title="No venue connected"
        description="This account does not have a venue yet. Register a venue again or contact platform support."
        homeHref="/dashboard"
        homeLabel="Dashboard"
      >
        <SectionCard>
          <Link href="/register" className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white">
            Register venue
          </Link>
        </SectionCard>
      </AdminShell>
    );
  }

  if (venue.verificationStatus === "VERIFIED") {
    redirect(`/dashboard/venues/${venue.id}`);
  }

  return (
    <AdminShell
      badge="Venue"
      title={`${venue.name} is awaiting verification`}
      description="A platform admin must verify your venue before playlist, queue, and QR management becomes available."
      homeHref="/dashboard"
      homeLabel="Dashboard"
      previewHref={`/v/${venue.slug}` as Route}
    >
      <SectionCard>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge tone={venue.verificationStatus === "REJECTED" ? "danger" : "warning"}>
              {venue.verificationStatus}
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold">{venue.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Public link reserved: <span className="text-white">/v/{venue.slug}</span>. Requests stay paused until
              verification is complete.
            </p>
          </div>
          <Link
            href={`/v/${venue.slug}` as Route}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 hover:bg-white/5"
          >
            Preview guest page
          </Link>
        </div>
      </SectionCard>
    </AdminShell>
  );
}
