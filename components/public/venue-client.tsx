"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { TrackArt } from "@/components/track-art";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { cn, formatDuration, formatPrice } from "@/lib/utils";

type PublicTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  coverUrl: string | null;
};

type QueueTrack = {
  id: string;
  position: number;
  track: PublicTrack;
};

type VenueClientProps = {
  venue: {
    id: string;
    name: string;
    slug: string;
    requestPriceCents: number;
    isAcceptingRequests: boolean;
  };
  tracks: PublicTrack[];
  queue: QueueTrack[];
};

export function VenueClient({ venue, tracks, queue }: VenueClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(tracks[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return tracks;
    }

    return tracks.filter((track) =>
      `${track.title} ${track.artist}`.toLowerCase().includes(normalized)
    );
  }, [query, tracks]);

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;

  async function handlePayment() {
    if (!selectedTrackId) {
      setError("Выберите трек перед оплатой.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const orderResponse = await fetch("/api/public/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            venueId: venue.id,
            trackId: selectedTrackId
          })
        });

        const orderPayload = (await orderResponse.json()) as { orderId?: string; error?: string };

        if (!orderResponse.ok || !orderPayload.orderId) {
          throw new Error(orderPayload.error ?? "Не удалось создать заказ.");
        }

        const paymentResponse = await fetch("/api/public/mock-pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderId: orderPayload.orderId
          })
        });

        const paymentPayload = (await paymentResponse.json()) as { message?: string; error?: string };

        if (!paymentResponse.ok) {
          throw new Error(paymentPayload.error ?? "Оплата не прошла.");
        }

        setSuccess(paymentPayload.message ?? "Трек успешно добавлен в очередь.");
        router.refresh();
      } catch (paymentError) {
        setError(paymentError instanceof Error ? paymentError.message : "Неизвестная ошибка.");
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-5 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:px-8">
      <section className="space-y-5">
        <SectionCard className="overflow-hidden bg-hero-radial">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Venue Playlist</p>
                <h1 className="font-sans text-3xl font-semibold tracking-tight text-white">
                  {venue.name}
                </h1>
                <p className="max-w-sm text-sm leading-6 text-white/65">
                  Сканируйте, выбирайте одобренный трек и отправляйте его в очередь заведения после оплаты.
                </p>
              </div>
              <Badge tone={venue.isAcceptingRequests ? "success" : "warning"}>
                {venue.isAcceptingRequests ? "Прием открыт" : "Прием выключен"}
              </Badge>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Стоимость запроса</div>
              <div className="mt-2 text-4xl font-semibold text-gradient">
                {formatPrice(venue.requestPriceCents)}
              </div>
              <div className="mt-2 text-sm text-white/55">Цена всегда берется с сервера и не может быть изменена на клиенте.</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white/80">Поиск по библиотеке</div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название трека или исполнитель"
                className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 transition placeholder:text-white/30 focus:border-fuchsia-400/40"
              />
            </div>

            {!venue.isAcceptingRequests ? (
              <div className="rounded-[1.4rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
                Заведение временно не принимает музыкальные заявки. Вы можете посмотреть доступные треки, но оплатить заказ сейчас нельзя.
              </div>
            ) : null}

            {tracks.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                Для этого заведения пока не настроена разрешенная библиотека.
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                По вашему запросу ничего не найдено. Попробуйте другое название или исполнителя.
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTracks.map((track) => {
                  const isSelected = track.id === selectedTrackId;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrackId(track.id)}
                      className={cn(
                        "group flex items-center gap-4 rounded-[1.5rem] border p-3 text-left transition",
                        isSelected
                          ? "border-fuchsia-400/40 bg-fuchsia-500/10 shadow-glow"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      )}
                    >
                      <TrackArt seed={track.id} title={track.title} artist={track.artist} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white">{track.title}</div>
                        <div className="truncate text-sm text-white/55">{track.artist}</div>
                      </div>
                      <div className="text-sm text-white/45">{formatDuration(track.durationSec)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <SectionCard>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-white/35">Выбранный трек</div>
              {selectedTrack ? (
                <div className="mt-4 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <TrackArt
                    seed={selectedTrack.id}
                    title={selectedTrack.title}
                    artist={selectedTrack.artist}
                    className="h-20 w-20"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xl font-semibold">{selectedTrack.title}</div>
                    <div className="truncate text-sm text-white/55">{selectedTrack.artist}</div>
                    <div className="mt-2 text-sm text-white/45">{formatDuration(selectedTrack.durationSec)}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 p-4 text-sm text-white/45">
                  Выберите трек из списка.
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-sm text-white/55">
                <span>Итог к оплате</span>
                <span>{formatPrice(venue.requestPriceCents)}</span>
              </div>
              <button
                type="button"
                onClick={handlePayment}
                disabled={isPending || !selectedTrack || !venue.isAcceptingRequests}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Проводим mock-оплату..." : "Оплатить и добавить в очередь"}
              </button>
            </div>

            {error ? (
              <div className="rounded-[1.4rem] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-white/35">Live queue</div>
              <div className="mt-2 text-sm text-white/55">Гости видят только треки, уже попавшие в очередь.</div>
            </div>

            {queue.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 p-4 text-sm text-white/45">
                Пока пусто. Первый оплаченный заказ появится здесь.
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80">
                      {item.position}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.track.title}</div>
                      <div className="truncate text-xs text-white/45">{item.track.artist}</div>
                    </div>
                    <div className="text-xs text-white/35">{formatDuration(item.track.durationSec)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}
