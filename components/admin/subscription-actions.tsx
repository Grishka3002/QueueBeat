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
      {error ? <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">{error}</div> : null}
      <button
        type="button"
        onClick={activateSubscription}
        disabled={isSubmitting}
        className="primary-action w-full px-5 py-3 text-sm"
      >
        {isSubmitting ? "Обрабатываем..." : "Mock-оплата месячной подписки"}
      </button>
    </div>
  );
}
