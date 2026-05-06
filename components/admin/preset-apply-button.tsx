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
      className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 disabled:opacity-50"
    >
      {isSubmitting ? "Applying..." : "Apply preset"}
    </button>
  );
}
