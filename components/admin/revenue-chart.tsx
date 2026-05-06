import { formatPrice } from "@/lib/utils";

type DailyOrder = {
  orders: number;
  grossCents: number;
};

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

export function RevenueChart({
  dailyOrders
}: {
  dailyOrders: Record<string, DailyOrder>;
}) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    const item = dailyOrders[key] ?? { orders: 0, grossCents: 0 };

    return {
      key,
      label: formatDayLabel(date),
      ...item
    };
  });

  const maxGross = Math.max(...days.map((day) => day.grossCents), 1);
  const totalGross = days.reduce((sum, day) => sum + day.grossCents, 0);
  const totalOrders = days.reduce((sum, day) => sum + day.orders, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Динамика заявок</h2>
          <p className="mt-1 text-sm text-white/45">Последние 14 дней по оплаченной музыке.</p>
        </div>
        <div className="text-sm text-white/55">
          {totalOrders} заявок · {formatPrice(totalGross)}
        </div>
      </div>

      <div
        className="grid h-64 items-end gap-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
        style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
      >
        {days.map((day) => {
          const height = Math.max(8, Math.round((day.grossCents / maxGross) * 100));
          return (
            <div key={day.key} className="flex h-full min-w-0 flex-col justify-end gap-2">
              <div className="group relative flex flex-1 items-end">
                <div
                  className="w-full rounded-t-full bg-gradient-to-t from-accent/70 to-accentBlue shadow-[0_0_18px_rgba(217,70,239,0.22)] transition group-hover:from-accent group-hover:to-cyan-300"
                  style={{ height: `${height}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#11131d] px-3 py-2 text-xs text-white shadow-glow group-hover:block">
                  {day.orders} заявок · {formatPrice(day.grossCents)}
                </div>
              </div>
              <div className="truncate text-center text-[0.65rem] text-white/35">{day.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
