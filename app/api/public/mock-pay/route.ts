import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { splitTrackPayment } from "@/lib/commercial";
import { confirmDemoOrder } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { paymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { parseMockPaymentInput, ValidationError } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = parseMockPaymentInput(await request.json());
    if (env.demoMode) {
      const confirmation = await paymentProvider.confirm(body.orderId);
      const result = confirmDemoOrder(body.orderId);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.error === "Заказ не найден." ? 404 : 400 });
      }

      return NextResponse.json({
        status: confirmation.status,
        message: "Оплата прошла успешно. Трек добавлен в очередь заведения."
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: {
        venue: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Заказ уже не ожидает оплату." }, { status: 400 });
    }

    const venueTrack = await prisma.venueTrack.findUnique({
      where: {
        venueId_trackId: {
          venueId: order.venueId,
          trackId: order.trackId
        }
      }
    });

    if (!venueTrack) {
      return NextResponse.json({ error: "Трек больше недоступен для этого заведения." }, { status: 400 });
    }

    await paymentProvider.confirm(order.id);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.$transaction(
          async (transaction) => {
            const orderUpdate = await transaction.order.updateMany({
              where: {
                id: order.id,
                status: "PENDING"
              },
              data: {
                status: "PAID",
                paidAt: new Date()
              }
            });

            if (orderUpdate.count === 0) {
              throw new Error("ORDER_NOT_PENDING");
            }

            const maxPosition = await transaction.queueItem.aggregate({
              where: {
                venueId: order.venueId
              },
              _max: {
                position: true
              }
            });

            await transaction.queueItem.create({
              data: {
                venueId: order.venueId,
                trackId: order.trackId,
                orderId: order.id,
                position: (maxPosition._max.position ?? 0) + 1,
                status: "QUEUED"
              }
            });

            await transaction.payment.updateMany({
              where: {
                orderId: order.id,
                kind: "TRACK_REQUEST"
              },
              data: {
                status: "SUCCEEDED",
                paidAt: new Date()
              }
            });

            const { platformFeeCents, venueShareCents } = splitTrackPayment(
              order.amountCents,
              order.venue.platformFeeBps
            );

            await transaction.ledgerEntry.createMany({
              data: [
                {
                  venueId: order.venueId,
                  orderId: order.id,
                  type: "VENUE_SHARE",
                  amountCents: venueShareCents,
                  description: "Доля заведения за оплаченную заявку трека"
                },
                {
                  venueId: order.venueId,
                  orderId: order.id,
                  type: "PLATFORM_FEE",
                  amountCents: -platformFeeCents,
                  description: "Комиссия платформы Трекни"
                }
              ]
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
          }
        );

        return NextResponse.json({
          message: "Оплата прошла успешно. Трек добавлен в очередь заведения."
        });
      } catch (error) {
        if (error instanceof Error && error.message === "ORDER_NOT_PENDING") {
          return NextResponse.json({ error: "Заказ уже не ожидает оплату." }, { status: 400 });
        }

        const shouldRetry =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2034" || error.code === "P2002");

        if (!shouldRetry || attempt === 2) {
          throw error;
        }
      }
    }

    return NextResponse.json({ error: "Не удалось подтвердить оплату." }, { status: 500 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
