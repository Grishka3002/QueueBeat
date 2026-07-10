"use client";

import { useEffect, useState } from "react";
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

  // префилл из формы «Создайте кабинет» на лендинге
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetVenue = params.get("venueName");
    const presetEmail = params.get("email");
    if (presetVenue) {
      setVenueName((value) => value || presetVenue);
    }
    if (presetEmail) {
      setEmail((value) => value || presetEmail);
    }
  }, []);

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
      <div className="surface-tile rounded-[1.5rem] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Аккаунт</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            placeholder="Ваше имя"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль, минимум 8 символов"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
          <input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="Телефон для проверки"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
        </div>
      </div>

      <div className="surface-tile rounded-[1.5rem] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Заведение</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            placeholder="Название заведения"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            placeholder="Публичная ссылка, например velvet-room"
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
        </div>
      </div>

      <div className="surface-tile rounded-[1.5rem] p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Данные бизнеса</div>
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.25rem] bg-black/20 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => setBusinessType("INDIVIDUAL_ENTREPRENEUR")}
            className={`min-h-10 rounded-[1rem] px-4 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 ease-silk active:scale-[0.96] ${
              !isLlc ? "bg-white text-black shadow-[0_10px_26px_rgba(255,255,255,0.1)]" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            ИП
          </button>
          <button
            type="button"
            onClick={() => setBusinessType("LLC")}
            className={`min-h-10 rounded-[1rem] px-4 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 ease-silk active:scale-[0.96] ${
              isLlc ? "bg-white text-black shadow-[0_10px_26px_rgba(255,255,255,0.1)]" : "text-white/60 hover:bg-white/5 hover:text-white"
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
            className="soft-input rounded-[1.2rem] px-4 py-3"
          />
          <input
            value={inn}
            onChange={(event) => setInn(event.target.value)}
            placeholder={isLlc ? "ИНН, 10 цифр" : "ИНН, 12 цифр"}
            className="soft-input rounded-[1.2rem] px-4 py-3 tabular-nums"
          />
        </div>
      </div>

      <div className="status-message border border-amber-300/15 bg-amber-300/10 text-sm leading-6 text-amber-100/80">
        Платёжные данные мы намеренно собираем позже. После проверки добавим отдельный шаг для подключения
        провайдера оплаты, чеков, комиссии и выплат.
      </div>

      {error ? <div className="status-message border border-rose-500/20 bg-rose-500/10 text-sm text-rose-200">{error}</div> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-action w-full px-5 py-3 text-sm"
      >
        {isSubmitting ? "Создаём аккаунт..." : "Зарегистрировать заведение"}
      </button>
      <Link href="/login" className="inline-flex min-h-10 items-center text-sm text-white/45 transition-[color] duration-150 hover:text-white/75">
        Уже есть аккаунт?
      </Link>
    </form>
  );
}
