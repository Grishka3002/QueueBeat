export default function VenueLoading() {
  return (
    <main className="min-h-screen bg-[#080910] px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-4 sm:max-w-2xl lg:max-w-6xl lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
        ))}
      </div>
    </main>
  );
}
