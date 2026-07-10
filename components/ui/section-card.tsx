import { cn } from "@/lib/utils";

export function SectionCard({
  className,
  children,
  interactive = false
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <section className={cn("glass-panel rounded-[2rem] p-5", interactive ? "interactive-surface" : "", className)}>
      {children}
    </section>
  );
}
