"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SWATCHES = ["#F849A6", "#3BD6EA", "#B8F23C", "#9D6BFF"];

export function BrandingPicker({
  venueId,
  venueName,
  initialAccent
}: {
  venueId: string;
  venueName: string;
  initialAccent: string;
}) {
  const router = useRouter();
  const [accent, setAccent] = useState(initialAccent);
  const [status, setStatus] = useState<string | null>(null);

  async function pick(color: string) {
    const previous = accent;
    setAccent(color);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/venues/${venueId}/branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentColor: color })
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Не удалось сохранить цвет.");
      }
      setStatus("Сохранено — гостевая страница, плеер и пульт уже в новом цвете.");
      router.refresh();
    } catch (error) {
      setAccent(previous);
      setStatus(error instanceof Error ? error.message : "Ошибка сохранения.");
    }
  }

  return (
    <div className="mt-3.5">
      {/* мини-превью гостевой страницы */}
      <div className="rounded-[14px] border border-white/[0.08] bg-bg p-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-[9px] font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
          <span
            className="whitespace-nowrap rounded-full border px-2 py-[3px] text-[10px] font-semibold"
            style={{ borderColor: `${accent}99`, color: accent }}
          >
            трек — 199 ₽
          </span>
        </div>
        <div className="mt-2.5 font-display text-base font-bold text-white">{venueName}</div>
        <div
          className="mt-3 rounded-full p-2.5 text-center font-display text-[10.5px] font-bold"
          style={{
            background: accent,
            color: "#17020D",
            boxShadow: `0 8px 22px ${accent}4D`,
            transition: "background 0.2s"
          }}
        >
          Заказать за 199 ₽
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-2.5">
        <span className="text-[12.5px] text-white/55">Фирменный цвет:</span>
        {SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => void pick(color)}
            className="h-6 w-6 rounded-full transition-shadow"
            style={{
              background: color,
              border: `2px solid ${color === accent ? "#F2F1F7" : "transparent"}`,
              boxShadow: color === accent ? `0 0 14px ${color}80` : "none"
            }}
            aria-label={color}
          />
        ))}
      </div>
      {status ? <div className="mt-2.5 font-mono text-[11px] text-white/50">{status}</div> : null}
    </div>
  );
}
