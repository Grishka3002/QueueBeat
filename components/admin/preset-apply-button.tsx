"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PresetApplyButton({ venueId, presetId }: { venueId: string; presetId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function applyPreset() {
    setIsSubmitting(true);
    try {
      await fetch(`/api/admin/venues/${venueId}/presets/${presetId}`, {
        method: "POST"
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={applyPreset}
      disabled={isSubmitting}
      className="secondary-action px-4 py-2 text-sm"
    >
      {isSubmitting ? "Применяем..." : "Применить пресет"}
    </button>
  );
}
