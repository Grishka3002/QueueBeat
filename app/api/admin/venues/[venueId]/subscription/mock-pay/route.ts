import { NextResponse } from "next/server";

import { addMonths } from "@/lib/commercial";
import { canManageVerifiedVenue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  if (!(await canManageVerifiedVenue(venueId))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { slug: "pro-monthly", isActive: true }
  });

  if (!plan) {
    return NextResponse.json({ error: "Subscription plan is not configured." }, { status: 500 });
  }

  const now = new Date();
  const currentPeriodEnd = addMonths(now, plan.intervalMonths);

  const subscription = await prisma.venueSubscription.create({
    data: {
      venueId,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: now,
      currentPeriodEnd,
      payments: {
        create: {
          venueId,
          kind: "SUBSCRIPTION",
          status: "SUCCEEDED",
          amountCents: plan.priceCents,
          provider: "mock",
          providerRef: `sub-${Date.now()}`,
          paidAt: now
        }
      }
    }
  });

  return NextResponse.json({
    message: "Subscription activated for one month.",
    subscriptionId: subscription.id,
    currentPeriodEnd
  });
}
