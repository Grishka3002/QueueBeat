import { cn } from "@/lib/utils";

const BARS = [
  { duration: 0.9, delay: -0.2, opacity: 1 },
  { duration: 1.1, delay: -0.6, opacity: 1 },
  { duration: 0.8, delay: -0.4, opacity: 0.75 },
  { duration: 1.2, delay: -0.9, opacity: 1 },
  { duration: 0.7, delay: -0.55, opacity: 0.7 }
];

export function Equalizer({
  bars = 4,
  height = 18,
  barWidth = 3,
  color = "var(--acc, #F849A6)",
  playing = true,
  className
}: {
  bars?: number;
  height?: number;
  barWidth?: number;
  color?: string;
  playing?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-none items-end gap-[3px]", className)} style={{ height }} aria-hidden>
      {BARS.slice(0, bars).map((bar, index) => (
        <span
          key={index}
          className="origin-bottom rounded-[2px]"
          style={{
            width: barWidth,
            height: height - 2,
            background: color,
            opacity: bar.opacity,
            animation: playing
              ? `eq ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate`
              : undefined,
            transform: playing ? undefined : "scaleY(0.35)"
          }}
        />
      ))}
    </div>
  );
}
