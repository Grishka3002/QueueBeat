"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/lib/utils";

type VenueSettingsFormProps = {
  venue: {
    id: string;
    name: string;
    slug: string;
    requestPriceCents: number;
    isAcceptingRequests: boolean;
  };
};

export function VenueSettingsForm({ venue }: VenueSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(venue.name);
  const [slug, setSlug] = useState(venue.slug);
  const [priceRub, setPriceRub] = useState(String(venue.requestPriceCents / 100));
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(venue.isAcceptingRequests);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/venues/${venue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          slug,
          priceRub: Number(priceRub),
          isAcceptingRequests
        })
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось обновить заведение.");
      }

      setStatus(payload.message ?? "Настройки сохранены.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm text-white/70">
        Название заведения
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="soft-input rounded-[1.2rem] px-4 py-3"
        />
      </label>
      <label className="grid gap-2 text-sm text-white/70">
        Slug для публичной ссылки
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase())}
          className="soft-input rounded-[1.2rem] px-4 py-3"
        />
      </label>
      <label className="grid gap-2 text-sm text-white/70">
        Цена заявки, ₽
        <input
          type="number"
          min={1}
          value={priceRub}
          onChange={(event) => setPriceRub(event.target.value)}
          className="soft-input rounded-[1.2rem] px-4 py-3 tabular-nums"
        />
      </label>
      <label className="surface-tile flex min-h-14 cursor-pointer items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm text-white/75">
        <input
          checked={isAcceptingRequests}
          onChange={(event) => setIsAcceptingRequests(event.target.checked)}
          type="checkbox"
          className="h-4 w-4 accent-fuchsia-400"
        />
        Принимать оплаченные заявки
      </label>
      <div className="surface-tile rounded-[1.2rem] px-4 py-3 text-sm text-white/55 tabular-nums">
        Текущая цена на сервере: {formatPrice(venue.requestPriceCents)}
      </div>
      {error ? <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">{error}</div> : null}
      {status ? <div className="status-message border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200">{status}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-action px-5 py-3 text-sm"
      >
        {isSubmitting ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </form>
  );
}
