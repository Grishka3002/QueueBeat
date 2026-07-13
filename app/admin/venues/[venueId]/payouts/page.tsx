import { getAdminVenueById } from "@/lib/data";
import { getDemoVenueOrders } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { tariffOf } from "@/lib/tariffs";
import { formatDateTime, formatPrice } from "@/lib/utils";

export default async function VenuePayoutsPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const data = await getAdminVenueById(venueId);
  const { venue } = data;
  const tariff = tariffOf("tariff" in venue ? (venue.tariff as string) : "start");

  let balanceCents = 0;
  let rows: { id: string; title: string; note: string; amountCents: number; at: Date }[] = [];

  if (env.demoMode) {
    const orders = getDemoVenueOrders(venueId).filter((order) => order.status === "PAID");
    const shareFactor = 1 - tariff.commissionPct / 100;
    balanceCents = Math.round(
      orders.reduce((sum, order) => sum + order.amountCents * shareFactor, 0)
    );
    rows = orders.slice(0, 12).map((order) => ({
      id: order.id,
      title: order.track ? `${order.track.title} — ${order.track.artist}` : "Заявка гостя",
      note: `заявка · комиссия ${tariff.commissionPct} % удержана`,
      amountCents: Math.round(order.amountCents * shareFactor),
      at: order.paidAt ?? order.createdAt
    }));
  } else if ("analytics" in data && "ledgerEntries" in venue) {
    balanceCents = data.analytics.balanceCents;
    rows = venue.ledgerEntries.slice(0, 12).map((entry) => ({
      id: entry.id,
      title: entry.description,
      note: entry.type,
      amountCents: entry.amountCents,
      at: entry.createdAt
    }));
  }

  return (
    <>
      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="rounded-[18px] border border-accent/40 bg-panel p-[22px]">
          <div className="text-[12.5px] text-white/55">Баланс к выплате</div>
          <div className="mt-2 font-display text-[32px] font-bold text-accent">
            {formatPrice(balanceCents)}
          </div>
          <div className="mt-1.5 font-mono text-[11.5px] text-white/50">
            комиссия тарифа {tariff.commissionPct} % уже удержана
          </div>
          <button
            type="button"
            className="mt-4 inline-block cursor-not-allowed rounded-full bg-white/[0.07] px-6 py-3 font-display text-xs font-bold text-white/40"
            title="Выплаты по кнопке появятся после подключения реальных реквизитов"
          >
            Вывести сейчас
          </button>
          <div className="mt-2 font-mono text-[10.5px] text-white/35">
            автовыплаты по реквизитам — после подключения платёжного провайдера
          </div>
        </div>
        <div className="rounded-[18px] border border-line bg-panel p-[22px]">
          <div className="flex items-baseline justify-between">
            <div className="text-[12.5px] text-white/55">Реквизиты</div>
            <span className="text-xs text-white/40">указываются при регистрации</span>
          </div>
          <div className="mt-3 font-mono text-[13px] leading-relaxed text-white/80">
            {venue.name}
            <br />
            реквизиты для выплат появятся
            <br />
            после заполнения профиля
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <div className="text-[15px] font-bold text-white">Начисления</div>
        {rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
            Пока нет оплаченных заявок — начисления появятся после первых заказов гостей.
          </div>
        ) : (
          <div className="mt-2 flex flex-col">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3.5 border-b border-hairline py-3 last:border-none">
                <span className="w-32 flex-none font-mono text-xs text-white/50">
                  {formatDateTime(row.at)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{row.title}</div>
                  <div className="text-xs text-white/45">{row.note}</div>
                </div>
                <span className="font-mono text-sm font-semibold text-white">
                  +{formatPrice(row.amountCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
