"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Equalizer } from "@/components/ui/equalizer";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#how", label: "Как работает" },
  { href: "#control", label: "Контроль" },
  { href: "#legal", label: "Легальность" },
  { href: "#money", label: "Доход" },
  { href: "#custom", label: "Брендинг" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#faq", label: "FAQ" }
];

const STEPS = [
  {
    n: "01",
    title: "QR на столах",
    text: "Печатаете QR-код из кабинета. Каждое заведение получает свою страницу заявок."
  },
  {
    n: "02",
    title: "Гость выбирает трек",
    text: "Без регистрации и приложений. Только треки из плейлиста, который разрешили вы."
  },
  {
    n: "03",
    title: "Оплата через СБП",
    text: "Оплаченная заявка попадает в очередь. Деньги учитываются на балансе заведения."
  },
  {
    n: "04",
    title: "Трек играет сам",
    text: "Заявка автоматически вклинивается в фоновый плейлист. Без диджея и без участия персонала."
  }
];

const FAQS = [
  {
    q: "Что играет, когда заявок нет?",
    a: "Ваш фоновый плейлист — бесконечно, в случайном порядке. Оплаченная заявка вклинивается сразу после текущего трека, а когда очередь заявок пуста, фон продолжается сам. Пауз и тишины не бывает, диджей не нужен."
  },
  {
    q: "Что с правами на музыку (РАО/ВОИС)?",
    a: "Публичное воспроизведение оформляется договорами с РАО и ВОИС; их стороной остаётся заведение. Трекни ведёт точный журнал воспроизведений (дата, время, трек, источник), собирает месячные отчёты и пакет документов, а на тарифе «Всё включено» подаёт отчёты и проводит платежи за вас."
  },
  {
    q: "Нужно ли оборудование?",
    a: "Нет. QR-коды печатаются на обычном принтере, страница гостя открывается в браузере телефона, а плеер работает на любом устройстве, подключённом к вашей акустике."
  },
  {
    q: "Как заведение получает деньги?",
    a: "Оплаты гостей собираются на балансе заведения за вычетом комиссии сервиса. Выплаты приходят по реквизитам, указанным в кабинете; история заявок и выплат — там же."
  },
  {
    q: "А если гость закажет что-то неуместное?",
    a: "Заказать можно только из плейлиста, который составили вы, — случайного контента не бывает. Спорную заявку можно снять из кабинета до проигрывания, гостю автоматически вернётся оплата."
  }
];

const REVIEWS = [
  {
    text: "Раньше каждый вечер кто-то ловил бармена с «поставьте что-нибудь». Теперь на столах QR: гости сами выбирают и платят, музыка играет сама. Персонал вообще не участвует.",
    initials: "АК",
    tone: "accent" as const,
    name: "Алина Ковалёва",
    role: "управляющая · бар «Соловей», Москва",
    metricLabel: "заявки за месяц",
    metricValue: "+ 41 300 ₽"
  },
  {
    text: "Боялся, что закажут что-то не в формат. Зря: гости выбирают только из нашего плейлиста, а спорную заявку снимаю из кабинета — возврат уходит сам. Конфликтов ноль.",
    initials: "ДТ",
    tone: "cyan" as const,
    name: "Дамир Тарасов",
    role: "владелец · караоке-клуб «Ампир», Казань",
    metricLabel: "отклонённые заявки",
    metricValue: "< 2 %"
  },
  {
    text: "Подключили три точки в один кабинет. В пятницу поднимаем цену заявки, в тихие дни опускаем — статистика сразу показывает, что работает. Это второй «средний чек», о котором мы не думали.",
    initials: "СЛ",
    tone: "accent" as const,
    name: "Сергей Лапин",
    role: "совладелец · гастробары «Дым», Екатеринбург",
    metricLabel: "точек на тарифе «Всё включено»",
    metricValue: "3"
  }
];

const SWATCHES = ["#F849A6", "#3BD6EA", "#B8F23C", "#9D6BFF"];

const COMMISSION = 10;

function fmt(value: number) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-xs tracking-[2px] text-cyan">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-3 font-display text-[28px] font-bold text-white">{children}</h2>;
}

export function Landing() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [calcN, setCalcN] = useState(15);
  const [calcP, setCalcP] = useState(199);
  const [faqOpen, setFaqOpen] = useState(-1);
  const [miniOn, setMiniOn] = useState(true);
  const [miniPrice, setMiniPrice] = useState(199);
  const [brand, setBrand] = useState(SWATCHES[0]);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      return;
    }

    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    elements.forEach((element) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(26px)";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const element = entry.target as HTMLElement;
          const delay = (parseInt(element.getAttribute("data-reveal") ?? "0", 10) || 0) * 110;
          element.style.transition = `opacity 0.65s cubic-bezier(0.22,0.65,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,0.65,0.3,1) ${delay}ms`;
          element.style.opacity = "1";
          element.style.transform = "none";
          observer.unobserve(element);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const gross = calcN * calcP * 30;
  const fee = (gross * COMMISSION) / 100;
  const net = gross - fee;
  const canSend = formName.trim().length > 0 && formEmail.trim().length > 0;

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip text-white">
      {/* NAV */}
      <div className="sticky top-0 z-50 border-b border-line bg-[rgba(11,11,18,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center gap-7 px-6 py-3.5 lg:px-8">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-sm font-bold tracking-[4px] text-cyan">ТРЕКНИ</span>
            <span className="hidden font-mono text-[10.5px] text-white/45 sm:inline">для заведений</span>
          </div>
          <nav className="ml-auto hidden items-center gap-[22px] text-[13.5px] lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-white/60 hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#connect"
            className="ml-auto rounded-full bg-accent px-5 py-[11px] font-display text-[11.5px] font-bold text-ink hover:brightness-110 lg:ml-0"
          >
            Подключить заведение
          </a>
        </div>
      </div>

      {/* HERO */}
      <div className="mx-auto grid max-w-[1120px] items-center gap-14 px-6 pb-10 pt-16 lg:grid-cols-[1fr_360px] lg:px-8 lg:pt-[72px]">
        <div data-reveal="0">
          <div className="font-mono text-xs tracking-[2px] text-cyan">ДЛЯ БАРОВ, РЕСТОРАНОВ И КАРАОКЕ</div>
          <h1 className="mt-[18px] font-display text-4xl font-bold leading-[1.12] tracking-[-0.01em] sm:text-[46px]">
            Гости заказывают музыку — <span className="text-accent">заведение зарабатывает</span>
          </h1>
          <p className="mt-[22px] max-w-[560px] text-[16.5px] leading-relaxed text-white/65">
            Трекни — сервис музыкальных заявок по QR-коду. Гость сканирует код на столе, выбирает трек из
            вашего плейлиста и оплачивает через СБП. Трек встаёт в очередь, а вы получаете долю с каждой
            заявки.
          </p>
          <div className="mt-[30px] flex flex-wrap items-center gap-3.5">
            <a
              href="#connect"
              className="rounded-full bg-accent px-7 py-4 font-display text-[13.5px] font-bold text-ink shadow-glow hover:brightness-110"
            >
              Подключить заведение
            </a>
            <Link
              href="/v/velvet-room"
              className="rounded-full border border-white/20 px-6 py-[15px] text-sm font-semibold text-white hover:bg-white/[0.07]"
            >
              Демо гостевого экрана →
            </Link>
          </div>
          <div className="mt-[26px] flex flex-wrap gap-[18px] font-mono text-[11.5px] text-white/45">
            <span>· оплата через СБП</span>
            <span>· плейлист под вашим контролем</span>
            <span>· играет само, без диджея</span>
            <span>· отчётность для РАО/ВОИС</span>
          </div>
        </div>

        {/* превью телефона */}
        <div className="relative hidden justify-self-end lg:block" data-reveal="1">
          <div className="absolute -inset-10 bg-[radial-gradient(50%_50%_at_50%_40%,rgba(248,73,166,0.22),transparent_70%)] blur-[10px]" />
          <div className="relative flex h-[620px] w-[300px] flex-col rounded-[44px] border border-white/[0.12] bg-bg p-3 shadow-screen">
            <div className="flex flex-1 flex-col overflow-hidden rounded-[34px] bg-hero-glow bg-bg pt-8">
              <div className="flex items-center justify-between px-5">
                <div className="font-display text-xs font-bold tracking-[4px] text-cyan">ТРЕКНИ</div>
                <div className="flex rounded-full border border-white/[0.14] p-[2px] text-[11px] font-semibold">
                  <span className="rounded-full bg-white/[0.14] px-2.5 py-1 text-white">RU</span>
                  <span className="px-2.5 py-1 text-white/45">EN</span>
                </div>
              </div>
              <div className="px-5 pt-3.5">
                <div className="font-display text-[21px] font-bold">Бар «Соловей»</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                  <span>Никольская, 12</span>
                  <span className="inline-flex items-center gap-[5px] text-cyan">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> приём открыт
                  </span>
                  <span className="ml-auto rounded-full border border-accent/60 px-2 py-[3px] text-[10.5px] font-semibold text-accent">
                    199 ₽
                  </span>
                </div>
              </div>
              <div className="mx-5 mt-3.5 flex items-center gap-3 rounded-2xl border border-line bg-raised p-3">
                <Equalizer height={16} color="#F849A6" />
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold tracking-[2px] text-white/45">СЕЙЧАС ИГРАЕТ</div>
                  <div className="truncate text-xs font-semibold">Би-2 — Полковнику никто не пишет</div>
                </div>
              </div>
              <div className="mx-5 mt-3 flex gap-1.5 text-[11px] font-semibold">
                <span className="rounded-full bg-accent px-3 py-1.5 text-ink">Все</span>
                <span className="rounded-full border border-white/[0.13] px-3 py-1.5 text-white/60">Поп</span>
                <span className="rounded-full border border-white/[0.13] px-3 py-1.5 text-white/60">Рок</span>
              </div>
              <div className="mx-5 mt-3 flex flex-col gap-1">
                {[
                  { tag: "ZV", title: "Life", sub: "Zivert · 3:07", selected: true },
                  { tag: "СК", title: "Положение", sub: "Скриптонит · 3:44", selected: false },
                  { tag: "TW", title: "Blinding Lights", sub: "The Weeknd · 3:20", selected: false }
                ].map((row) => (
                  <div
                    key={row.tag}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] p-2.5",
                      row.selected ? "border border-accent/70 bg-accent/[0.09]" : "border-b border-hairline"
                    )}
                  >
                    <div
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] font-mono text-[9px] text-white/50"
                      style={{
                        background:
                          "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 3px, transparent 3px 7px), #1D1D2B"
                      }}
                    >
                      {row.tag}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{row.title}</div>
                      <div className="text-[11px] text-white/50">{row.sub}</div>
                    </div>
                    <div
                      className={cn(
                        "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-sm",
                        row.selected ? "bg-accent font-extrabold text-ink" : "border border-white/20 text-white"
                      )}
                    >
                      {row.selected ? "✓" : "+"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto px-5 pb-8 pt-3">
                <div className="rounded-full bg-accent p-3.5 text-center font-display text-xs font-bold text-ink shadow-glow">
                  Заказать за 199 ₽
                </div>
                <div className="mt-2 text-center text-[10px] text-white/40">
                  Оплата через СБП · без регистрации
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div data-reveal="0">
          <SectionLabel>КАК ЭТО РАБОТАЕТ</SectionLabel>
          <SectionTitle>Четыре шага от стола до колонок</SectionTitle>
        </div>
        <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.n}
              className="rounded-[18px] border border-line bg-panel p-5"
              data-reveal={index + 1}
            >
              <div className="font-mono text-xs text-accent">{step.n}</div>
              <div className="mt-2.5 text-base font-bold">{step.title}</div>
              <div className="mt-2 text-[13.5px] leading-normal text-white/55">{step.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTROL */}
      <section id="control" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div data-reveal="0">
          <SectionLabel>КОНТРОЛЬ</SectionLabel>
          <SectionTitle>Всё решает заведение</SectionTitle>
        </div>
        <div className="mt-7 grid gap-3.5 lg:grid-cols-2">
          <div className="flex items-center gap-5 rounded-[18px] border border-line bg-panel p-[22px]" data-reveal="1">
            <div className="flex-1">
              <div className="text-[16.5px] font-bold">Плейлист под контролем</div>
              <div className="mt-2 text-[13.5px] leading-normal text-white/55">
                Гости заказывают только из списка, который вы составили. Никаких сюрпризов из чужой фонотеки.
              </div>
            </div>
            <div className="hidden w-[170px] flex-none flex-col gap-1.5 text-[11.5px] sm:flex">
              {[
                { name: "Zivert — Life", ok: true },
                { name: "Queen — DSMN", ok: true },
                { name: "Хардбас 2007.mp3", ok: false }
              ].map((row) => (
                <div
                  key={row.name}
                  className={cn(
                    "flex items-center gap-2 rounded-[9px] px-2.5 py-[7px]",
                    row.ok ? "bg-white/[0.05]" : "bg-white/[0.03] opacity-55"
                  )}
                >
                  <span className="flex-1 truncate text-white/75">{row.name}</span>
                  <span className={cn("font-bold", row.ok ? "text-cyan" : "text-warn")}>
                    {row.ok ? "✓" : "✕"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-[18px] border border-line bg-panel p-[22px]" data-reveal="2">
            <div className="flex-1">
              <div className="text-[16.5px] font-bold">Своя цена заявки</div>
              <div className="mt-2 text-[13.5px] leading-normal text-white/55">
                Ставьте цену под формат: тихий бар — одна, пятничный караоке-прайм — другая. Меняется в пару
                тапов.
              </div>
            </div>
            <div className="flex flex-none items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMiniPrice((value) => Math.max(99, value - 50))}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/20 text-[17px] hover:bg-white/[0.08]"
              >
                −
              </button>
              <div className="min-w-[74px] whitespace-nowrap text-center font-display text-[17px] font-bold text-accent">
                {miniPrice} ₽
              </div>
              <button
                type="button"
                onClick={() => setMiniPrice((value) => Math.min(499, value + 50))}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/20 text-[17px] hover:bg-white/[0.08]"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-[18px] border border-line bg-panel p-[22px]" data-reveal="1">
            <div className="flex-1">
              <div className="text-[16.5px] font-bold">Стоп-кран приёма</div>
              <div className="mt-2 text-[13.5px] leading-normal text-white/55">
                Живой концерт, спортивная трансляция, тихий час — приём заявок выключается одним
                переключателем.
              </div>
            </div>
            <div className="flex flex-none flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setMiniOn((value) => !value)}
                className="flex h-[30px] w-[52px] rounded-full p-[3px] transition-colors"
                style={{
                  background: miniOn ? "#F849A6" : "rgba(255,255,255,0.12)",
                  justifyContent: miniOn ? "flex-end" : "flex-start"
                }}
              >
                <span className="h-6 w-6 rounded-full bg-[#F2F1F7]" />
              </button>
              <div
                className="whitespace-nowrap font-mono text-[10.5px]"
                style={{ color: miniOn ? "#F849A6" : "rgba(242,241,247,0.45)" }}
              >
                {miniOn ? "приём открыт" : "приём закрыт"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-[18px] border border-line bg-panel p-[22px]" data-reveal="2">
            <div className="flex-1">
              <div className="text-[16.5px] font-bold">Музыка не останавливается</div>
              <div className="mt-2 text-[13.5px] leading-normal text-white/55">
                Нет заявок — играет ваш бесконечный фоновый плейлист. Оплаченный трек вклинивается сразу
                после текущего, потом фон продолжается.
              </div>
            </div>
            <div className="hidden w-[170px] flex-none flex-col gap-1.5 text-[11.5px] sm:flex">
              <div className="flex items-center gap-2 rounded-[9px] border border-accent/45 bg-accent/[0.09] px-2.5 py-[7px]">
                <span className="font-mono text-accent">▶</span>
                <span className="flex-1 truncate text-white/75">Life</span>
                <span className="whitespace-nowrap text-[10.5px] text-accent">заявка</span>
              </div>
              <div className="flex items-center gap-2 rounded-[9px] bg-white/[0.05] px-2.5 py-[7px]">
                <span className="font-mono text-white/40">02</span>
                <span className="flex-1 truncate text-white/75">Положение</span>
                <span className="whitespace-nowrap text-[10.5px] text-accent">заявка</span>
              </div>
              <div className="flex items-center gap-2 rounded-[9px] bg-white/[0.05] px-2.5 py-[7px]">
                <span className="font-mono text-cyan">∞</span>
                <span className="flex-1 truncate text-white/55">фоновый плейлист</span>
                <span className="text-[10.5px] text-white/35">шаффл</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEGAL */}
      <section id="legal" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_460px]">
          <div data-reveal="0">
            <SectionLabel>ЮРИДИЧЕСКАЯ ЧИСТОТА</SectionLabel>
            <SectionTitle>Музыка с документами</SectionTitle>
            <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-white/60">
              Каждый проигранный трек — фоновый или заявка гостя — фиксируется в журнале: дата, время,
              источник, длительность. Из журнала сервис собирает месячные отчёты и пакет документов для
              РАО/ВОИС — к проверке всё готово заранее.
            </p>
            <p className="mt-3.5 text-xs leading-relaxed text-white/40">
              Помогаем оформить и вести отчётность по публичному воспроизведению; стороной договоров с
              РАО/ВОИС остаётся заведение. На тарифе «Всё включено» подачу отчётов и платежи берём на себя.
            </p>
          </div>
          <div className="rounded-[20px] border border-white/[0.08] bg-panel p-[26px]" data-reveal="1">
            <div className="flex flex-col gap-2.5">
              {[
                { dot: "#5BD7E8", label: "Договор РАО", meta: "оплачено до 31.12.2026" },
                { dot: "#5BD7E8", label: "Договор ВОИС", meta: "оплачено до 31.12.2026" },
                { dot: "#F849A6", label: "Отчёт за июнь", meta: "отправлен 01.07 · 1 214 треков" }
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3.5 py-[11px]">
                  <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: row.dot }} />
                  <span className="flex-1 text-[13px] font-semibold">{row.label}</span>
                  <span className="font-mono text-[11px] text-white/55">{row.meta}</span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-white/[0.08] pt-3.5">
              <span className="text-xs text-white/50">договоры · отчёты · журнал</span>
              <span className="whitespace-nowrap rounded-full border border-cyan/50 px-3.5 py-2 text-xs font-semibold text-cyan">
                Скачать пакет документов
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MONEY */}
      <section id="money" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_460px]">
          <div data-reveal="0">
            <SectionLabel>ДОХОД</SectionLabel>
            <SectionTitle>Сколько приносит музыка по заявкам</SectionTitle>
            <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-white/60">
              Вы задаёте цену заявки, гости платят через СБП. Сервис удерживает комиссию{" "}
              <a href="#pricing" className="text-cyan hover:text-[#A5EFF8]">
                тарифа
              </a>{" "}
              ({COMMISSION} % в примере), остальное копится на балансе заведения — выплаты по вашим
              реквизитам.
            </p>
            <p className="mt-3.5 text-xs text-white/40">
              Оценка ниже — прикидка при равномерной загрузке, фактические числа зависят от посещаемости.
            </p>
          </div>
          <div className="rounded-[20px] border border-white/[0.08] bg-panel p-[26px]" data-reveal="1">
            <div className="flex items-baseline justify-between text-[13.5px]">
              <span className="text-white/65">Заявок за вечер</span>
              <span className="font-mono font-semibold text-white">{calcN}</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={calcN}
              onChange={(event) => setCalcN(Number(event.target.value))}
              className="mt-2.5 w-full accent-accent"
            />
            <div className="mt-[18px] flex items-baseline justify-between text-[13.5px]">
              <span className="text-white/65">Цена заявки</span>
              <span className="font-mono font-semibold text-white">{calcP} ₽</span>
            </div>
            <input
              type="range"
              min={99}
              max={499}
              step={10}
              value={calcP}
              onChange={(event) => setCalcP(Number(event.target.value))}
              className="mt-2.5 w-full accent-accent"
            />
            <div className="my-5 h-px bg-white/[0.09]" />
            <div className="flex flex-col gap-[9px] text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-white/55">Заявок в месяц</span>
                <span className="font-mono text-white/80">≈ {fmt(calcN * 30)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/55">Выручка с заявок</span>
                <span className="font-mono text-white/80">{fmt(gross)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/55">Комиссия Трекни {COMMISSION} %</span>
                <span className="font-mono text-white/80">− {fmt(fee)} ₽</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between rounded-[14px] border border-accent/40 bg-accent/[0.09] px-4 py-3.5">
              <span className="text-sm font-bold">Заведению в месяц</span>
              <span className="whitespace-nowrap font-display text-[21px] font-bold text-accent">
                {fmt(net)} ₽
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOM / БРЕНДИНГ */}
      <section id="custom" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_460px]">
          <div data-reveal="0">
            <SectionLabel>БРЕНДИНГ · ПЛАТНАЯ ОПЦИЯ</SectionLabel>
            <SectionTitle>Страница в стиле вашего заведения</SectionTitle>
            <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-white/60">
              База — фирменный тёмный интерфейс Трекни. На тарифе «Всё включено» страница получает ваш
              логотип, название и фирменный цвет — гость видит бренд заведения, а не сервиса. Попробуйте на
              превью справа.
            </p>
          </div>
          <div className="rounded-[20px] border border-white/[0.08] bg-panel p-[26px]" data-reveal="1">
            <div className="rounded-2xl border border-white/[0.08] bg-bg p-[18px]">
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
                <span
                  className="whitespace-nowrap rounded-full border px-2 py-[3px] text-[10.5px] font-semibold"
                  style={{ borderColor: `${brand}99`, color: brand }}
                >
                  трек — 199 ₽
                </span>
              </div>
              <div className="mt-3 font-display text-[19px] font-bold">Бар «Соловей»</div>
              <div className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-white/[0.05] px-3 py-2 text-xs">
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: brand }} />
                <span className="flex-1 text-white/75">Zivert — Life</span>
                <span
                  className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[11px] font-extrabold text-ink"
                  style={{ background: brand }}
                >
                  ✓
                </span>
              </div>
              <div
                className="mt-3.5 rounded-full p-3 text-center font-display text-[11.5px] font-bold text-ink transition-colors"
                style={{ background: brand, boxShadow: `0 8px 26px ${brand}4D` }}
              >
                Заказать за 199 ₽
              </div>
            </div>
            <div className="mt-[18px] flex items-center gap-2.5">
              <span className="mr-1 text-[12.5px] text-white/55">Фирменный цвет:</span>
              {SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrand(color)}
                  className="h-[26px] w-[26px] rounded-full transition-shadow"
                  style={{
                    background: color,
                    border: `2px solid ${color === brand ? "#F2F1F7" : "transparent"}`,
                    boxShadow: color === brand ? `0 0 16px ${color}80` : "none"
                  }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div data-reveal="0">
          <SectionLabel>ТАРИФЫ</SectionLabel>
          <SectionTitle>Подписка + комиссия с заявки</SectionTitle>
        </div>
        <p className="mt-3.5 max-w-[560px] text-[14.5px] leading-relaxed text-white/60" data-reveal="1">
          Чем выше тариф — тем ниже комиссия и тем больше юридической рутины мы забираем себе. Сменить тариф
          можно в любой момент, подключение и QR-материалы бесплатны на всех тарифах.
        </p>
        <div className="mt-[30px] grid items-stretch gap-4 lg:grid-cols-3">
          {/* Старт */}
          <div className="flex flex-col rounded-[20px] border border-white/[0.08] bg-panel p-[26px]" data-reveal="1">
            <div className="text-[17px] font-bold">Старт</div>
            <div className="mt-1 text-[12.5px] text-white/50">попробовать без риска</div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-[30px] font-bold">0 ₽</span>
              <span className="text-[13px] text-white/50">/ мес</span>
            </div>
            <div className="mt-2 self-start whitespace-nowrap rounded-full border border-white/[0.16] px-[11px] py-1 font-mono text-[11.5px] text-white/75">
              комиссия 20 % с заявки
            </div>
            <div className="my-4 h-px bg-white/[0.08]" />
            <div className="flex flex-col gap-[9px] text-[13.5px] text-white/70">
              {[
                "Страница заведения и QR-материалы",
                "Плейлист, цена заявки, фоновый режим",
                "Оплата через СБП, выплаты раз в неделю",
                "Журнал воспроизведений и отчёт по трекам"
              ].map((item) => (
                <div key={item} className="flex gap-[9px]">
                  <span className="font-bold text-cyan">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a
              href="#connect"
              className="mt-auto block pt-[22px]"
            >
              <span className="block rounded-full border border-white/20 p-[13px] text-center text-[13.5px] font-semibold text-white hover:bg-white/[0.07]">
                Начать бесплатно
              </span>
            </a>
          </div>

          {/* Легал */}
          <div
            className="relative flex flex-col rounded-[20px] border border-accent/55 bg-panel p-[26px] shadow-[0_14px_50px_rgba(248,73,166,0.13)]"
            data-reveal="2"
          >
            <div className="absolute -top-[11px] left-[26px] rounded-full bg-accent px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[1px] text-ink">
              ПОПУЛЯРНЫЙ
            </div>
            <div className="text-[17px] font-bold">Легал</div>
            <div className="mt-1 text-[12.5px] text-white/50">отчётность без рутины</div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-[30px] font-bold text-accent">2 490 ₽</span>
              <span className="text-[13px] text-white/50">/ мес</span>
            </div>
            <div className="mt-2 self-start whitespace-nowrap rounded-full border border-accent/60 px-[11px] py-1 font-mono text-[11.5px] text-accent">
              комиссия 10 % с заявки
            </div>
            <div className="my-4 h-px bg-white/[0.08]" />
            <div className="flex flex-col gap-[9px] text-[13.5px] text-white/70">
              {[
                "Всё из «Старта»",
                "Документы для РАО/ВОИС: данные заведения и месячные отчёты",
                "Напоминания о сроках оплат и отчётов",
                "Статистика: выручка, топ-треки, пиковые часы",
                "QR-коды по зонам, выплаты каждый день"
              ].map((item) => (
                <div key={item} className="flex gap-[9px]">
                  <span className="font-bold text-cyan">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a href="#connect" className="mt-auto block pt-[22px]">
              <span className="block rounded-full bg-accent p-[13px] text-center font-display text-[12.5px] font-bold text-ink shadow-glow hover:brightness-110">
                Подключить
              </span>
            </a>
          </div>

          {/* Всё включено */}
          <div className="flex flex-col rounded-[20px] border border-white/[0.08] bg-panel p-[26px]" data-reveal="3">
            <div className="text-[17px] font-bold">Всё включено</div>
            <div className="mt-1 text-[12.5px] text-white/50">музыка, документы и платежи — под ключ</div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-[30px] font-bold">5 990 ₽</span>
              <span className="text-[13px] text-white/50">/ мес</span>
            </div>
            <div className="mt-2 self-start whitespace-nowrap rounded-full border border-white/[0.16] px-[11px] py-1 font-mono text-[11.5px] text-white/75">
              комиссия 7 % с заявки
            </div>
            <div className="my-4 h-px bg-white/[0.08]" />
            <div className="flex flex-col gap-[9px] text-[13.5px] text-white/70">
              {[
                "Всё из «Легала»",
                "Сопровождение РАО/ВОИС: подача отчётов, платежи, акты",
                "Брендинг страницы: логотип, цвет, без упоминания Трекни",
                "Несколько заведений, персональный менеджер"
              ].map((item) => (
                <div key={item} className="flex gap-[9px]">
                  <span className="font-bold text-cyan">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a href="#connect" className="mt-auto block pt-[22px]">
              <span className="block rounded-full border border-white/20 p-[13px] text-center text-[13.5px] font-semibold text-white hover:bg-white/[0.07]">
                Обсудить подключение
              </span>
            </a>
          </div>
        </div>
        <p className="mt-3.5 text-xs leading-relaxed text-white/40">
          Комиссия считается от суммы оплаченной заявки до выплаты заведению. В калькуляторе дохода выше
          можно подставить комиссию своего тарифа. Трекни помогает оформить и вести отчётность по РАО/ВОИС —
          стороной договоров остаётся заведение.
        </p>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div data-reveal="0">
          <SectionLabel>ОТЗЫВЫ</SectionLabel>
          <SectionTitle>Что говорят заведения</SectionTitle>
        </div>
        <div className="mt-7 grid items-stretch gap-4 lg:grid-cols-3">
          {REVIEWS.map((review, index) => (
            <div
              key={review.name}
              className="flex flex-col rounded-[20px] border border-line bg-panel p-6"
              data-reveal={index + 1}
            >
              <div className="font-display text-[26px] font-bold leading-none text-accent">“</div>
              <div className="mt-1.5 text-sm leading-relaxed text-white/75">{review.text}</div>
              <div className="mt-auto flex items-center gap-3 pt-[18px]">
                <div
                  className={cn(
                    "flex h-10 w-10 flex-none items-center justify-center rounded-full border font-mono text-xs",
                    review.tone === "accent"
                      ? "border-accent/45 bg-accent/[0.14] text-accent"
                      : "border-cyan/40 bg-cyan/[0.12] text-cyan"
                  )}
                >
                  {review.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{review.name}</div>
                  <div className="mt-px text-xs text-white/50">{review.role}</div>
                </div>
              </div>
              <div className="mt-3.5 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[11.5px] text-white/45">{review.metricLabel}</span>
                <span className="font-mono text-[13px] text-cyan">{review.metricValue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pt-[72px] lg:px-8">
        <div data-reveal="0">
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle>Частые вопросы</SectionTitle>
        </div>
        <div className="mt-4 max-w-[760px]" data-reveal="1">
          {FAQS.map((faq, index) => {
            const open = faqOpen === index;
            return (
              <div key={faq.q} className="border-b border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setFaqOpen(open ? -1 : index)}
                  className="flex w-full items-center gap-4 py-[18px] text-left"
                >
                  <span className="flex-1 text-[15.5px] font-semibold text-white">{faq.q}</span>
                  <span
                    className={cn(
                      "flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-white/[0.18] text-[15px] transition-transform",
                      open ? "rotate-45 bg-accent text-ink" : "text-white/60"
                    )}
                  >
                    +
                  </span>
                </button>
                {open ? (
                  <div className="pb-[18px] pr-10 text-[13.5px] leading-relaxed text-white/60">{faq.a}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONNECT */}
      <section id="connect" className="mx-auto max-w-[1120px] scroll-mt-[70px] px-6 pb-[90px] pt-20 lg:px-8">
        <div
          className="relative mx-auto max-w-[560px] overflow-hidden rounded-3xl border border-white/[0.09] bg-panel p-[34px]"
          data-reveal="0"
        >
          <div className="absolute -left-[60px] -top-[60px] h-[220px] w-[220px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(248,73,166,0.18),transparent_70%)]" />
          <div className="relative">
            <div className="font-display text-[23px] font-bold">Создайте кабинет заведения</div>
            <div className="mt-2.5 text-sm leading-relaxed text-white/60">
              Регистрация за минуту, без звонков и менеджеров: страница заведения, QR-коды и плейлист
              настраиваются в кабинете сразу.
            </div>
            <input
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              placeholder="Название заведения"
              className="mt-[18px] w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-[13px] text-sm text-white outline-none placeholder:text-white/40 focus:border-accent/50"
            />
            <input
              value={formEmail}
              onChange={(event) => setFormEmail(event.target.value)}
              placeholder="Email — сюда придёт доступ"
              type="email"
              className="mt-2.5 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-[13px] text-sm text-white outline-none placeholder:text-white/40 focus:border-accent/50"
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => {
                const query = new URLSearchParams({
                  venueName: formName.trim(),
                  email: formEmail.trim()
                });
                router.push(`/register?${query.toString()}`);
              }}
              className={cn(
                "mt-3.5 w-full rounded-full p-[15px] text-center font-display text-[13px] font-bold",
                canSend
                  ? "bg-accent text-ink shadow-glow hover:brightness-110"
                  : "cursor-default bg-white/[0.07] text-white/40"
              )}
            >
              Создать кабинет бесплатно
            </button>
            <div className="mt-2.5 text-center text-[11px] text-white/35">
              Тариф «Старт» — 0 ₽/мес · регистрация продолжится на следующем шаге
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-5 px-6 py-[22px] lg:px-8">
          <span className="font-display text-xs font-bold tracking-[3px] text-cyan">ТРЕКНИ</span>
          <span className="text-xs text-white/40">сервис музыкальных заявок · © 2026</span>
          <div className="ml-auto flex gap-[18px] text-[12.5px]">
            <Link href="/v/velvet-room" className="text-cyan hover:text-[#A5EFF8]">
              демо гостевого флоу
            </Link>
            <Link href="/login" className="text-cyan hover:text-[#A5EFF8]">
              вход для заведений
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
