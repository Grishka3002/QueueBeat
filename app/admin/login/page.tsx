import type { Route } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-hero-radial px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <SectionCard className="w-full space-y-6">
          <div className="space-y-3">
            <Badge>Админка заведения</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Вход в админку</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">
                В demo-режиме пароль не нужен. В production админка закрыта паролем из ADMIN_PASSWORD.
              </p>
            </div>
          </div>
          <LoginForm
            endpoint="/api/admin/login"
            redirectTo={"/admin" as Route}
            placeholder="Пароль администратора"
            buttonLabel="Открыть админку"
          />
          <Link href="/" className="inline-flex text-sm text-white/45 transition-[color] duration-150 hover:text-white">
            На главную
          </Link>
        </SectionCard>
      </div>
    </main>
  );
}
