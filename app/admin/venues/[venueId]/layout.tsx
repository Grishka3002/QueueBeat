import { redirect } from "next/navigation";

import { CabinetShell } from "@/components/admin/cabinet-shell";
import { canManageVenue, getSessionOwner } from "@/lib/auth";
import { getAdminVenueById } from "@/lib/data";
import { getDemoOwnerForVenue } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { tariffOf } from "@/lib/tariffs";

export default async function VenueCabinetLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!(await canManageVenue(venueId))) {
    redirect("/login");
  }

  const data = await getAdminVenueById(venueId);
  const { venue } = data;
  const tariff = tariffOf("tariff" in venue ? (venue.tariff as string) : "start");

  const owner = await getSessionOwner();
  const ownerName =
    owner?.name ?? (env.demoMode ? getDemoOwnerForVenue(venueId)?.name ?? null : null);

  return (
    <CabinetShell
      venue={{
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        isAcceptingRequests: venue.isAcceptingRequests,
        tariffName: tariff.name,
        commissionPct: tariff.commissionPct
      }}
      ownerName={ownerName}
    >
      {children}
    </CabinetShell>
  );
}
