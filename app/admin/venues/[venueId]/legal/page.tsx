import type { Route } from "next";
import Link from "next/link";

import { getAdminVenueById } from "@/lib/data";
import { getDemoPlaybackLog } from "@/lib/demo-store";
import { env } from "@/lib/env";
import { tariffOf } from "@/lib/tariffs";
import { formatDuration } from "@/lib/utils";

export default async function VenueLegalPage({
  params
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const data = await getAdminVenueById(venueId);
  const { venue } = data;
  const tariff = tariffOf("tariff" in venue ? (venue.tariff as string) : "start");
  const locked = tariff.id === "start";
  const fullService = tariff.id === "all";
  const log = env.demoMode ? getDemoPlaybackLog(venueId, 30) : [];

  return (
    <>
      {locked ? (
        <div className="flex flex-col gap-4 rounded-[18px] border border-dashed border-white/[0.18] bg-panel p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="text-[15px] font-bold text-white">
              Документы для РАО/ВОИС — на тарифе «Легал»
            </div>
            <div className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
              Журнал воспроизведений уже ведётся автоматически. «Легал» добавит месячные отчёты,
              данные заведения и напоминания о сроках; «Всё включено» — подачу отчётов и платежи на
              нашей стороне.
            </div>
          </div>
          <Link
            href={`/#pricing` as Route}
            className="flex-none rounded-full bg-accent px-5 py-3 text-center font-display text-[11.5px] font-bold text-ink hover:brightness-110"
          >
            Условия тарифов →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-3">
          <div className="rounded-[18px] border border-line bg-panel p-[18px]">
            <div className="flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-cyan" />
              <span className="text-xs text-white/50">Договор РАО</span>
            </div>
            <div className="mt-2 text-[17px] font-bold text-white">активен</div>
            <div className="mt-1 font-mono text-[11px] text-white/50">оплачено до 31.12.2026</div>
          </div>
          <div className="rounded-[18px] border border-line bg-panel p-[18px]">
            <div className="flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-warn" />
              <span className="text-xs text-white/50">Договор ВОИС</span>
            </div>
            <div className="mt-2 text-[17px] font-bold text-white">активен</div>
            <div className="mt-1 font-mono text-[11px] text-warn">платёж за III кв — до 10.08, напомним</div>
          </div>
          <div className="rounded-[18px] border border-line bg-panel p-[18px]">
            <div className="flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-accent" />
              <span className="text-xs text-white/50">Сопровождение</span>
            </div>
            <div className="mt-2 text-[17px] font-bold text-white">
              {fullService ? "отчёты подаёт Трекни" : "отчёты подаёте вы"}
            </div>
            <div className="mt-1 text-[11px] leading-normal text-white/50">
              {fullService
                ? "агентская схема: подача отчётов, платежи и акты — на нашей стороне"
                : "мы готовим документы; подачу и платежи берёт «Всё включено»"}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[15px] font-bold text-white">Журнал воспроизведений</div>
          <span className="font-mono text-[11.5px] text-white/45">
            {env.demoMode ? `${log.length} последних записей` : "доступен в демо-режиме"}
          </span>
        </div>

        {log.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
            Записи появятся, как только плеер начнёт играть — открой{" "}
            <Link href={`/player/${venueId}` as Route} className="text-cyan hover:text-[#A5EFF8]">
              плеер заведения
            </Link>{" "}
            на пару минут.
          </div>
        ) : (
          <div className="mt-2 flex flex-col">
            {log.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3.5 border-b border-hairline py-2.5 last:border-none">
                <span className="w-12 flex-none font-mono text-xs text-white/45">
                  {entry.startedAt.toTimeString().slice(0, 5)}
                </span>
                <div className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white">
                  {entry.track ? `${entry.track.title} — ${entry.track.artist}` : "—"}
                </div>
                <span
                  className={
                    entry.source === "request"
                      ? "mono-chip border-accent/50 text-accent"
                      : "mono-chip"
                  }
                >
                  {entry.source === "request" ? "заявка" : "фон"}
                </span>
                <span className="w-10 flex-none text-right font-mono text-[11.5px] text-white/45">
                  {formatDuration(entry.durationSec)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 text-[11.5px] leading-relaxed text-white/40">
          Фиксируется каждое публичное воспроизведение: дата, время, трек, источник (фон или заявка
          гостя). Журнал хранится 3 года — из него собираются отчёты и пакет документов для РАО/ВОИС.
        </div>
      </div>
    </>
  );
}
