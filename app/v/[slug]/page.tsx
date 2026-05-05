import { VenueClient } from "@/components/public/venue-client";
import { getVenueOr404 } from "@/lib/data";

export default async function VenuePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueOr404(slug);

  return (
    <main className="bg-[#080910]">
      <VenueClient
        venue={{
          id: venue.id,
          name: venue.name,
          slug: venue.slug,
          requestPriceCents: venue.requestPriceCents,
          isAcceptingRequests: venue.isAcceptingRequests
        }}
        tracks={venue.venueTracks.map((entry) => entry.track)}
        queue={venue.queueItems.map((item) => ({
          id: item.id,
          position: item.position,
          track: item.track
        }))}
      />
    </main>
  );
}
