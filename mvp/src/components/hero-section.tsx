export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* subtle obsidian emerald glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="mx-auto max-w-5xl h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-8">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          OPC 2027 Sovereign Architecture · Open-Core v6.0
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Hệ điều hành Sovereign cho{' '}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            One-Person Company
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-slate-300 font-light leading-relaxed">
          Nền tảng vận hành tự chủ cho Solo Founder & SME: Declarative Business Packs (<code>opc-pack/v1</code>),
          Payload-Bound SHA-256 Approval Gate, Honest Usage Economics & Dual-Rail RaaS (VietQR + NOWPayments).
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="rounded-xl bg-emerald-500 px-8 py-3.5 font-bold text-slate-950 transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            Khởi động OPC Dual-Rail
          </a>
          <a
            href="/templates"
            className="rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur-md px-8 py-3.5 font-semibold text-slate-100 transition-colors hover:bg-slate-800 hover:border-slate-600"
          >
            Business Packs Registry
          </a>
          <a
            href="https://github.com/mekongmind/mekongmind"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-3.5 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10"
          >
            GitHub ⭐ Open-Core
          </a>
        </div>

        {/* Pillars Bento Mini */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">01 / Runtime</div>
            <div className="text-white font-medium text-sm mt-1">100% Offline-Capable</div>
            <div className="text-xs text-slate-400 mt-1">SQLite WAL local state & zero vendor lock-in</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">02 / Governance</div>
            <div className="text-white font-medium text-sm mt-1">SHA-256 Action Digest</div>
            <div className="text-xs text-slate-400 mt-1">Payload-bound cryptographic approval gate</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">03 / Economics</div>
            <div className="text-white font-medium text-sm mt-1">Honest Usage Ledger</div>
            <div className="text-xs text-slate-400 mt-1">Preserving unknown costs without coercion</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">04 / Dual-Rail</div>
            <div className="text-white font-medium text-sm mt-1">VietQR + NOWPayments</div>
            <div className="text-xs text-slate-400 mt-1">Napas 247 tức thì + Crypto IPN quốc tế</div>
          </div>
        </div>
      </div>
    </section>
  );
}
