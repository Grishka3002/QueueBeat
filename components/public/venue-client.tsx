"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TrackArt } from "@/components/track-art";
import { Equalizer } from "@/components/ui/equalizer";
import { cn, formatDuration } from "@/lib/utils";

type PublicTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  coverUrl: string | null;
  genre: string;
};

type PlayerSnapshot = {
  playing: boolean;
  nowPlaying: {
    trackId: string;
    title: string;
    artist: string;
    durationSec: number;
    elapsedSec: number;
    source: "request" | "background";
  } | null;
  queue: {
    id: string;
    orderId: string;
    title: string;
    artist: string;
    durationSec: number;
    position: number;
  }[];
  yourPosition: number | null;
  venue?: { isAcceptingRequests: boolean };
};

type VenueClientProps = {
  venue: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    accentColor: string;
    requestPriceCents: number;
    isAcceptingRequests: boolean;
  };
  personalMode?: boolean;
  tracks: PublicTrack[];
};

type Lang = "ru" | "en";
type Screen = "home" | "queue";

const GENRES: { id: string; ru: string; en: string }[] = [
  { id: "all", ru: "Все", en: "All" },
  { id: "pop", ru: "Поп", en: "Pop" },
  { id: "rock", ru: "Рок", en: "Rock" },
  { id: "hip", ru: "Хип-хоп", en: "Hip-hop" },
  { id: "y2k", ru: "2000-е", en: "2000s" }
];

const BANKS = [
  { id: "sber", name: "Сбер", letter: "С", bg: "#21A038", fg: "#ffffff" },
  { id: "tbank", name: "Т-Банк", letter: "Т", bg: "#FFDD2D", fg: "#1A1A1A" },
  { id: "alfa", name: "Альфа-Банк", letter: "А", bg: "#EF3124", fg: "#ffffff" },
  { id: "vtb", name: "ВТБ", letter: "В", bg: "#009FDF", fg: "#ffffff" }
];

const L: Record<Lang, Record<string, string>> = {
  ru: {
    open: "приём открыт",
    nowPlaying: "СЕЙЧАС ИГРАЕТ",
    searchPh: "Найти трек или исполнителя",
    emptyTitle: "Ничего не нашлось",
    emptyNote: "Плейлист задаёт заведение — попробуй другой запрос или жанр",
    ctaPick: "Выбери трек из плейлиста",
    sbpNote: "Оплата через СБП · без регистрации",
    payTitle: "Оплата заявки",
    lineItem: "Трек в очередь",
    lineVenue: "включено",
    total: "Итого",
    payVia: "Оплатить через",
    banksHint: "выбери свой банк",
    waiting: "Ждём подтверждение оплаты в приложении банка…",
    cancel: "Отмена",
    accepted: "Заявка принята!",
    yourPos: "позиция твоего трека в очереди",
    etaPrefix: "≈",
    etaSuffix: "мин до проигрывания",
    queueTitle: "ОЧЕРЕДЬ",
    playingNow: "играет сейчас",
    yourBadge: "твой трек",
    orderMore: "Заказать ещё трек",
    keepNote: "Страницу можно закрыть — трек останется в очереди",
    errTitle: "Оплата не прошла",
    errNote:
      "Банк отклонил операцию или вышло время подтверждения. Деньги не списаны — заявка не создана.",
    retry: "Попробовать ещё раз",
    closedDot: "приём закрыт",
    closedTitle: "Приём заявок закрыт",
    closedNote: "Заведение сейчас не принимает заказы треков. Плейлист можно полистать — загляни позже.",
    closedCta: "Приём заявок закрыт",
    closedShort: "вернись, когда приём откроют",
    bgNext: "дальше — плейлист заведения",
    bgNote: "фоновая музыка играет сама, без пауз",
    queueOf: "в очереди",
    bgSolo: "играет фон"
  },
  en: {
    open: "open for requests",
    nowPlaying: "NOW PLAYING",
    searchPh: "Search track or artist",
    emptyTitle: "Nothing found",
    emptyNote: "The venue curates this playlist — try another search or genre",
    ctaPick: "Pick a track from the playlist",
    sbpNote: "Pay via SBP · no sign-up needed",
    payTitle: "Payment",
    lineItem: "Track request",
    lineVenue: "included",
    total: "Total",
    payVia: "Pay with",
    banksHint: "choose your bank",
    waiting: "Waiting for confirmation in your bank app…",
    cancel: "Cancel",
    accepted: "Request accepted!",
    yourPos: "your track position in queue",
    etaPrefix: "≈",
    etaSuffix: "min until it plays",
    queueTitle: "QUEUE",
    playingNow: "playing now",
    yourBadge: "your track",
    orderMore: "Order another track",
    keepNote: "You can close this page — your track stays in the queue",
    errTitle: "Payment failed",
    errNote:
      "The bank declined the operation or the confirmation timed out. You have not been charged — no request was created.",
    retry: "Try again",
    closedDot: "requests closed",
    closedTitle: "Requests are closed",
    closedNote: "The venue isn't taking track requests right now. Browse the playlist and check back later.",
    closedCta: "Requests are closed",
    closedShort: "come back when requests reopen",
    bgNext: "then — the venue's playlist",
    bgNote: "background music keeps playing on its own",
    queueOf: "queue:",
    bgSolo: "background only"
  }
};

function formatRub(cents: number) {
  return `${Math.round(cents / 100).toLocaleString("ru-RU")} ₽`;
}

export function VenueClient({ venue, personalMode = false, tracks }: VenueClientProps) {
  const [lang, setLang] = useState<Lang>("ru");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [payOpen, setPayOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const cancelRef = useRef(false);

  const t = L[lang];
  const accepting = snapshot?.venue?.isAcceptingRequests ?? venue.isAcceptingRequests;
  const closed = !accepting;
  const priceFmt = formatRub(venue.requestPriceCents);
  const requestNote = personalMode
    ? lang === "ru"
      ? "Без оплаты · для своих"
      : "Free · friends only"
    : t.sbpNote;
  const priceChip = personalMode
    ? lang === "ru"
      ? "без оплаты"
      : "free"
    : lang === "ru"
      ? `трек — ${priceFmt}`
      : `song — ${priceFmt}`;

  const refreshSnapshot = useCallback(async () => {
    try {
      const url = orderId
        ? `/api/public/player/${venue.id}?orderId=${encodeURIComponent(orderId)}`
        : `/api/public/player/${venue.id}`;
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        setSnapshot((await response.json()) as PlayerSnapshot);
      }
    } catch {
      // сеть могла моргнуть — попробуем на следующем тике
    }
  }, [venue.id, orderId]);

  useEffect(() => {
    void refreshSnapshot();
    const interval = setInterval(() => void refreshSnapshot(), screen === "queue" ? 3000 : 6000);
    return () => clearInterval(interval);
  }, [refreshSnapshot, screen]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tracks.filter(
      (track) =>
        (genre === "all" || track.genre === genre) &&
        (!normalized || `${track.title} ${track.artist}`.toLowerCase().includes(normalized))
    );
  }, [tracks, query, genre]);

  const selected = tracks.find((track) => track.id === selectedId) ?? null;

  async function payNow() {
    if (!selected) {
      return;
    }

    setProcessing(true);
    setPayError(null);
    cancelRef.current = false;

    try {
      const orderResponse = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: venue.id, trackId: selected.id })
      });
      const orderPayload = (await orderResponse.json()) as { orderId?: string; error?: string };
      if (!orderResponse.ok || !orderPayload.orderId) {
        throw new Error(orderPayload.error ?? t.errNote);
      }

      if (personalMode) {
        setOrderId(orderPayload.orderId);
        setPayOpen(false);
        setScreen("queue");
        window.scrollTo({ top: 0 });
        return;
      }

      // имитация подтверждения в приложении банка
      await new Promise((resolve) => setTimeout(resolve, 1600));
      if (cancelRef.current) {
        return;
      }

      const payResponse = await fetch("/api/public/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderPayload.orderId })
      });
      const payPayload = (await payResponse.json()) as { error?: string };
      if (!payResponse.ok) {
        throw new Error(payPayload.error ?? t.errNote);
      }

      setOrderId(orderPayload.orderId);
      setPayOpen(false);
      setScreen("queue");
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (!cancelRef.current) {
        setPayError(error instanceof Error ? error.message : t.errNote);
      }
    } finally {
      setProcessing(false);
    }
  }

  const queue = snapshot?.queue ?? [];
  const yourPosition = snapshot?.yourPosition ?? null;
  const aheadSeconds =
    queue
      .filter((item) => yourPosition === null || item.position < yourPosition)
      .reduce((sum, item) => sum + item.durationSec, 0) +
    (snapshot?.nowPlaying
      ? Math.max(0, snapshot.nowPlaying.durationSec - snapshot.nowPlaying.elapsedSec)
      : 0);
  const etaMinutes = Math.max(1, Math.round(aheadSeconds / 60));

  const accent = venue.accentColor || "#F849A6";

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-10"
      style={{ "--acc": accent } as React.CSSProperties}
    >
      {screen === "home" ? (
        <>
          {/* шапка */}
          <div className="flex items-center justify-between px-5 pt-8">
            <div className="font-display text-xs font-bold tracking-[4px] text-cyan">ТРЕКНИ</div>
            <div className="flex rounded-full border border-white/[0.14] p-[2px] text-[11px] font-semibold">
              {(["ru", "en"] as Lang[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLang(value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 uppercase",
                    lang === value ? "bg-white/[0.14] text-white" : "text-white/45"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pt-3.5">
            <h1 className="font-display text-[23px] font-bold text-white">{venue.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-[12.5px] text-white/55">
              <span className="whitespace-nowrap">{venue.address || venue.city}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-white/35" />
              <span
                className={cn(
                  "inline-flex items-center gap-[5px] whitespace-nowrap",
                  closed ? "text-warn" : "text-cyan"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-warn" : "bg-cyan")} />
                {closed ? t.closedDot : t.open}
              </span>
              <span
                className={cn(
                  "ml-auto whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
                  closed ? "border-white/[0.14] text-white/35" : ""
                )}
                style={
                  closed
                    ? undefined
                    : { borderColor: `${accent}99`, color: accent }
                }
              >
                {priceChip}
              </span>
            </div>
          </div>

          {/* приём закрыт */}
          {closed ? (
            <div className="mx-5 mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.04] p-3.5">
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center gap-[3px] rounded-full border border-warn/50 bg-warn/10">
                <span className="h-3 w-[3px] rounded-[2px] bg-warn" />
                <span className="h-3 w-[3px] rounded-[2px] bg-warn" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-white">{t.closedTitle}</div>
                <div className="mt-[3px] text-xs leading-normal text-white/55">{t.closedNote}</div>
              </div>
            </div>
          ) : null}

          {/* сейчас играет */}
          <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-line bg-raised p-3">
            <Equalizer height={18} playing={snapshot?.playing ?? true} />
            <div className="min-w-0 flex-1">
              <div className="text-[9.5px] font-bold tracking-[2px] text-white/45">{t.nowPlaying}</div>
              <div className="truncate text-[13px] font-semibold text-white">
                {snapshot?.nowPlaying
                  ? `${snapshot.nowPlaying.artist} — ${snapshot.nowPlaying.title}`
                  : "—"}
              </div>
            </div>
            <div className="flex-none whitespace-nowrap text-right text-[11.5px] leading-[1.4] text-white/50">
              {queue.length > 0 ? `${t.queueOf} ${queue.length}` : t.bgSolo}
              <br />
              {queue.length > 0 ? `~${etaMinutes} ${lang === "ru" ? "мин" : "min"}` : "∞"}
            </div>
          </div>

          {/* поиск */}
          <div className="mx-5 mt-3 flex items-center gap-2.5 rounded-full bg-white/[0.06] px-4 py-[11px]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4.5" stroke="rgba(242,241,247,0.45)" strokeWidth="1.5" />
              <path d="M9.5 9.5L13 13" stroke="rgba(242,241,247,0.45)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPh}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-[14.5px] text-white outline-none"
            />
          </div>

          {/* жанры */}
          <div className="mx-5 mt-3 flex flex-wrap gap-[7px] text-[12.5px] font-semibold">
            {GENRES.map((item) => {
              const active = genre === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGenre(item.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-[13px] py-[7px]",
                    active ? "" : "border border-white/[0.13] text-white/60"
                  )}
                  style={active ? { background: accent, color: "#17020D" } : undefined}
                >
                  {item[lang]}
                </button>
              );
            })}
          </div>

          {/* плейлист */}
          <div className="mx-5 mt-3 flex flex-col">
            {filtered.map((track) => {
              const isSelected = track.id === selectedId && !closed;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    if (!closed) {
                      setSelectedId(isSelected ? null : track.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left",
                    isSelected
                      ? "my-[2px] border"
                      : "border border-transparent border-b-hairline",
                    closed ? "cursor-default opacity-45" : "cursor-pointer"
                  )}
                  style={
                    isSelected
                      ? { borderColor: `${accent}B3`, background: `${accent}17` }
                      : undefined
                  }
                >
                  <TrackArt title={track.title} artist={track.artist} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-white">{track.title}</div>
                    <div className="text-[12.5px] text-white/50">
                      {track.artist} · {formatDuration(track.durationSec)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full",
                      isSelected ? "text-[15px] font-extrabold" : "border text-lg font-medium",
                      isSelected ? "" : closed ? "border-white/10 text-white/30" : "border-white/20 text-white"
                    )}
                    style={isSelected ? { background: accent, color: "#17020D" } : undefined}
                  >
                    {isSelected ? "✓" : "+"}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="px-5 py-9 text-center">
                <div className="text-[15px] font-semibold text-white">{t.emptyTitle}</div>
                <div className="mt-1.5 text-[12.5px] leading-normal text-white/50">{t.emptyNote}</div>
              </div>
            ) : null}
          </div>

          {/* CTA */}
          <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-8 pt-4">
            <button
              type="button"
              disabled={!selected || closed || processing}
              onClick={() => {
                if (selected && !closed) {
                  if (personalMode) {
                    void payNow();
                  } else {
                    setPayOpen(true);
                    setPayError(null);
                  }
                }
              }}
              className={cn(
                "w-full rounded-full p-4 text-center font-display text-sm font-bold transition-[filter]",
                selected && !closed && !processing
                  ? "cursor-pointer hover:brightness-110"
                  : "cursor-default bg-white/[0.07] text-white/40"
              )}
              style={
                selected && !closed && !processing
                  ? { background: accent, color: "#17020D", boxShadow: `0 10px 34px ${accent}59` }
                  : undefined
              }
            >
              {closed
                ? t.closedCta
                : processing && personalMode
                  ? lang === "ru"
                    ? "Добавляем..."
                    : "Adding..."
                  : selected
                  ? personalMode
                    ? lang === "ru"
                      ? "Добавить в очередь"
                      : "Add to queue"
                    : lang === "ru"
                      ? `Заказать за ${priceFmt}`
                      : `Order for ${priceFmt}`
                  : t.ctaPick}
            </button>
            <div className="mt-2 text-center text-[11px] text-white/40">
              {closed ? t.closedShort : requestNote}
            </div>
            {personalMode && payError ? (
              <div className="mt-3 rounded-2xl border border-[rgba(255,107,107,0.28)] bg-[rgba(255,93,93,0.1)] px-4 py-3 text-center text-xs leading-normal text-[#FFB8B8]">
                {payError}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        /* ═══ ОЧЕРЕДЬ / УСПЕХ ═══ */
        <div className="flex min-h-screen flex-col px-5 pb-10 pt-16">
          <div className="flex flex-col items-center text-center">
            <div
              className="animate-pop flex h-16 w-16 items-center justify-center rounded-full text-[28px] font-extrabold"
              style={{
                background: accent,
                color: "#17020D",
                boxShadow: `0 0 44px ${accent}8C`
              }}
            >
              ✓
            </div>
            <div className="mt-4 font-display text-[19px] font-bold text-white">{t.accepted}</div>
            <div className="mt-1.5 whitespace-nowrap font-mono text-[11.5px] text-white/50">
              {lang === "ru" ? "заявка" : "request"} № {orderId?.slice(-6).toUpperCase()} ·{" "}
              {personalMode
                ? lang === "ru"
                  ? "в очереди"
                  : "queued"
                : `${lang === "ru" ? "оплачено" : "paid"} ${priceFmt}`}
            </div>
          </div>

          <div className="mt-[18px] flex items-center gap-3.5 rounded-[18px] border border-line bg-raised p-4">
            <div className="font-display text-[30px] font-bold" style={{ color: accent }}>
              №{yourPosition ?? "—"}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">{t.yourPos}</div>
              <div className="mt-[2px] text-xs text-white/50">
                {t.etaPrefix}
                {etaMinutes} {t.etaSuffix}
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] font-bold tracking-[2px] text-white/45">{t.queueTitle}</div>

          {snapshot?.nowPlaying ? (
            <div className="mt-2 flex items-center gap-3 rounded-[14px] bg-white/[0.04] px-3 py-[11px]">
              <Equalizer height={16} bars={3} color="#5BD7E8" playing={snapshot.playing} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-white">
                  {snapshot.nowPlaying.title}
                </div>
                <div className="text-[11.5px] text-white/50">
                  {snapshot.nowPlaying.artist} · {t.playingNow}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col">
            {queue.map((item) => {
              const isYours = orderId !== null && item.orderId === orderId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-[11px]",
                    isYours ? "my-1.5 rounded-[14px] border" : "border-b border-hairline"
                  )}
                  style={isYours ? { borderColor: `${accent}B3`, background: `${accent}14` } : undefined}
                >
                  <span
                    className="w-[22px] flex-none font-mono text-xs"
                    style={{ color: isYours ? accent : "rgba(242,241,247,0.4)" }}
                  >
                    {String(item.position).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-white">{item.title}</div>
                    <div className="text-[11.5px] text-white/50">
                      {item.artist} · {formatDuration(item.durationSec)}
                    </div>
                  </div>
                  {isYours ? (
                    <span
                      className="flex-none rounded-full border px-2 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: accent, borderColor: `${accent}80` }}
                    >
                      {t.yourBadge}
                    </span>
                  ) : null}
                </div>
              );
            })}
            <div className="flex items-center gap-3 px-3 py-[11px] opacity-65">
              <span className="w-[22px] flex-none font-mono text-[13px] text-cyan">∞</span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-white/65">{t.bgNext}</div>
                <div className="text-[11px] text-white/40">{t.bgNote}</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-[18px]">
            <button
              type="button"
              onClick={() => {
                setScreen("home");
                setSelectedId(null);
                setQuery("");
                setGenre("all");
                window.scrollTo({ top: 0 });
              }}
              className="w-full rounded-full border border-white/20 p-[15px] text-center text-sm font-semibold text-white hover:bg-white/[0.08]"
            >
              {personalMode
                ? lang === "ru"
                  ? "Добавить ещё трек"
                  : "Add another track"
                : t.orderMore}
            </button>
            <div className="mt-2 text-center text-[11px] leading-normal text-white/40">{t.keepNote}</div>
          </div>
        </div>
      )}

      {/* ═══ ШИТ ОПЛАТЫ ═══ */}
      {payOpen && selected ? (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            aria-label={t.cancel}
            onClick={() => {
              if (!processing) {
                setPayOpen(false);
                setPayError(null);
              }
            }}
            className="animate-fade-in absolute inset-0 w-full bg-[rgba(4,4,8,0.6)] backdrop-blur-[3px]"
          />
          <div className="animate-slide-up absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl border border-white/[0.08] bg-raised px-5 pb-11 pt-2.5">
            <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-full bg-white/[0.18]" />
            <div className="flex items-center justify-between">
              <div className="font-display text-[15px] font-bold text-white">{t.payTitle}</div>
              <button
                type="button"
                onClick={() => {
                  if (!processing) {
                    setPayOpen(false);
                    setPayError(null);
                  }
                }}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/[0.08] text-[13px] text-white/60"
              >
                ✕
              </button>
            </div>

            <div className="mt-3.5 flex items-center gap-3 rounded-[14px] border border-line bg-white/[0.045] px-3 py-2.5">
              <TrackArt title={selected.title} artist={selected.artist} className="h-[42px] w-[42px]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold text-white">{selected.title}</div>
                <div className="text-xs text-white/50">
                  {selected.artist} · {formatDuration(selected.durationSec)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between text-white/60">
                <span>{t.lineItem}</span>
                <span>{priceFmt}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>{venue.name}</span>
                <span>{t.lineVenue}</span>
              </div>
              <div className="h-px bg-white/[0.08]" />
              <div className="flex items-baseline justify-between font-bold text-white">
                <span>{t.total}</span>
                <span className="font-display text-[17px]">{priceFmt}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-white/75">{t.payVia}</span>
              <span
                className="rounded-md border px-[7px] py-[3px] font-mono text-[10.5px] font-semibold tracking-[1px]"
                style={{ borderColor: `${accent}99`, color: accent }}
              >
                СБП
              </span>
              <span className="text-[11px] text-white/40">{t.banksHint}</span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-[9px]">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => void payNow()}
                  className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.05] px-3 py-[11px] hover:brightness-125"
                >
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: bank.bg, color: bank.fg }}
                  >
                    {bank.letter}
                  </span>
                  <span className="text-[13px] font-semibold text-white">{bank.name}</span>
                </button>
              ))}
            </div>

            {processing ? (
              <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-t-3xl bg-[rgba(21,21,31,0.97)]">
                <div className="spinner" />
                <div className="max-w-[240px] text-center text-[13px] leading-normal text-white/65">
                  {t.waiting}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    cancelRef.current = true;
                    setProcessing(false);
                  }}
                  className="px-3 py-1.5 text-[12.5px] text-white/40"
                >
                  {t.cancel}
                </button>
              </div>
            ) : null}

            {payError ? (
              <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-t-3xl bg-[rgba(21,21,31,0.98)] px-[22px] py-6 text-center">
                <div className="animate-pop flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,107,107,0.5)] bg-[rgba(255,93,93,0.13)] text-[21px] font-extrabold text-[#FF6B6B]">
                  ✕
                </div>
                <div className="mt-2 font-display text-base font-bold text-white">{t.errTitle}</div>
                <div className="max-w-[280px] text-[12.5px] leading-relaxed text-white/60">{payError}</div>
                <button
                  type="button"
                  onClick={() => void payNow()}
                  className="mt-3.5 w-full rounded-full p-3.5 font-display text-[13px] font-bold hover:brightness-110"
                  style={{ background: accent, color: "#17020D" }}
                >
                  {t.retry}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayOpen(false);
                    setPayError(null);
                  }}
                  className="w-full p-[11px] text-[13px] text-white/50"
                >
                  {t.cancel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
