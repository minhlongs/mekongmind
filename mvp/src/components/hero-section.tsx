export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
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
          Mekong CLI v6.0 · Nền Tảng Điều Hành Doanh Nghiệp Tự Chủ
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Điều Hành Doanh Nghiệp Bằng{' '}
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Dòng Lệnh Thông Minh
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-base sm:text-xl text-slate-300 font-light leading-relaxed">
          Biến 1 Founder thành cỗ máy vận hành triệu đô: Tự động hóa Kế toán Thuế TT78, Chăm sóc khách hàng Zalo OA,
          Tiếp thị CMO Swarm 4 mũi và chỉ đạo dàn 4 Giám đốc AI — Lưu trữ 100% cục bộ, bảo mật tuyệt đối.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="rounded-xl bg-emerald-500 px-8 py-3.5 font-bold text-slate-950 transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            Kích Hoạt Bản Quyền Ngay
          </a>
          <a
            href="/cli"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            Tra Cứu Lệnh Mekong CLI (/cli)
          </a>
          <a
            href="/templates"
            className="rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 font-semibold text-slate-100 transition-colors hover:bg-slate-800 hover:border-slate-600"
          >
            Gói Nghiệp Vụ (Packs)
          </a>
          <a
            href="https://github.com/mekongmind/mekongmind"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-slate-300 transition-colors hover:bg-white/10"
          >
            GitHub ⭐ Open-Core
          </a>
        </div>

        {/* Pillars Bento Mini */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">01 / Dòng Lệnh Cục Bộ</div>
            <div className="text-white font-medium text-sm mt-1">100% Offline-Capable</div>
            <div className="text-xs text-slate-400 mt-1">Lưu trữ SQLite WAL trên máy bạn, zero lock-in</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">02 / Cổng Phê Duyệt</div>
            <div className="text-white font-medium text-sm mt-1">Chữ Ký SHA-256</div>
            <div className="text-xs text-slate-400 mt-1">Khóa mật mã chống gửi nhầm và chống thao túng</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">03 / Ban Giám Đốc AI</div>
            <div className="text-white font-medium text-sm mt-1">Dàn C-Suite 24/7</div>
            <div className="text-xs text-slate-400 mt-1">4 Giám đốc /cfo, /cmo, /cso, /cto phục vụ 24/7</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-emerald-400 text-xs font-mono font-semibold uppercase">04 / Cổng Thanh Toán</div>
            <div className="text-white font-medium text-sm mt-1">VietQR + NOWPayments</div>
            <div className="text-xs text-slate-400 mt-1">Napas 247 tức thì + Crypto USDT toàn cầu</div>
          </div>
        </div>
      </div>
    </section>
  );
}
