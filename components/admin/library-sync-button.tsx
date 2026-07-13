"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LibrarySyncButtonProps = {
  venueId: string;
  unavailableReason: string | null;
};

export function LibrarySyncButton({ venueId, unavailableReason }: LibrarySyncButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/venues/${venueId}/library/sync`, { method: "POST" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось синхронизировать медиатеку.");
      }

      setMessage(payload.message ?? "Медиатека синхронизирована.");
      router.refresh();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Неизвестная ошибка.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={Boolean(unavailableReason) || isSyncing}
        title={unavailableReason ?? "Получить новые лицензированные треки из медиатеки"}
        className="secondary-action px-5 py-3 text-sm"
      >
        {isSyncing ? "Синхронизируем..." : "Обновить из медиатеки"}
      </button>
      {unavailableReason ? (
        <div className="text-xs leading-5 text-amber-100/70">
          {unavailableReason}
        </div>
      ) : null}
      {error ? (
        <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="status-message border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}
