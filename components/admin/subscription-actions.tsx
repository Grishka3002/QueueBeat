"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionActions({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activateSubscription() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/venues/${venueId}/subscription/mock-pay`, {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось активировать подписку.");
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="button"
        onClick={activateSubscription}
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Обрабатываем..." : "Mock-оплата месячной подписки"}
      </button>
    </div>
  );
}
