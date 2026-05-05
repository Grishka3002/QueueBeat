import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-hero-radial px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-between gap-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
              QueueBeat MVP
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl font-sans text-5xl font-semibold leading-tight sm:text-6xl">
                <span className="text-gradient">QR Music Request</span>
                <br />
                for premium venues
              </h1>
              <p className="max-w-xl text-lg leading-8 text-white/70">
                Guests scan a QR code, pick an approved track, pay, and the song lands in the venue queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/v/velvet-room"
                className="rounded-full bg-gradient-to-r from-accent to-accentBlue px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]"
              >
                Open guest flow
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5"
              >
                Open admin dashboard
              </Link>
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-[2rem] p-5 shadow-glow">
            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
              <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                <span>Velvet Room</span>
                <span>900 RUB / request</span>
              </div>
              <div className="space-y-3">
                {["Blinding Lights", "One More Time", "Midnight City"].map((track, index) => (
                  <div
                    key={track}
                    className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent via-accentBlue to-accentAmber" />
                    <div className="flex-1">
                      <div className="font-medium">{track}</div>
                      <div className="text-sm text-white/50">Curated lounge selection</div>
                    </div>
                    <div className="text-xs text-white/40">0{index + 3}:2{index}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/50">Selected track</div>
                    <div className="font-semibold">Blinding Lights</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/50">Payment</div>
                    <div className="font-semibold">900 RUB</div>
                  </div>
                </div>
                <div className="mt-4 rounded-full bg-gradient-to-r from-accent to-accentBlue px-5 py-3 text-center text-sm font-semibold">
                  Mock pay and add to queue
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
