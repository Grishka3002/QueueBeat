export type TariffId = "start" | "legal" | "all";

export const TARIFFS: Record<
  TariffId,
  { id: TariffId; name: string; commissionPct: number; monthlyPriceCents: number; note: string }
> = {
  start: {
    id: "start",
    name: "Старт",
    commissionPct: 20,
    monthlyPriceCents: 0,
    note: "попробовать без риска"
  },
  legal: {
    id: "legal",
    name: "Легал",
    commissionPct: 10,
    monthlyPriceCents: 249000,
    note: "отчётность без рутины"
  },
  all: {
    id: "all",
    name: "Всё включено",
    commissionPct: 7,
    monthlyPriceCents: 599000,
    note: "музыка, документы и платежи — под ключ"
  }
};

export function tariffOf(id: string | null | undefined) {
  return TARIFFS[(id as TariffId) ?? "start"] ?? TARIFFS.start;
}
