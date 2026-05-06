"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BusinessType = "INDIVIDUAL_ENTREPRENEUR" | "LLC";

export function VenueRegisterForm() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [venueName, setVenueName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL_ENTREPRENEUR");
  const [legalName, setLegalName] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [ogrnip, setOgrnip] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [actualAddress, setActualAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBik, setBankBik] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [corrAccount, setCorrAccount] = useState("");
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
        body: JSON.stringify({
          ownerName,
          email,
          password,
          venueName,
          slug,
          businessType,
          legalName,
          inn,
          kpp,
          ogrn,
          ogrnip,
          legalAddress,
          actualAddress,
          contactName,
          contactPhone,
          bankName,
          bankBik,
          bankAccount,
          corrAccount
        })
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

  const isLlc = businessType === "LLC";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Your name"
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password, 8+ characters"
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <input
          value={contactPhone}
          onChange={(event) => setContactPhone(event.target.value)}
          placeholder="Representative phone"
          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
        />
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Venue</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            placeholder="Venue name"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            placeholder="public-link, e.g. velvet-room"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Business details</div>
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.1rem] bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setBusinessType("INDIVIDUAL_ENTREPRENEUR")}
            className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
              !isLlc ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
            }`}
          >
            IP
          </button>
          <button
            type="button"
            onClick={() => setBusinessType("LLC")}
            className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
              isLlc ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
            }`}
          >
            LLC
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            placeholder={isLlc ? "Legal name, e.g. LLC Music Bar" : "IP full legal name"}
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25 sm:col-span-2"
          />
          <input
            value={inn}
            onChange={(event) => setInn(event.target.value)}
            placeholder={isLlc ? "INN, 10 digits" : "INN, 12 digits"}
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          {isLlc ? (
            <>
              <input
                value={kpp}
                onChange={(event) => setKpp(event.target.value)}
                placeholder="KPP, 9 digits"
                className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <input
                value={ogrn}
                onChange={(event) => setOgrn(event.target.value)}
                placeholder="OGRN, 13 digits"
                className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
              />
            </>
          ) : (
            <input
              value={ogrnip}
              onChange={(event) => setOgrnip(event.target.value)}
              placeholder="OGRNIP, 15 digits"
              className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
            />
          )}
          <input
            value={legalAddress}
            onChange={(event) => setLegalAddress(event.target.value)}
            placeholder="Legal address"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25 sm:col-span-2"
          />
          <input
            value={actualAddress}
            onChange={(event) => setActualAddress(event.target.value)}
            placeholder="Actual address, optional"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25 sm:col-span-2"
          />
          <input
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Main representative"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25 sm:col-span-2"
          />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Bank details, optional</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            placeholder="Bank name"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={bankBik}
            onChange={(event) => setBankBik(event.target.value)}
            placeholder="BIK, 9 digits"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={bankAccount}
            onChange={(event) => setBankAccount(event.target.value)}
            placeholder="Settlement account, 20 digits"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={corrAccount}
            onChange={(event) => setCorrAccount(event.target.value)}
            placeholder="Correspondent account, 20 digits"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100/80">
        Passport scans and beneficial owner documents are intentionally not collected in this MVP. Add secure document
        upload before real payment-provider onboarding.
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Register venue for verification"}
      </button>
      <Link href="/login" className="inline-flex text-sm text-white/45 hover:text-white/70">
        Already have an account?
      </Link>
    </form>
  );
}
