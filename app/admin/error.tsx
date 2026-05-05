"use client";

import { RuntimeError } from "@/components/system/runtime-error";

export default function AdminError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RuntimeError
      title="Admin dashboard could not load"
      description="The dashboard needs a working production database and admin configuration. Check DATABASE_URL, ADMIN_PASSWORD, migrations, and seed data in Railway."
      reset={reset}
    />
  );
}
