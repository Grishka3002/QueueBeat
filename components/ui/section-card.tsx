import { cn } from "@/lib/utils";

export function SectionCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("glass-panel rounded-[1.75rem] p-5", className)}>{children}</section>;
}
