const CHANNELS = [
  {
    icon: "💬",
    name: "Zalo OA (Khuyến nghị)",
    desc: "Nhanh nhất — phản hồi trong giờ hành chính (8h-18h, T2-T6)",
    cta: "Nhắn Zalo OA",
    href: "https://zalo.me/mekongmind",
  },
  {
    icon: "📧",
    name: "Email",
    desc: "Cho câu hỏi phức tạp, cần đính kèm file",
    cta: "hello@mekongmind.com",
    href: "mailto:hello@mekongmind.com",
  },
  {
    icon: "📘",
    name: "Facebook Page",
    desc: "Theo dõi tin tức, tips, case study",
    cta: "Theo dõi trang",
    href: "https://facebook.com/mekongmind",
  },
  {
    icon: "🐙",
    name: "GitHub",
    desc: "Bug report, feature request, open-source code",
    cta: "github.com/mekong-ai",
    href: "https://github.com/mekong-ai",
  },
];

export default function VNContact() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-4xl font-bold">Liên Hệ</h1>
        <p className="mt-3 text-center text-slate-600">
          Đội ngũ Mekong AI sẵn sàng hỗ trợ bạn 24/7 qua Zalo.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {CHANNELS.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="text-3xl">{c.icon}</div>
              <h2 className="mt-3 text-lg font-semibold">{c.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
              <div className="mt-4 font-medium text-indigo-700">
                {c.cta} →
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-indigo-50 p-6 text-center">
          <h2 className="text-xl font-semibold">Bạn muốn pilot cho 10+ user?</h2>
          <p className="mt-2 text-slate-600">
            Liên hệ trực tiếp để được tư vấn gói Chuyên Nghiệp + Custom agents
            theo ngành.
          </p>
          <a
            href="mailto:hello@mekongmind.com?subject=Mekong AI - Pilot Program"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Đặt lịch tư vấn
          </a>
        </div>
      </div>
    </section>
  );
}
