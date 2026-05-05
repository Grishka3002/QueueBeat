export type PaymentStartResult = {
  checkoutId: string;
  status: "pending";
};

export interface PaymentProvider {
  start(orderId: string): Promise<PaymentStartResult>;
  confirm(orderId: string): Promise<{ status: "paid" }>;
}
