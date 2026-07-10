import { redirect } from "next/navigation";

export default async function PlatformVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  redirect(`/admin/venues/${venueId}`);
}
