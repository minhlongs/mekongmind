import Link from "next/link";

const DEPARTMENTS = [
  { icon: "📊", name: "Kế Toán", desc: "Hóa đơn VAS, thuế TNCN/TNDN/GTGT, MISA CSV" },
  { icon: "💼", name: "Kinh Doanh", desc: "CRM Zalo, đơn hàng, pipeline bán hàng" },
  { icon: "📢", name: "Marketing", desc: "Zalo OA, Facebook Ads, TikTok script VN" },
  { icon: "⚙️", name: "Vận Hành", desc: "BHXH, hợp đồng LĐ, kho hàng, lịch ca" },
  { icon: "⚖️", name: "Pháp Lý", desc: "Hợp đồng, ĐKKD, tuân thủ NĐ 13/2023 PDPA" },
  { icon: "💰", name: "Tài Chính", desc: "Dòng tiền, vay vốn, định giá doanh nghiệp" },
];

const PAIN_POINTS = [
  { vs: "✗ Thuê kế toán", cost: "5–10 triệu/tháng" },
  { vs: "✗ Agency marketing", cost: "20–50 triệu/tháng" },
  { vs: "✗ Nhân viên bán hàng", cost: "8–15 triệu/tháng" },
];

export default function VNHome() {
  return (
    <>
      <section className="bg-gradient-to-b from-indigo-50 to-white px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Doanh nghiệp 1 người.
            <br />
            <span className="text-indigo-700">Vận hành như 10 người.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 md:text-xl">
            Mekong AI thay bạn làm kế toán, marketing, vận hành — 24/7,
            <br className="hidden md:block" />
            bằng tiếng Việt, trên máy của bạn.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/vn/bang-gia"
              className="rounded-md bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700"
            >
              Bắt đầu miễn phí 14 ngày →
            </Link>
            <Link
              href="/vn/tinh-nang"
              className="rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xem tính năng
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">
            6 Bộ Phận. 1 Trợ Lý AI.
          </h2>
          <p className="mt-2 text-center text-slate-600">
            Mỗi bộ phận có agent chuyên trách, hiểu luật VN, văn hoá VN
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((d) => (
              <div
                key={d.name}
                className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="text-3xl">{d.icon}</div>
                <h3 className="mt-3 text-xl font-semibold">{d.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Tiết kiệm 90% chi phí vận hành</h2>
          <div className="mt-10 space-y-3 text-left">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.vs}
                className="flex items-center justify-between border-b border-slate-700 pb-3"
              >
                <span className="text-slate-300">{p.vs}</span>
                <span className="font-semibold text-rose-400">{p.cost}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 text-lg">
              <span className="font-semibold text-emerald-400">✓ Mekong AI</span>
              <span className="font-bold text-emerald-400">từ 199.000₫/tháng</span>
            </div>
          </div>
          <Link
            href="/vn/bang-gia"
            className="mt-10 inline-block rounded-md bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500"
          >
            Xem bảng giá VND →
          </Link>
        </div>
      </section>
    </>
  );
}
