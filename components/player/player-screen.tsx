"use client";

import { useEffect, useRef, useState } from "react";

import { cn, formatDuration, trackTag } from "@/lib/utils";

type Snapshot = {
  venue: {
    id: string;
    name: string;
    accentColor: string;
    requestPriceCents: number;
    isAcceptingRequests: boolean;
  };
  playing: boolean;
  playedRequestsTonight: number;
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
    title: string;
    artist: string;
    durationSec: number;
    position: number;
  }[];
};

function eqBar(width: number, height: number, duration: number, delay: number, opacity = 1) {
  return {
    width,
    height,
    borderRadius: 2,
    background: "var(--acc)",
    opacity,
    transformOrigin: "bottom" as const,
    animation: `eq ${duration}s ease-in-out ${delay}s infinite alternate`
  };
}

export function PlayerScreen({ venueId }: { venueId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [clock, setClock] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [splash, setSplash] = useState<Snapshot["nowPlaying"] | null>(null);
  const lastTrackRef = useRef<string | null>(null);
  const splashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const response = await fetch(`/api/public/player/${venueId}`, { cache: "no-store" });
        if (!response.ok || !alive) {
          return;
        }

        const data = (await response.json()) as Snapshot;
        setSnapshot(data);
        setElapsed(data.nowPlaying?.elapsedSec ?? 0);

        const trackId = data.nowPlaying?.trackId ?? null;
        if (lastTrackRef.current !== null && trackId !== null && trackId !== lastTrackRef.current) {
          setSplash(data.nowPlaying);
          if (splashTimer.current) {
            clearTimeout(splashTimer.current);
          }
          splashTimer.current = setTimeout(() => setSplash(null), 2200);
        }
        lastTrackRef.current = trackId;
      } catch {
        // повторим на следующем тике
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), 2000);
    return () => {
      alive = false;
      clearInterval(interval);
      if (splashTimer.current) {
        clearTimeout(splashTimer.current);
      }
    };
  }, [venueId]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const clockInterval = setInterval(tick, 1000);
    const progressInterval = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => {
      clearInterval(clockInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const accent = snapshot?.venue.accentColor ?? "#F849A6";
  const current = snapshot?.nowPlaying ?? null;
  const shownElapsed = current ? Math.min(elapsed, current.durationSec) : 0;
  const pct = current ? Math.min(100, (shownElapsed / current.durationSec) * 100) : 0;
  const requestCount = snapshot?.queue.filter(() => true).length ?? 0;
  const isRequest = current?.source === "request";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#07070C] p-6"
      style={{ "--acc": accent } as React.CSSProperties}
    >
      <div
        className="relative w-[1040px] max-w-full overflow-hidden rounded-[22px] border border-white/[0.09] shadow-screen"
        style={{
          aspectRatio: "16/9",
          background: `radial-gradient(120% 80% at 82% -10%, color-mix(in srgb, ${accent} 22%, transparent), transparent 55%), #0B0B12`
        }}
      >
        {/* топбар */}
        <div className="absolute inset-x-0 top-0 z-[5] flex items-center gap-3.5 px-[30px] py-[22px]">
          <div className="font-display text-[15px] font-extrabold tracking-[3px] text-white">
            {snapshot?.venue.name ?? ""}
          </div>
          <div className="flex items-center gap-[7px] text-[12.5px]" style={{ color: accent }}>
            <span
              className="animate-pulse-glow h-[7px] w-[7px] rounded-full"
              style={{ background: accent }}
            />
            {snapshot?.venue.isAcceptingRequests ? "приём открыт" : "приём закрыт"}
          </div>
          <div className="ml-auto font-mono text-[13px] text-white/55">{clock}</div>
        </div>

        <div className="absolute inset-0 grid grid-cols-[1.35fr_1fr] gap-[26px] px-[30px] pb-7 pt-[72px]">
          {/* СЕЙЧАС ИГРАЕТ */}
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 items-end gap-[3px]">
                <span style={eqBar(4, 20, 0.7, -0.1)} />
                <span style={eqBar(4, 20, 0.5, -0.4)} />
                <span style={eqBar(4, 20, 0.9, -0.2, 0.75)} />
                <span style={eqBar(4, 20, 0.6, -0.5)} />
              </div>
              <span className="text-xs font-bold tracking-[3px] text-white/50">СЕЙЧАС ИГРАЕТ</span>
              <span
                className="rounded-full border px-[9px] py-[3px] font-mono text-[10px] tracking-[1px]"
                style={
                  isRequest
                    ? { color: accent, borderColor: `${accent}80` }
                    : { color: "rgba(242,241,247,0.5)", borderColor: "rgba(255,255,255,0.14)" }
                }
              >
                {isRequest ? "ЗАЯВКА ГОСТЯ" : "ФОНОВЫЙ ПЛЕЙЛИСТ"}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-[22px]">
              <div
                className="flex h-[150px] w-[150px] flex-none items-center justify-center rounded-[18px] font-mono text-lg text-white/45 shadow-cover"
                style={{
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 5px, transparent 5px 11px), #1D1D2B"
                }}
              >
                {current ? trackTag(current.artist, current.title) : "∞"}
              </div>
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis font-display text-[32px] font-bold leading-[1.1] text-white">
                  {current?.title ?? "Тишина"}
                </div>
                <div className="mt-2 text-lg text-white/60">{current?.artist ?? "фон выключен"}</div>
              </div>
            </div>

            <div className="mt-[22px]">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-200"
                  style={{
                    width: `${pct}%`,
                    background: accent,
                    boxShadow: `0 0 16px ${accent}99`
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[12.5px] text-white/50">
                <span>{formatDuration(Math.floor(shownElapsed))}</span>
                <span>
                  -{current ? formatDuration(Math.max(0, current.durationSec - Math.floor(shownElapsed))) : "0:00"}
                </span>
              </div>
            </div>
          </div>

          {/* ОЧЕРЕДЬ */}
          <div className="flex min-w-0 flex-col rounded-[18px] border border-line bg-white/[0.03] px-[18px] pb-2 pt-[18px]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold tracking-[2px] text-white/55">ДАЛЕЕ В ОЧЕРЕДИ</span>
              <span
                className="whitespace-nowrap font-mono text-[11px]"
                style={{ color: requestCount ? accent : "rgba(242,241,247,0.45)" }}
              >
                {requestCount
                  ? `${requestCount} заявк${requestCount === 1 ? "а" : requestCount < 5 ? "и" : ""} ждут`
                  : "нет заявок · играет фон"}
              </span>
            </div>
            <div className="mt-3 flex flex-1 flex-col gap-[7px] overflow-hidden">
              {(snapshot?.queue ?? []).slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-[11px] rounded-xl border px-2 py-2"
                  style={{
                    background: `color-mix(in srgb, ${accent} 9%, transparent)`,
                    borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`
                  }}
                >
                  <div
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] font-mono text-[9px] text-white/45"
                    style={{
                      background:
                        "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 7px), #1D1D2B"
                    }}
                  >
                    {trackTag(item.artist, item.title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold text-white">{item.title}</div>
                    <div className="truncate text-xs text-white/50">{item.artist}</div>
                  </div>
                  <span
                    className="flex-none rounded-full border px-[9px] py-[3px] font-mono text-[10px]"
                    style={{ color: accent, borderColor: `${accent}80` }}
                  >
                    заявка
                  </span>
                </div>
              ))}
              <div className="mt-[2px] flex items-center gap-[11px] px-1 py-[9px]">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] border border-dashed border-cyan/40 text-[15px] text-cyan">
                  ∞
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-white/70">Фоновый плейлист</div>
                  <div className="text-[11.5px] text-white/40">играет сам, когда заявки кончились</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* сплэш между треками */}
        {splash ? (
          <div
            className="animate-inj-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-[22px] backdrop-blur-[6px]"
            style={{
              background: `radial-gradient(90% 70% at 50% 42%, color-mix(in srgb, ${accent} 26%, transparent), transparent 62%), rgba(7,7,12,0.94)`
            }}
          >
            <div className="absolute inset-x-0 top-[26px] text-center font-display text-[13px] font-extrabold tracking-[5px] text-white/40">
              ТРЕКНИ
            </div>
            <span
              className="rounded-full border px-3.5 py-[5px] font-mono text-xs tracking-[3px]"
              style={
                splash.source === "request"
                  ? { color: accent, borderColor: `${accent}8C` }
                  : { color: "rgba(242,241,247,0.7)", borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {splash.source === "request" ? "ЗАЯВКА ГОСТЯ · ДАЛЕЕ" : "ДАЛЕЕ"}
            </span>
            <div
              className="flex h-[118px] w-[118px] items-center justify-center rounded-[20px] font-mono text-base text-white/50 shadow-screen"
              style={{
                background:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 5px, transparent 5px 11px), #1D1D2B"
              }}
            >
              {trackTag(splash.artist, splash.title)}
            </div>
            <div className="px-10 text-center">
              <div className="font-display text-[34px] font-bold leading-[1.1] text-white">
                {splash.title}
              </div>
              <div className="mt-2.5 text-lg text-white/60">{splash.artist}</div>
            </div>
            <div className="flex h-[22px] items-end gap-1">
              <span style={eqBar(4, 22, 0.6, -0.1)} />
              <span style={eqBar(4, 22, 0.45, -0.3)} />
              <span style={eqBar(4, 22, 0.8, -0.5, 0.7)} />
              <span style={eqBar(4, 22, 0.55, -0.2)} />
              <span style={eqBar(4, 22, 0.7, -0.6, 0.7)} />
            </div>
          </div>
        ) : null}

        {/* нижняя плашка с QR */}
        <div className="absolute inset-x-0 bottom-0 z-[5] flex items-center gap-4 bg-gradient-to-t from-[rgba(7,7,12,0.85)] to-transparent px-[30px] py-4">
          <div className="h-[46px] w-[46px] flex-none rounded-[9px] bg-[#F2F1F7] p-[5px]">
            <div
              className="h-full w-full rounded-[2px]"
              style={{
                background:
                  "repeating-linear-gradient(0deg,#17020D 0 3px,transparent 3px 6px),repeating-linear-gradient(90deg,#17020D 0 3px,#F2F1F7 3px 6px)"
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-white">
              Закажи свой трек — {Math.round((snapshot?.venue.requestPriceCents ?? 19900) / 100)} ₽
            </div>
            <div className="text-[12.5px] text-white/55">
              Наведи камеру на QR · оплата через СБП · без регистрации
            </div>
          </div>
          <div className="text-right font-mono text-xs leading-normal text-white/45">
            заявок за вечер
            <br />
            <span className="text-[15px] font-semibold" style={{ color: accent }}>
              {snapshot?.playedRequestsTonight ?? 0}
            </span>
          </div>
        </div>

        {/* пауза */}
        {snapshot && !snapshot.playing ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(7,7,12,0.55)] backdrop-blur-[2px]">
            <div className={cn("rounded-full border border-white/20 px-6 py-3 font-mono text-sm tracking-[3px] text-white/80")}>
              ⏸ ПАУЗА
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
