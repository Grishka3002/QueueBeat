"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function VenueRegisterForm() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [venueName, setVenueName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, email, password, venueName, slug })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Registration failed.");
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
        value={ownerName}
        onChange={(event) => setOwnerName(event.target.value)}
        placeholder="Your name"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password, 8+ characters"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <input
        value={venueName}
        onChange={(event) => setVenueName(event.target.value)}
        placeholder="Venue name"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value.toLowerCase())}
        placeholder="public-link, e.g. velvet-room"
        className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
      />
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Register venue"}
      </button>
      <Link href="/login" className="inline-flex text-sm text-white/45 hover:text-white/70">
        Already have an account?
      </Link>
    </form>
  );
}
