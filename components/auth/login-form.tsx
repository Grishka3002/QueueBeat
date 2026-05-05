"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function VenueLoginForm() {
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
        throw new Error(payload.error ?? "Login failed.");
      }

      router.push("/dashboard" as Route);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
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
        placeholder="Venue owner email"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-white/25"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-white/25"
      />
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Open venue dashboard"}
      </button>
      <Link href="/register" className="inline-flex text-sm text-white/45 hover:text-white/70">
        Register a new venue
      </Link>
    </form>
  );
}
