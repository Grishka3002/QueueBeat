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
        throw new Error(payload.error ?? "Could not update venue.");
      }

      setStatus(payload.message ?? "Настройки сохранены.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm text-white/70">
        Название
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
        />
      </label>
      <label className="grid gap-2 text-sm text-white/70">
        Slug
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
        />
      </label>
      <label className="grid gap-2 text-sm text-white/70">
        Цена, ₽
        <input
          type="number"
          min={1}
          value={priceRub}
          onChange={(event) => setPriceRub(event.target.value)}
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/25"
        />
      </label>
      <label className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
        <input
          checked={isAcceptingRequests}
          onChange={(event) => setIsAcceptingRequests(event.target.checked)}
          type="checkbox"
          className="h-4 w-4"
        />
        Принимать заказы
      </label>
      <div className="rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55">
        Текущая серверная цена: {formatPrice(venue.requestPriceCents)}
      </div>
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {status ? <div className="text-sm text-emerald-300">{status}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </form>
  );
}
