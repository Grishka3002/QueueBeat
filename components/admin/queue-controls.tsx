"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QueueControlsProps = {
  venueId: string;
  itemId: string;
  status: "QUEUED" | "PLAYED" | "REMOVED";
};

export function QueueControls({ venueId, itemId, status }: QueueControlsProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(nextStatus: "PLAYED" | "REMOVED") {
    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/venues/${venueId}/queue/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось обновить трек в очереди.");
      }

      setMessage(payload.message ?? "Очередь обновлена.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "QUEUED" ? (
        <>
          <button
            type="button"
            onClick={() => update("PLAYED")}
            disabled={isBusy}
            className="mini-action border-emerald-300/20 bg-emerald-500/15 text-emerald-200"
          >
            Отметить как проигранный
          </button>
          <button
            type="button"
            onClick={() => update("REMOVED")}
            disabled={isBusy}
            className="mini-action border-rose-300/20 bg-rose-500/15 text-rose-200"
          >
            Удалить из очереди
          </button>
        </>
      ) : null}
      {message ? <div className="text-xs text-emerald-200">{message}</div> : null}
      {error ? <div className="text-xs text-rose-200">{error}</div> : null}
    </div>
  );
}
