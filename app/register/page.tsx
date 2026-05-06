import Link from "next/link";

import { VenueRegisterForm } from "@/components/auth/register-form";
import { SectionCard } from "@/components/ui/section-card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080910] px-4 py-8 text-white">
      <SectionCard className="w-full max-w-3xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Venue onboarding</div>
            <h1 className="text-3xl font-semibold">Register your venue</h1>
            <p className="text-sm leading-6 text-white/60">
              Add only the basics now. Payment and payout details can be completed later after platform verification.
            </p>
          </div>
          <VenueRegisterForm />
          <Link href="/" className="inline-flex text-sm text-white/45 hover:text-white/70">
            Back to service page
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}
