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
  const [contactPhone, setContactPhone] = useState("");
  const [venueName, setVenueName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL_ENTREPRENEUR");
  const [legalName, setLegalName] = useState("");
  const [inn, setInn] = useState("");
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
          contactPhone,
          venueName,
          slug,
          businessType,
          legalName,
          inn
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось зарегистрировать заведение.");
      }

      router.push("/dashboard" as Route);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Неизвестная ошибка.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLlc = businessType === "LLC";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Аккаунт</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            placeholder="Ваше имя"
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
            placeholder="Пароль, минимум 8 символов"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="Телефон для проверки"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Заведение</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            placeholder="Название заведения"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            placeholder="Публичная ссылка, например velvet-room"
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Данные бизнеса</div>
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.1rem] bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setBusinessType("INDIVIDUAL_ENTREPRENEUR")}
            className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
              !isLlc ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
            }`}
          >
            ИП
          </button>
          <button
            type="button"
            onClick={() => setBusinessType("LLC")}
            className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
              isLlc ? "bg-white text-black" : "text-white/60 hover:bg-white/5"
            }`}
          >
            ООО
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            placeholder={isLlc ? "Юр. название, например ООО Музыка Бар" : "ФИО ИП полностью"}
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
          <input
            value={inn}
            onChange={(event) => setInn(event.target.value)}
            placeholder={isLlc ? "ИНН, 10 цифр" : "ИНН, 12 цифр"}
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/25"
          />
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100/80">
        Платёжные данные мы намеренно собираем позже. После проверки добавим отдельный шаг для подключения
        провайдера оплаты, чеков, комиссии и выплат.
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Создаём аккаунт..." : "Зарегистрировать заведение"}
      </button>
      <Link href="/login" className="inline-flex text-sm text-white/45 hover:text-white/70">
        Уже есть аккаунт?
      </Link>
    </form>
  );
}
