import type { Venue, VenueSubscription } from "@prisma/client";

export const DEFAULT_PLATFORM_FEE_BPS = 2000;

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function isSubscriptionUsable(
  venue: Pick<Venue, "id"> &
    Partial<Pick<Venue, "verificationStatus" | "trialEndsAt">> & {
    subscriptions?: Pick<VenueSubscription, "status" | "currentPeriodEnd">[];
  },
  now = new Date()
) {
  if (venue.verificationStatus && venue.verificationStatus !== "VERIFIED") {
    return false;
  }

  if (venue.trialEndsAt && venue.trialEndsAt > now) {
    return true;
  }

  return Boolean(
    venue.subscriptions?.some(
      (subscription) =>
        (subscription.status === "ACTIVE" || subscription.status === "TRIAL") &&
        subscription.currentPeriodEnd > now
    )
  );
}

export function splitTrackPayment(amountCents: number, platformFeeBps = DEFAULT_PLATFORM_FEE_BPS) {
  const platformFeeCents = Math.round((amountCents * platformFeeBps) / 10000);
  return {
    platformFeeCents,
    venueShareCents: amountCents - platformFeeCents
  };
}
