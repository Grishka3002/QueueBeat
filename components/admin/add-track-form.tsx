"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddTrackForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState("3:30");
  const [coverUrl, setCoverUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/venues/${venueId}/tracks/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          artist,
          duration,
          coverUrl
        })
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось добавить трек.");
      }

      setTitle("");
      setArtist("");
      setDuration("3:30");
      setCoverUrl("");
      setMessage(payload.message ?? "Трек добавлен и разрешён для заведения.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-tile space-y-3 rounded-[1.5rem] p-4">
      <div>
        <h3 className="font-semibold text-white">Добавить свой трек</h3>
        <p className="mt-1 text-sm leading-6 text-white/45">
          Если песни нет в каталоге, добавьте её вручную. Она появится в общей библиотеке и сразу будет разрешена у этого заведения.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название трека"
          className="soft-input rounded-[1.1rem] px-4 py-3 text-sm"
        />
        <input
          value={artist}
          onChange={(event) => setArtist(event.target.value)}
          placeholder="Исполнитель"
          className="soft-input rounded-[1.1rem] px-4 py-3 text-sm"
        />
        <input
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="Длительность, например 3:30"
          className="soft-input rounded-[1.1rem] px-4 py-3 text-sm tabular-nums"
        />
        <input
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.target.value)}
          placeholder="Ссылка на обложку, необязательно"
          className="soft-input rounded-[1.1rem] px-4 py-3 text-sm"
        />
      </div>
      {error ? <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">{error}</div> : null}
      {message ? <div className="status-message border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200">{message}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="secondary-action px-5 py-3 text-sm"
      >
        {isSubmitting ? "Добавляем..." : "Добавить в каталог"}
      </button>
    </form>
  );
}
