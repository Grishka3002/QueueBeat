import { trackGradient } from "@/lib/utils";

export function TrackArt({
  seed,
  title,
  artist,
  className = "h-16 w-16"
}: {
  seed: string;
  title: string;
  artist: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${trackGradient(seed)}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_45%)]" />
      <div className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85">
        {artist.slice(0, 14)}
      </div>
      <div className="absolute left-2 top-2 h-7 w-7 rounded-full border border-white/25 bg-white/15" />
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-white">
        {title.slice(0, 18)}
      </div>
    </div>
  );
}
