import Link from "next/link";

import { SectionCard } from "@/components/ui/section-card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-hero-radial px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
            QueueBeat для заведений
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight sm:text-6xl">
              <span className="text-gradient">Музыкальные заявки по QR-коду</span>
              <br />
              в одном кабинете
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/70">
              Зарегистрируйте заведение, пройдите проверку, соберите разрешённый плейлист, скачайте QR-код
              и принимайте оплаченные заявки гостей прямо с телефона.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-accent to-accentBlue px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Зарегистрировать заведение
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 hover:bg-white/5"
            >
              Войти в кабинет
            </Link>
          </div>
        </section>

        <SectionCard className="space-y-5">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Как это работает</div>
            <h2 className="mt-3 text-2xl font-semibold">Один сервис, три роли</h2>
          </div>
          {[
            ["Владелец сервиса", "Проверяет заведения и видит все клиентские кабинеты в /platform."],
            ["Заведение", "Управляет ценой, плейлистом, QR-кодом, очередью и приёмом заявок."],
            ["Гость", "Сканирует QR-код и попадает на страницу конкретного заведения /v/[slug]."]
          ].map(([title, description]) => (
            <div key={title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold">{title}</div>
              <div className="mt-1 text-sm leading-6 text-white/55">{description}</div>
            </div>
          ))}
          <Link href="/platform/login" className="inline-flex text-sm text-white/35 hover:text-white/60">
            Кабинет владельца платформы
          </Link>
        </SectionCard>
      </div>
    </main>
  );
}
