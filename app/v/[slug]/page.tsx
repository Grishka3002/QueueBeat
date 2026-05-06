import { VenueClient } from "@/components/public/venue-client";
import { Badge } from "@/components/ui/badge";
import { getVenueOr404 } from "@/lib/data";
import { isSubscriptionUsable } from "@/lib/commercial";

export default async function VenuePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueOr404(slug);
  const qrIsActive = isSubscriptionUsable(venue);

  if (!qrIsActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080910] px-5 py-10 text-white">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-glow backdrop-blur">
          <Badge tone="warning">QR-код на паузе</Badge>
          <h1 className="mt-5 text-3xl font-semibold">{venue.name}</h1>
          <p className="mt-4 leading-7 text-white/60">
            Это заведение временно не принимает музыкальные заявки. QR-ссылка снова заработает,
            когда подписка заведения станет активной.
          </p>
        </div>
      </main>
    );
  }

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
