import { redirect } from "next/navigation";

export default async function PlatformVenueSettingsPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  redirect(`/admin/venues/${venueId}/settings`);
}
