"use client";

type RuntimeErrorProps = {
  title?: string;
  description?: string;
  reset?: () => void;
};

export function RuntimeError({
  title = "Нужно проверить настройку приложения",
  description = "Приложение не смогло загрузить данные с сервера. Проверьте переменные Railway, миграции Prisma и seed-данные.",
  reset
}: RuntimeErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-5 py-10 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-glow backdrop-blur">
        <div className="mb-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
          Проверка окружения
        </div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 leading-7 text-white/65">{description}</p>
        <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/55">
          Откройте <span className="font-mono text-white/80">/api/health</span> на деплое, чтобы проверить
          подключение к базе. Если база ещё не готова, выполните{" "}
          <span className="font-mono text-white/80">npx prisma migrate deploy</span> и{" "}
          <span className="font-mono text-white/80">npx prisma db seed</span> в Railway.
        </div>
        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Попробовать снова
          </button>
        ) : null}
      </div>
    </main>
  );
}
