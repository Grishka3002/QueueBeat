import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VenueLoginForm } from "@/components/auth/login-form";
import { getSessionOwner } from "@/lib/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Вход в кабинет | Трекни"
};

export default async function LoginPage() {
  const owner = await getSessionOwner();
  if (owner) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-line bg-panel p-8">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[13px] font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
          <span className="font-mono text-[10px] text-white/45">кабинет</span>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Вход для заведений</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-white/55">
          Плейлист, цена заявки, очередь, выплаты и пульт смены — в одном кабинете.
        </p>
        <div className="mt-6">
          <VenueLoginForm demoMode={env.demoMode} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
          <Link href="/" className="text-white/45 hover:text-white/75">
            ← На главную
          </Link>
          <Link href="/platform/login" className="text-white/45 hover:text-white/75">
            Вход для платформы
          </Link>
        </div>
      </div>
    </main>
  );
}
