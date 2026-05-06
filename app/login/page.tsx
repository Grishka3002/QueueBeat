import Link from "next/link";

import { VenueLoginForm } from "@/components/auth/login-form";
import { SectionCard } from "@/components/ui/section-card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-4 text-white">
      <SectionCard className="w-full max-w-md">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Вход для заведения</div>
            <h1 className="text-3xl font-semibold">Откройте личный кабинет</h1>
            <p className="text-sm leading-6 text-white/60">
              Управляйте QR-кодом, разрешённым плейлистом, ценой заявки и живой очередью.
            </p>
          </div>
          <VenueLoginForm />
          <Link href="/" className="inline-flex text-sm text-white/45 hover:text-white/70">
            Вернуться на главную
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
