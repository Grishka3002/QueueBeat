import { redirect } from "next/navigation";

export default async function DashboardVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  redirect(`/admin/venues/${venueId}`);
}
