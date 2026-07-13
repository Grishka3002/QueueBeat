import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "default"
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/20 bg-emerald-500/15 text-emerald-200 shadow-[0_0_28px_rgba(16,185,129,0.08)]"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-500/15 text-amber-200 shadow-[0_0_28px_rgba(245,158,11,0.08)]"
        : tone === "danger"
          ? "border-rose-300/20 bg-rose-500/15 text-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.08)]"
          : "border-white/10 bg-white/10 text-white/70 shadow-[0_0_24px_rgba(255,255,255,0.04)]";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.01em] backdrop-blur", toneClass)}>
      {children}
    </span>
  );
}
