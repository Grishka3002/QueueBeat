import Link from "next/link";

import { VenueRegisterForm } from "@/components/auth/register-form";
import { SectionCard } from "@/components/ui/section-card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-4 py-8 text-white">
      <SectionCard className="w-full max-w-3xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Подключение заведения</div>
            <h1 className="text-3xl font-semibold">Зарегистрируйте заведение</h1>
            <p className="text-sm leading-6 text-white/60">
              Сейчас нужны только базовые данные. Платёжные реквизиты и выплаты можно будет настроить позже,
              после проверки платформой.
            </p>
          </div>
          <VenueRegisterForm />
          <Link href="/" className="inline-flex text-sm text-white/45 hover:text-white/70">
            Вернуться на главную
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
