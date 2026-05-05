"use client";

import { RuntimeError } from "@/components/system/runtime-error";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RuntimeError reset={reset} />;
}
