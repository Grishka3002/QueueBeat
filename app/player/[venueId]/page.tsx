import type { Metadata } from "next";

import { PlayerScreen } from "@/components/player/player-screen";

export const metadata: Metadata = {
  title: "Трекни — плеер заведения"
};

export default async function PlayerPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  return <PlayerScreen venueId={venueId} />;
}
