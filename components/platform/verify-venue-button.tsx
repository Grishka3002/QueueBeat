"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerifyVenueButton({
  venueId,
  status
}: {
  venueId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateStatus(nextStatus: "VERIFIED" | "REJECTED") {
    setIsSubmitting(true);
    try {
      await fetch(`/api/platform/venues/${venueId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isSubmitting || status === "VERIFIED"}
        onClick={() => updateStatus("VERIFIED")}
        className="rounded-full bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-40"
      >
        Проверить
      </button>
      <button
        type="button"
        disabled={isSubmitting || status === "REJECTED"}
        onClick={() => updateStatus("REJECTED")}
        className="rounded-full bg-rose-400/15 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-40"
      >
        Отклонить
      </button>
    </div>
  );
}
