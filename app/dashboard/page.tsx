import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { requireVenueOwner } from "@/lib/auth";

function formatVerificationStatus(status: "PENDING" | "VERIFIED" | "REJECTED") {
  const labels = {
    PENDING: "Ожидает проверки",
    VERIFIED: "Проверено",
    REJECTED: "Отклонено"
  };

  return labels[status];
}

export default async function DashboardPage() {
  const user = await requireVenueOwner();
  const venue = user.venues[0];

  if (!venue) {
    return (
      <AdminShell
        badge="Заведение"
        title="Заведение не подключено"
        description="К этому аккаунту пока не привязано заведение. Зарегистрируйте его заново или обратитесь в поддержку платформы."
        homeHref="/dashboard"
        homeLabel="Кабинет"
      >
        <SectionCard>
          <Link href="/register" className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white">
            Зарегистрировать заведение
          </Link>
        </SectionCard>
      </AdminShell>
    );
  }

  if (venue.verificationStatus === "VERIFIED") {
    redirect(`/dashboard/venues/${venue.id}`);
  }

  return (
    <AdminShell
      badge="Заведение"
      title={`${venue.name} ожидает проверки`}
      description="Владелец платформы должен проверить заведение, прежде чем станут доступны плейлист, очередь и QR-код."
      homeHref="/dashboard"
      homeLabel="Кабинет"
      previewHref={`/v/${venue.slug}` as Route}
    >
      <SectionCard>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge tone={venue.verificationStatus === "REJECTED" ? "danger" : "warning"}>
              {formatVerificationStatus(venue.verificationStatus)}
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold">{venue.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Публичная ссылка зарезервирована: <span className="text-white">/v/{venue.slug}</span>.
              Заявки останутся на паузе до завершения проверки.
            </p>
          </div>
          <Link
            href={`/v/${venue.slug}` as Route}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 hover:bg-white/5"
          >
            Посмотреть страницу гостя
          </Link>
        </div>
      </SectionCard>
    </AdminShell>
  );
}
