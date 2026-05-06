import Link from "next/link";

export default function VenueNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-6 text-white">
      <div className="glass-panel max-w-md rounded-[2rem] p-8 text-center">
        <div className="text-sm uppercase tracking-[0.35em] text-white/35">404</div>
        <h1 className="mt-4 text-3xl font-semibold">Заведение не найдено</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Проверьте QR-ссылку или вернитесь на главную страницу сервиса.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
