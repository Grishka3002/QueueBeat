"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TrackPickerFormProps = {
  venueId: string;
  selectedTrackIds: string[];
  allTracks: {
    id: string;
    title: string;
    artist: string;
    durationSec: number;
  }[];
};

export function TrackPickerForm({ venueId, selectedTrackIds, allTracks }: TrackPickerFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>(selectedTrackIds);
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allTracks.filter((track) =>
      `${track.artist} ${track.title}`.toLowerCase().includes(normalized)
    );
  }, [allTracks, query]);

  async function handleSave() {
    setIsSubmitting(true);
    setState(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/venues/${venueId}/tracks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trackIds: picked })
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось сохранить выбранные треки.");
      }

      setState(payload.message ?? "Разрешённые треки обновлены.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleTrack(trackId: string) {
    setPicked((current) =>
      current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId]
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск по музыкальной библиотеке"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
      />
      <div className="max-h-[28rem] space-y-2 overflow-auto pr-1 scrollbar-thin">
        {filteredTracks.map((track) => {
          const checked = picked.includes(track.id);
          return (
            <label
              key={track.id}
              className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTrack(track.id)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium text-white">{track.title}</div>
                <div className="text-white/45">{track.artist}</div>
              </div>
              <div className="text-white/35">
                {Math.floor(track.durationSec / 60)}:
                {String(track.durationSec % 60).padStart(2, "0")}
              </div>
            </label>
          );
        })}
      </div>
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {state ? <div className="text-sm text-emerald-300">{state}</div> : null}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSubmitting}
        className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
      >
        {isSubmitting ? "Сохраняем..." : "Сохранить разрешённые треки"}
      </button>
    </div>
  );
}
