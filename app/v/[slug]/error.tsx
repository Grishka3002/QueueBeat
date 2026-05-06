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
      title="Не удалось загрузить страницу заведения"
      description="Гостевой странице нужны данные заведения из PostgreSQL. Проверьте DATABASE_URL в Railway, а также применённые миграции Prisma и seed-данные."
      reset={reset}
    />
  );
}
