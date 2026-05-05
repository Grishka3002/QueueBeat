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
        throw new Error(payload.error ?? "Could not update queue item.");
      }

      setMessage(payload.message ?? "Queue updated.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
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
            className="rounded-full bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300"
          >
            Отметить как проигранный
          </button>
          <button
            type="button"
            onClick={() => update("REMOVED")}
            disabled={isBusy}
            className="rounded-full bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-300"
          >
            Удалить из очереди
          </button>
        </>
      ) : null}
      {message ? <div className="text-xs text-emerald-300">{message}</div> : null}
      {error ? <div className="text-xs text-rose-300">{error}</div> : null}
    </div>
  );
}
