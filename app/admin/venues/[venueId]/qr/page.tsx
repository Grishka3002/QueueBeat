import Image from "next/image";

import { isSubscriptionUsable } from "@/lib/commercial";
import { getAdminVenueById } from "@/lib/data";

export default async function VenueQrPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const data = await getAdminVenueById(venueId);
  const { venue } = data;
  const subscriptionActive = isSubscriptionUsable(venue);

  return (
    <>
      <div className="max-w-[640px] text-[13.5px] leading-relaxed text-white/55">
        QR-код ведёт на публичную страницу заведения <span className="font-mono text-cyan">/v/{venue.slug}</span>.
        Распечатайте его на столы, бар и веранду — гости сканируют и заказывают треки без регистрации.
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="rounded-[18px] border border-line bg-panel p-[18px]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-white">Основная точка</div>
              <div className="mt-1 font-mono text-[11px] text-white/50">весь зал · один QR</div>
            </div>
          </div>
          {subscriptionActive ? (
            <>
              <div className="mt-4 rounded-2xl bg-white p-4">
                <Image
                  src={`/api/admin/venues/${venue.id}/qr`}
                  alt={`QR-код для ${venue.name}`}
                  width={320}
                  height={320}
                  priority
                  unoptimized
                  className="mx-auto aspect-square w-full max-w-[280px] rounded-xl"
                />
              </div>
              <div className="mt-3.5 flex gap-2">
                <a
                  href={`/api/admin/venues/${venue.id}/qr?download=1`}
                  className="flex-1 rounded-full border border-white/[0.16] p-2.5 text-center text-[12.5px] font-semibold text-white hover:bg-white/[0.07]"
                >
                  Скачать PNG
                </a>
                <a
                  href={`/v/${venue.slug}`}
                  target="_blank"
                  className="flex-1 rounded-full border border-white/[0.16] p-2.5 text-center text-[12.5px] font-semibold text-white hover:bg-white/[0.07]"
                >
                  Открыть страницу
                </a>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-warn/40 bg-warn/[0.06] p-5 text-sm leading-relaxed text-warn">
              QR-код закрыт, пока у заведения нет активной подписки или пробного периода.
            </div>
          )}
        </div>

        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/20 p-[18px] text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[19px] text-white">
            +
          </div>
          <div className="text-[13px] text-white/55">QR-точки по зонам</div>
          <div className="max-w-[260px] text-xs leading-relaxed text-white/40">
            Отдельные коды для зала, бара и веранды со статистикой сканирований — в следующем обновлении.
          </div>
        </div>
      </div>
    </>
  );
}
