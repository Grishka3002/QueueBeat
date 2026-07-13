import { cn, trackTag } from "@/lib/utils";

export function TrackArt({
  title,
  artist,
  className = "h-11 w-11",
  tagClassName = "text-[10px]"
}: {
  seed?: string;
  title: string;
  artist: string;
  className?: string;
  tagClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center rounded-[10px] font-mono text-white/50",
        className,
        tagClassName
      )}
      style={{
        background:
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 7px), #1D1D2B"
      }}
      aria-hidden
      title={`${title} — ${artist}`}
    >
      {trackTag(artist, title)}
    </div>
  );
}
