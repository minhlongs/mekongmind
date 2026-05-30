import Link from "next/link";

const TIERS = [
  {
    key: "starter_vn",
    name: "Khởi Đầu",
    price: "199.000₫",
    period: "/tháng",
    usdNote: "(~$7.99)",
    credits: "200 credits/tháng",
    target: "OPC, freelancer, hộ kinh doanh",
    features: [
      "Tất cả 6 phòng ban VN",
      "Kế toán, Marketing Zalo, VietQR",
      "Hỗ trợ qua Zalo OA",
      "1 tài khoản",
    ],
    cta: "Bắt đầu 14 ngày miễn phí",
    highlight: false,
  },
  {
    key: "growth_vn",
    name: "Tăng Trưởng",
    price: "499.000₫",
    period: "/tháng",
    usdNote: "(~$19.99)",
    credits: "800 credits/tháng",
    target: "Doanh nghiệp nhỏ 2-10 người",
    features: [
      "Tất cả tính năng Khởi Đầu",
      "Zalo OA broadcast tự động",
      "Priority queue (nhanh hơn 3x)",
      "Backup hàng tuần",
      "3 tài khoản",
    ],
    cta: "Chọn Tăng Trưởng",
    highlight: true,
  },
  {
    key: "pro_vn",
    name: "Chuyên Nghiệp",
    price: "1.200.000₫",
    period: "/tháng",
    usdNote: "(~$49.99)",
    credits: "3.000 credits/tháng",
    target: "SME 10-50 người",
    features: [
      "Tất cả tính năng Tăng Trưởng",
      "Custom agents theo ngành",
      "Hỗ trợ kế toán/luật sư",
      "Slack/Zalo dedicated channel",
      "Unlimited tài khoản",
    ],
    cta: "Liên hệ tư vấn",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Có cần biết lập trình không?",
    a: "KHÔNG. Bạn chỉ cần biết gõ tiếng Việt. Mekong AI hiểu câu lệnh tự nhiên: \"tạo hoá đơn 5 triệu cho Nguyễn Văn A\".",
  },
  {
    q: "Thanh toán bằng VND được không?",
    a: "Hiện tại thanh toán qua Polar.sh bằng USD (đã quy đổi VND). Sẽ hỗ trợ VietQR/chuyển khoản trực tiếp Q3/2026.",
  },
  {
    q: "Dữ liệu của tôi có riêng tư không?",
    a: "Có. Mỗi user có namespace riêng (tenant isolation). Mekong AI có thể chạy local trên máy bạn (MLX/Ollama) — dữ liệu KHÔNG rời máy.",
  },
  {
    q: "Tư vấn AI có thay thế kế toán/luật sư không?",
    a: "KHÔNG. Mekong AI là trợ lý, không phải người hành nghề có chứng chỉ. Luôn xác nhận với chuyên gia trước khi nộp hồ sơ chính thức.",
  },
];

export default function VNPricing() {
  return (
    <>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-center text-4xl font-bold">
            Bảng Giá Đơn Giản, Minh Bạch
          </h1>
          <p className="mt-3 text-center text-slate-600">
            Trả tháng. Hủy bất cứ lúc nào. Không phí ẩn.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.key}
                className={`rounded-2xl border bg-white p-6 ${
                  t.highlight
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200"
                }`}
              >
                {t.highlight && (
                  <div className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    PHỔ BIẾN NHẤT
                  </div>
                )}
                <h2 className="text-2xl font-bold">{t.name}</h2>
                <div className="mt-3 flex items-baseline">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="ml-1 text-slate-500">{t.period}</span>
                </div>
                <p className="text-sm text-slate-400">{t.usdNote}</p>
                <p className="mt-1 text-sm font-medium text-indigo-700">
                  {t.credits}
                </p>
                <p className="mt-4 text-sm text-slate-600">{t.target}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/vn/lien-he"
                  className={`mt-6 block rounded-md py-3 text-center font-semibold ${
                    t.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-slate-500">
            <strong>So sánh:</strong> Thuê kế toán partime 5tr/tháng + Agency marketing 20tr/tháng = 25tr/tháng.
            <br />
            Mekong AI Khởi Đầu = <strong>199.000₫</strong> (tiết kiệm 99%).
          </p>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">Câu Hỏi Thường Gặp</h2>
          <div className="mt-10 space-y-6">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-slate-200 bg-white p-5"
              >
                <summary className="cursor-pointer font-semibold">
                  {item.q}
                </summary>
                <p className="mt-3 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
