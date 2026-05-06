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
      title="Не удалось загрузить админ-панель"
      description="Кабинету нужна рабочая production-база и корректная админская конфигурация. Проверьте DATABASE_URL, ADMIN_PASSWORD, миграции и seed-данные в Railway."
      reset={reset}
    />
  );
}
