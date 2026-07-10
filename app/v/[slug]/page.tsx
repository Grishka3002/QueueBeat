import { VenueClient } from "@/components/public/venue-client";
import { getVenueOr404 } from "@/lib/data";
import { isSubscriptionUsable } from "@/lib/commercial";
import { env } from "@/lib/env";

export default async function VenuePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueOr404(slug);
  const qrIsActive = env.personalMode || isSubscriptionUsable(venue);

  if (!qrIsActive) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-7 text-center">
          <span className="mono-chip border-warn/45 text-warn">QR-код на паузе</span>
          <h1 className="mt-5 font-display text-2xl font-bold text-white">{venue.name}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Это заведение временно не принимает музыкальные заявки. QR-ссылка снова заработает,
            когда подписка заведения станет активной.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <VenueClient
        venue={{
          id: venue.id,
          name: venue.name,
          slug: venue.slug,
          address: venue.address,
          city: venue.city,
          accentColor: venue.accentColor,
          requestPriceCents: venue.requestPriceCents,
          isAcceptingRequests: venue.isAcceptingRequests
        }}
        personalMode={env.personalMode}
        tracks={venue.venueTracks.map((entry) => entry.track)}
      />
    </main>
  );
}
