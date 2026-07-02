"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

type VibeTrack = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
};

const vibeExamples = [
  "лаунж для пятничного вечера, коктейли, не слишком громко",
  "клубный пик, энергично, танцы, знакомые хиты",
  "фон для работы днём, спокойно, без перегруза",
  "популярные песни для гостей 25-35 лет"
];

export function VibePlaylistForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(vibeExamples[0] ?? "");
  const [count, setCount] = useState(16);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [profileLabels, setProfileLabels] = useState<string[]>([]);
  const [tracks, setTracks] = useState<VibeTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generatePlaylist() {
    setError(null);
    setMessage(null);
    setReason(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/venues/${venueId}/tracks/vibe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt,
            count,
            mode
          })
        });

        const payload = (await response.json()) as {
          message?: string;
          reason?: string;
          profileLabels?: string[];
          tracks?: VibeTrack[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Не удалось собрать плейлист под вайб.");
        }

        setMessage(payload.message ?? "Плейлист обновлён.");
        setReason(payload.reason ?? null);
        setProfileLabels(payload.profileLabels ?? []);
        setTracks(payload.tracks ?? []);
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-[1.6rem] border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-500/10 via-white/[0.03] to-cyan-400/10 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Собрать плейлист по вайбу</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Опишите атмосферу словами. QueueBeat подберёт треки из глобальной библиотеки и обновит витрину заведения.
          </p>
        </div>
        <Badge>Vibe Builder</Badge>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        placeholder="Например: лаунж, пятница вечер, 25-35 лет, без тяжёлого рока, можно поп и deep house"
        className="w-full resize-none rounded-[1.25rem] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-fuchsia-300/40"
      />

      <div className="flex flex-wrap gap-2">
        {vibeExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setPrompt(example)}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
        <label className="grid gap-2 text-sm text-white/65">
          Количество
          <input
            type="number"
            min={5}
            max={40}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
          />
        </label>

        <div className="grid gap-2 text-sm text-white/65">
          Режим
          <div className="grid grid-cols-2 gap-2 rounded-[1.1rem] bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setMode("append")}
              className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
                mode === "append" ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
              }`}
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => setMode("replace")}
              className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
                mode === "replace" ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
              }`}
            >
              Заменить витрину
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={generatePlaylist}
          disabled={isPending}
          className="rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {isPending ? "Подбираем..." : "Собрать"}
        </button>
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
      {reason ? <div className="text-sm leading-6 text-white/55">{reason}</div> : null}

      {profileLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {profileLabels.map((label) => (
            <Badge key={label}>{label}</Badge>
          ))}
        </div>
      ) : null}

      {tracks.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {tracks.slice(0, 8).map((track) => (
            <div key={track.id} className="rounded-[1.1rem] border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <div className="truncate font-semibold text-white">{track.title}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-white/45">
                <span className="truncate">{track.artist}</span>
                <span>{formatDuration(track.durationSec)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
