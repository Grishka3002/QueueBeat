"use client";

import { RuntimeError } from "@/components/system/runtime-error";

export default function VenueError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RuntimeError
      title="Venue page could not load"
      description="The guest page needs venue data from PostgreSQL. Check that Railway has DATABASE_URL configured and Prisma migrations plus seed data have been applied."
      reset={reset}
    />
  );
}
