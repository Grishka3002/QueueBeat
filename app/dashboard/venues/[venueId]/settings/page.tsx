import { redirect } from "next/navigation";

export default async function DashboardVenueSettingsPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  redirect(`/admin/venues/${venueId}/settings`);
}
