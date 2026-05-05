import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import { SectionCard } from "@/components/ui/section-card";

export default function PlatformLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-4 text-white">
      <SectionCard className="w-full max-w-md">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Platform owner</div>
            <h1 className="text-3xl font-semibold">QueueBeat platform</h1>
            <p className="text-sm leading-6 text-white/60">
              Super-admin access for approving venues and monitoring all customer accounts.
            </p>
          </div>
          <LoginForm />
          <Link href="/" className="inline-flex text-sm text-white/45 hover:text-white/70">
            Back to service page
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
