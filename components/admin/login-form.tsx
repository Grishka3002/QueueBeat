"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

export function LoginForm({
  endpoint = "/api/platform/login",
  redirectTo = "/platform" as Route,
  placeholder = "Пароль владельца платформы",
  buttonLabel = "Открыть платформу"
}: {
  endpoint?: string;
  redirectTo?: Route;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось войти.");
      }

      router.push(redirectTo);
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
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-white/25"
      />
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Входим..." : buttonLabel}
      </button>
    </form>
  );
}
