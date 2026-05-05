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
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : tone === "danger"
          ? "bg-rose-500/15 text-rose-300"
          : "bg-white/10 text-white/70";

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", toneClass)}>
      {children}
    </span>
  );
}
