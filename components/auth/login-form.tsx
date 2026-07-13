"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Бар «Соловей»", email: "velvet-room@queuebeat.local" },
  { label: "Клуб «Резонанс»", email: "luna-rooftop@queuebeat.local" },
  { label: "Лаунж «Вельвет»", email: "noir-bar@queuebeat.local" }
];

const DEMO_PASSWORD = "queuebeat-admin";

export function VenueLoginForm({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось войти.");
      }

      router.push("/admin" as Route);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email владельца заведения"
        className="soft-input w-full rounded-xl px-4 py-3"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Пароль"
        className="soft-input w-full rounded-xl px-4 py-3"
      />
      {error ? (
        <div className="status-message border border-warn/30 bg-warn/10 text-sm text-warn">{error}</div>
      ) : null}
      <button type="submit" disabled={isSubmitting} className="primary-action w-full px-5 py-3 text-sm">
        {isSubmitting ? "Входим..." : "Открыть кабинет заведения"}
      </button>

      {demoMode ? (
        <div className="rounded-2xl border border-dashed border-cyan/40 bg-cyan/[0.05] p-3.5">
          <div className="mono-label text-cyan">демо-доступы</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-white/[0.06]"
              >
                <span className="font-semibold text-white/80">{account.label}</span>
                <span className="font-mono text-[11px] text-white/45">{account.email}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 font-mono text-[10.5px] text-white/40">
            пароль: {DEMO_PASSWORD} · клик по строке заполняет форму
          </div>
        </div>
      ) : null}

      <Link
        href="/register"
        className="inline-flex min-h-10 items-center text-sm text-white/45 transition-[color] duration-150 hover:text-white/75"
      >
        Зарегистрировать новое заведение
      </Link>
    </form>
  );
}
