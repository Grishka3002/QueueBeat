"use client";

type RuntimeErrorProps = {
  title?: string;
  description?: string;
  reset?: () => void;
};

export function RuntimeError({
  title = "Application setup needs attention",
  description = "The app could not load server data. Check Railway environment variables, Prisma migrations, and seed data.",
  reset
}: RuntimeErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-5 py-10 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-glow backdrop-blur">
        <div className="mb-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
          Runtime check
        </div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 leading-7 text-white/65">{description}</p>
        <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/55">
          Open <span className="font-mono text-white/80">/api/health</span> on the deployed app to verify database
          connectivity. If the database is not ready, run{" "}
          <span className="font-mono text-white/80">npx prisma migrate deploy</span> and{" "}
          <span className="font-mono text-white/80">npx prisma db seed</span> in Railway.
        </div>
        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Try again
          </button>
        ) : null}
      </div>
    </main>
  );
}
