import type { Metadata } from "next";
import type { Route } from "next";

import { RemoteControl } from "@/components/admin/remote-control";

export const metadata: Metadata = {
  title: "Трекни — пульт смены"
};

// доступ контролирует layout кабинета: без сессии владельца сюда не попасть
export default async function RemotePage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  return <RemoteControl venueId={venueId} backHref={`/admin/venues/${venueId}` as Route} />;
}
