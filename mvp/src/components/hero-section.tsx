export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* subtle emerald glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="mx-auto max-w-5xl rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          Điều phối Solo Company — từ ý tưởng đến{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            $1M MRR
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-400">
          Open-source Solo Company OS. 10 phòng ban AI.{' '}
          <span className="text-slate-300">Evidence-gated execution.</span>
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/templates"
            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
          >
            Xem Templates
          </a>
          <a
            href="https://github.com/mekongmind/mekongmind"
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            GitHub ⭐
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          <span>⭐ 500+ stars</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>100+ solo founders</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Open Source</span>
        </div>
      </div>
    </section>
  );
}
