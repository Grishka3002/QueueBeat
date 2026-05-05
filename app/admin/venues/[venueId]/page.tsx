import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { QueueControls } from "@/components/admin/queue-controls";
import { TrackPickerForm } from "@/components/admin/track-picker-form";
import { VenueSettingsForm } from "@/components/admin/venue-settings-form";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { canManageVerifiedVenue, isAdminAuthenticated } from "@/lib/auth";
import { getAdminVenueById } from "@/lib/data";
import { formatDateTime, formatPrice } from "@/lib/utils";

export default async function AdminVenuePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    redirect("/login");
  }

  const { venue, allTracks } = await getAdminVenueById(venueId);
  const isPlatform = await isAdminAuthenticated();

  return (
    <AdminShell
      badge="Venue"
      title={venue.name}
      description="Edit venue settings, manage approved tracks, and keep the live request queue tidy."
      homeHref={isPlatform ? "/platform" : "/dashboard"}
      homeLabel={isPlatform ? "Platform" : "Dashboard"}
      previewHref={`/v/${venue.slug}` as Route}
    >
      <div className="grid gap-5 xl:grid-cols-[0.7fr_0.7fr_1fr]">
        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Settings</h2>
              <Badge tone={venue.isAcceptingRequests ? "success" : "warning"}>
                {venue.isAcceptingRequests ? "Accepting requests" : "Requests paused"}
              </Badge>
            </div>
            <VenueSettingsForm
              venue={{
                id: venue.id,
                name: venue.name,
                slug: venue.slug,
                requestPriceCents: venue.requestPriceCents,
                isAcceptingRequests: venue.isAcceptingRequests
              }}
            />
            <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4 text-sm text-white/55">
              Guest link:{" "}
              <Link href={`/v/${venue.slug}`} className="text-white underline underline-offset-4">
                /v/{venue.slug}
              </Link>
              <div className="mt-2">Request price: {formatPrice(venue.requestPriceCents)}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">QR code</h2>
              <a
                href={`/api/admin/venues/${venue.id}/qr?download=1`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
              >
                Download PNG
              </a>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white p-5">
              <Image
                src={`/api/admin/venues/${venue.id}/qr`}
                alt={`QR for ${venue.name}`}
                width={320}
                height={320}
                unoptimized
                className="mx-auto aspect-square w-full max-w-xs rounded-[1.2rem]"
              />
            </div>
            <div className="text-sm leading-6 text-white/55">
              This QR code opens the public guest page. Print it or place it on tables.
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Approved tracks</h2>
            <TrackPickerForm
              venueId={venue.id}
              selectedTrackIds={venue.venueTracks.map((item) => item.trackId)}
              allTracks={allTracks}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Venue queue</h2>
          {venue.queueItems.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/10 p-5 text-sm text-white/45">
              The queue is empty for now.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr] gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/35">
                <span>Track</span>
                <span>Status</span>
                <span>Position</span>
                <span>Added</span>
                <span>Action</span>
              </div>
              <div className="divide-y divide-white/10">
                {venue.queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-white/75 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr]"
                  >
                    <div>
                      <div className="font-medium text-white">{item.track.title}</div>
                      <div className="text-white/45">{item.track.artist}</div>
                    </div>
                    <div>
                      <Badge
                        tone={
                          item.status === "PLAYED"
                            ? "success"
                            : item.status === "REMOVED"
                              ? "danger"
                              : "default"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div>{item.position}</div>
                    <div className="text-white/45">{formatDateTime(item.createdAt)}</div>
                    <QueueControls venueId={venue.id} itemId={item.id} status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AdminShell>
  );
}
