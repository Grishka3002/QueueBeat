import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { RemoteControl } from "@/components/admin/remote-control";
import { canManageVenue } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Трекни — пульт смены"
};

export default async function RemotePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  if (!env.demoMode && !(await canManageVenue(venueId))) {
    redirect("/admin/login");
  }

  return <RemoteControl venueId={venueId} backHref={`/admin/venues/${venueId}` as Route} />;
}
