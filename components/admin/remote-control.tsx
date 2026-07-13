"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import { Equalizer } from "@/components/ui/equalizer";
import { cn, formatDuration, trackTag } from "@/lib/utils";

type Snapshot = {
  venue: {
    id: string;
    name: string;
    accentColor: string;
    isAcceptingRequests: boolean;
  };
  playing: boolean;
  volume: number;
  muted: boolean;
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
};

const PRESETS = [
  { label: "25 %", value: 25 },
  { label: "50 %", value: 50 },
  { label: "75 %", value: 75 },
  { label: "Макс", value: 100 }
];

export function RemoteControl({ venueId, backHref }: { venueId: string; backHref: Route }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/venues/${venueId}/player`, { cache: "no-store" });
      const data = (await response.json()) as Snapshot & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось получить состояние плеера.");
        return;
      }
      setError(null);
      setSnapshot(data);
      setElapsed(data.nowPlaying?.elapsedSec ?? 0);
    } catch {
      // повторим на следующем тике
    }
  }, [venueId]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 2500);
    const progress = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(progress);
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [refresh]);

  const send = useCallback(
    async (body: Record<string, unknown>, message?: string) => {
      try {
        const response = await fetch(`/api/admin/venues/${venueId}/player`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = (await response.json()) as Snapshot & { error?: string };
        if (!response.ok) {
          showToast(data.error ?? "Команда не прошла");
          return;
        }
        setSnapshot(data);
        setElapsed(data.nowPlaying?.elapsedSec ?? 0);
        if (message) {
          showToast(message);
        }
      } catch {
        showToast("Нет связи с плеером");
      }
    },
    [venueId, showToast]
  );

  const accent = snapshot?.venue.accentColor ?? "#F849A6";
  const current = snapshot?.nowPlaying ?? null;
  const playing = snapshot?.playing ?? false;
  const shownElapsed = current ? Math.min(elapsed, current.durationSec) : 0;
  const pct = current ? Math.min(100, (shownElapsed / current.durationSec) * 100) : 0;
  const effVolume = snapshot?.muted ? 0 : snapshot?.volume ?? 65;
  const accepting = snapshot?.venue.isAcceptingRequests ?? true;
  const isRequest = current?.source === "request";

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="font-display text-lg font-bold text-white">Пульт недоступен</div>
        <div className="text-sm leading-relaxed text-white/55">{error}</div>
        <Link href={backHref} className="secondary-action px-5">
          ‹ Вернуться в кабинет
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-md flex-col pt-8"
      style={{ "--acc": accent } as React.CSSProperties}
    >
      {/* шапка */}
      <div className="flex items-center gap-3 px-5 pt-3">
        <Link
          href={backHref}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-white/[0.06] text-lg text-white"
          aria-label="Назад в кабинет"
        >
          ‹
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-bold text-white">Пульт</div>
          <div className="text-[11.5px] text-white/50">
            {snapshot?.venue.name ?? "…"} · быстрое управление
          </div>
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11px]"
          style={{ color: accent, borderColor: `${accent}80` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          плеер онлайн
        </div>
      </div>

      {/* сейчас играет */}
      <div className="mx-5 mt-4 rounded-[20px] border border-white/[0.08] bg-raised p-4">
        <div className="flex items-center gap-2">
          <Equalizer height={15} bars={3} barWidth={3} playing={playing} />
          <span
            className="rounded-full border px-2 py-[3px] font-mono text-[9.5px] tracking-[1px]"
            style={
              isRequest
                ? { color: accent, borderColor: `${accent}73` }
                : { color: "rgba(242,241,247,0.5)", borderColor: "rgba(255,255,255,0.14)" }
            }
          >
            {isRequest ? "ЗАЯВКА ГОСТЯ" : "ФОНОВЫЙ ПЛЕЙЛИСТ"}
          </span>
        </div>
        <div className="mt-3.5 flex items-center gap-3.5">
          <div
            className="flex h-16 w-16 flex-none items-center justify-center rounded-[13px] font-mono text-xs text-white/50"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 4px, transparent 4px 9px), #1D1D2B"
            }}
          >
            {current ? trackTag(current.artist, current.title) : "∞"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-white">{current?.title ?? "Тишина"}</div>
            <div className="mt-[3px] truncate text-[13.5px] text-white/55">
              {current?.artist ?? "фон выключен"}
            </div>
          </div>
        </div>
        <div className="mt-3.5 h-[5px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        <div className="mt-[7px] flex justify-between font-mono text-[11.5px] text-white/50">
          <span>{formatDuration(Math.floor(shownElapsed))}</span>
          <span>
            -{current ? formatDuration(Math.max(0, current.durationSec - Math.floor(shownElapsed))) : "0:00"}
          </span>
        </div>
        {/* транспорт */}
        <div className="mt-3.5 flex items-center justify-center gap-[22px]">
          <button
            type="button"
            onClick={() => void send({ action: "restart" }, "Трек сначала")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.18] text-[17px] text-white hover:bg-white/[0.08]"
            aria-label="Сначала"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={() => void send({ action: "toggle" })}
            className="flex h-16 w-16 flex-none items-center justify-center rounded-full font-extrabold"
            style={{
              background: accent,
              color: "#17020D",
              fontSize: playing ? 19 : 22,
              paddingLeft: playing ? 0 : 4,
              boxShadow: `0 10px 30px ${accent}66`
            }}
            aria-label={playing ? "Пауза" : "Играть"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => void send({ action: "skip" }, "Следующий трек")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.18] text-[13px] font-bold text-white hover:bg-white/[0.08]"
            aria-label="Следующий"
          >
            ▸▸
          </button>
        </div>
      </div>

      {/* громкость */}
      <div className="mx-5 mt-3 rounded-[20px] border border-white/[0.08] bg-raised px-4 py-[15px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-[1.5px] text-white/55">ГРОМКОСТЬ</span>
          <span className="ml-auto font-mono text-sm font-semibold" style={{ color: accent }}>
            {effVolume} %
          </span>
        </div>
        <div className="mt-3 flex items-center gap-[13px]">
          <button
            type="button"
            onClick={() => void send({ action: "mute" })}
            className="flex w-[34px] flex-none justify-center"
            aria-label="Без звука"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path d="M3 8.5V13.5H6.5L11 17V5L6.5 8.5H3Z" fill="#F2F1F7" />
              {effVolume === 0 ? (
                <path d="M14 8L19 14M19 8L14 14" stroke="#FF8A7A" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <g>
                  <path
                    d="M14 8.5C15 9.5 15 12.5 14 13.5"
                    stroke={accent}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity={effVolume >= 1 ? 1 : 0.18}
                  />
                  <path
                    d="M16.5 6.5C18.5 8.5 18.5 13.5 16.5 15.5"
                    stroke={accent}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity={effVolume >= 50 ? 1 : 0.18}
                  />
                </g>
              )}
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={effVolume}
            onChange={(event) => void send({ action: "volume", value: Number(event.target.value) })}
            className="acc-range flex-1"
            style={{
              background: `linear-gradient(90deg, ${accent} ${effVolume}%, rgba(255,255,255,0.12) ${effVolume}%)`
            }}
          />
        </div>
        <div className="mt-3 flex gap-[7px]">
          {PRESETS.map((preset) => {
            const active = !snapshot?.muted && snapshot?.volume === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => void send({ action: "volume", value: preset.value })}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-[7px] text-xs font-semibold",
                  active ? "" : "border border-white/[0.14] text-white/60"
                )}
                style={active ? { background: accent, color: "#17020D" } : undefined}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* очередь */}
      <div className="mx-5 mt-3 flex min-h-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2 px-0.5 pb-2">
          <span className="text-xs font-bold tracking-[1.5px] text-white/55">ОЧЕРЕДЬ</span>
          <span
            className="font-mono text-[11px]"
            style={{
              color: (snapshot?.queue.length ?? 0) > 0 ? accent : "rgba(242,241,247,0.45)"
            }}
          >
            {(snapshot?.queue.length ?? 0) > 0
              ? `${snapshot!.queue.length} заявк${snapshot!.queue.length === 1 ? "а" : snapshot!.queue.length < 5 ? "и" : ""}`
              : "только фон"}
          </span>
        </div>
        <div className="flex flex-col gap-[7px]">
          {(snapshot?.queue ?? []).map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-[14px] border py-[9px] pl-3 pr-2.5"
              style={{
                background: `color-mix(in srgb, ${accent} 9%, transparent)`,
                borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-semibold text-white">{item.title}</div>
                <div className="mt-[2px] flex items-center gap-[7px]">
                  <span
                    className="flex-none rounded-full border px-[7px] py-[2px] font-mono text-[9.5px]"
                    style={{ color: accent, borderColor: `${accent}73` }}
                  >
                    заявка гостя
                  </span>
                  <span className="truncate text-[11.5px] text-white/50">{item.artist}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => void send({ action: "moveUp", queueItemId: item.id }, "Заявка поднята")}
                className={cn(
                  "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-white/[0.16] text-sm",
                  index === 0 ? "cursor-default text-white/25" : "text-white/70"
                )}
                aria-label="Поднять"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() =>
                  void send({ action: "playNow", queueItemId: item.id }, `Играет сейчас: ${item.title}`)
                }
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border text-[11px] hover:brightness-125"
                style={{
                  background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
                  color: accent
                }}
                aria-label="Играть сейчас"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={() =>
                  void send(
                    { action: "remove", queueItemId: item.id },
                    "Заявка удалена — гостю вернётся оплата"
                  )
                }
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-white/[0.16] text-xs text-white/60 hover:border-warn/60 hover:text-warn"
                aria-label="Убрать"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2.5 px-3 py-[9px] opacity-65">
            <span className="flex-none font-mono text-[13px] text-cyan">∞</span>
            <span className="flex-1 text-[12.5px] text-white/55">Фоновый плейлист — играет сам</span>
          </div>
        </div>
      </div>

      {/* приём заявок */}
      <div className="mx-5 mt-2 flex items-center gap-3.5 border-t border-line px-1 pb-10 pt-[13px]">
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-white">Приём заявок</div>
          <div className="text-[11.5px] text-white/50">
            {accepting ? "гости могут заказывать треки" : "новые заказы приостановлены"}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            void send(
              { action: "accept", value: !accepting },
              accepting ? "Приём заявок остановлен" : "Приём заявок открыт"
            )
          }
          className="flex h-[30px] w-[52px] flex-none rounded-full p-[3px] transition-colors"
          style={{
            background: accepting ? accent : "rgba(255,255,255,0.12)",
            justifyContent: accepting ? "flex-end" : "flex-start"
          }}
          aria-label="Приём заявок"
        >
          <span className="h-6 w-6 rounded-full bg-[#F2F1F7]" />
        </button>
      </div>

      {/* тост */}
      {toast ? (
        <div
          className="animate-toast-in fixed inset-x-5 bottom-[46px] z-20 mx-auto max-w-md rounded-[14px] border bg-tile px-4 py-3 text-[12.5px] font-semibold text-white shadow-toast"
          style={{ borderColor: `${accent}80` }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
