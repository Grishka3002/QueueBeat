import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import { SectionCard } from "@/components/ui/section-card";

export default function PlatformLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-4 text-white">
      <SectionCard className="w-full max-w-md">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Владелец платформы</div>
            <h1 className="text-3xl font-semibold">Платформа QueueBeat</h1>
            <p className="text-sm leading-6 text-white/60">
              Супер-админ для проверки заведений и контроля всех клиентских кабинетов.
            </p>
          </div>
          <LoginForm />
          <Link href="/" className="inline-flex text-sm text-white/45 hover:text-white/70">
            Вернуться на главную
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
