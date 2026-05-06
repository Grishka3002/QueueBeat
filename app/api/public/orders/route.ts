import { NextResponse } from "next/server";

import { isSubscriptionUsable } from "@/lib/commercial";
import { createDemoPendingOrder, setDemoOrderPaymentReference } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { paymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { parseTrackSelectionInput, ValidationError } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = parseTrackSelectionInput(await request.json());
    if (env.demoMode) {
      const result = createDemoPendingOrder(body.venueId, body.trackId);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.error === "Заведение не найдено." ? 404 : 400 });
      }

      const payment = await paymentProvider.start(result.order.id);
      setDemoOrderPaymentReference(result.order.id, payment.checkoutId);

      return NextResponse.json({
        orderId: result.order.id,
        checkoutId: payment.checkoutId,
        status: payment.status,
        priceCents: result.venue.requestPriceCents
      });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: body.venueId },
      include: {
        venueTracks: {
          where: {
            trackId: body.trackId
          }
        },
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 3
        }
      }
    });

    if (!venue) {
      return NextResponse.json({ error: "Заведение не найдено." }, { status: 404 });
    }

    if (!venue.isAcceptingRequests) {
      return NextResponse.json({ error: "Заведение сейчас не принимает заявки." }, { status: 400 });
    }

    if (!isSubscriptionUsable(venue)) {
      return NextResponse.json({ error: "Подписка заведения не активна." }, { status: 402 });
    }

    if (venue.venueTracks.length === 0) {
      return NextResponse.json({ error: "Этот трек не разрешён для выбранного заведения." }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        venueId: venue.id,
        trackId: body.trackId,
        amountCents: venue.requestPriceCents,
        status: "PENDING"
      }
    });

    const payment = await paymentProvider.start(order.id);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentReference: payment.checkoutId
      }
    });

    await prisma.payment.create({
      data: {
        venueId: venue.id,
        orderId: order.id,
        kind: "TRACK_REQUEST",
        status: "PENDING",
        amountCents: venue.requestPriceCents,
        provider: "mock",
        providerRef: payment.checkoutId
      }
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutId: payment.checkoutId,
      status: payment.status,
      priceCents: venue.requestPriceCents
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
