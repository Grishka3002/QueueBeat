import { notFound, redirect } from "next/navigation";

import AdminVenuePage from "@/app/admin/venues/[venueId]/page";
import { requireVenueOwner } from "@/lib/auth";

export default async function DashboardVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const user = await requireVenueOwner();
  const { venueId } = await params;
  const venue = user.venues.find((item) => item.id === venueId);

  if (!venue) {
    notFound();
  }

  if (venue.verificationStatus !== "VERIFIED") {
    redirect("/dashboard");
  }

  return <AdminVenuePage params={Promise.resolve({ venueId })} />;
}
