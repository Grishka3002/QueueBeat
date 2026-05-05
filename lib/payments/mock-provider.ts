import { randomUUID } from "node:crypto";

import type { PaymentProvider } from "@/lib/payments/types";

export class MockPaymentProvider implements PaymentProvider {
  async start(_orderId: string) {
    void _orderId;
    return {
      checkoutId: randomUUID(),
      status: "pending" as const
    };
  }

  async confirm(_orderId: string) {
    void _orderId;
    return {
      status: "paid" as const
    };
  }
}
