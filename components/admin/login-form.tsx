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
        className="soft-input w-full rounded-[1.2rem] px-4 py-3"
      />
      {error ? <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-action w-full px-5 py-3 text-sm"
      >
        {isSubmitting ? "Входим..." : buttonLabel}
      </button>
    </form>
  );
}
