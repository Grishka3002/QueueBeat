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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
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
          className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          value={artist}
          onChange={(event) => setArtist(event.target.value)}
          placeholder="Исполнитель"
          className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="Длительность, например 3:30"
          className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.target.value)}
          placeholder="Ссылка на обложку, необязательно"
          className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
        />
      </div>
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
      >
        {isSubmitting ? "Добавляем..." : "Добавить в каталог"}
      </button>
    </form>
  );
}
