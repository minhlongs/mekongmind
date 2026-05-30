const FEATURES = [
  {
    cmd: "/ke-toan",
    title: "Kế Toán VAS",
    desc: "Tạo hóa đơn điện tử chuẩn TT78/2021, bút toán Nợ/Có VAS, xuất XML + PDF.",
    example: "ke-toan invoice --amount 5000000 --vat 10 --buyer \"Nguyễn Văn A\"",
    output: "→ Hóa đơn 1B/24E001 · Nợ 131: 5.5tr · Có 511: 5tr · Có 3331: 0.5tr",
  },
  {
    cmd: "/thue-dnvn",
    title: "Tính Thuế VN",
    desc: "TNCN biểu lũy tiến 5-35%, TNDN 17-20%, GTGT 0/5/8/10%. Offline.",
    example: "thue-dnvn tncn --income 30000000",
    output: "→ Thu nhập tính thuế: 19tr · Thuế TNCN: 2.15tr/tháng",
  },
  {
    cmd: "/zalo-oa",
    title: "Marketing Zalo OA",
    desc: "Đăng bài broadcast, tạo caption VN tự động, tone thân thiện/chuyên nghiệp.",
    example: "zalo-oa caption \"áo dài Tết 2026\" --tone than_thien",
    output: "→ \"Tết này diện áo dài rộn ràng ✨ Free ship toàn quốc...\"",
  },
  {
    cmd: "/vietqr",
    title: "VietQR Thanh Toán",
    desc: "QR code chuẩn VietQR, hỗ trợ 40+ ngân hàng VN (VCB, TCB, MB, BIDV, ...).",
    example: "vietqr --bank VCB --account 0123456789 --amount 2500000",
    output: "→ QR code scan bằng app VCB/TCB/MoMo · Link: vietqr.io/...",
  },
  {
    cmd: "/bhxh",
    title: "BHXH/BHYT/BHTN",
    desc: "Tính đóng BHXH 8%, BHYT 1.5%, BHTN 1% (NLĐ) + 22% (NSDLĐ). Template D02-TS.",
    example: "bhxh report --employees 1 --salary 10000000",
    output: "→ NLĐ đóng: 1.05tr · NSDLĐ đóng: 2.2tr · D02-TS.xlsx",
  },
];

export default function VNFeatures() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-4xl font-bold">5 Công Cụ VN Cốt Lõi</h1>
        <p className="mt-3 text-center text-slate-600">
          Mỗi command chạy được trên CLI, web, hoặc Zalo bot — không cần code.
        </p>

        <div className="mt-12 space-y-8">
          {FEATURES.map((f) => (
            <div
              key={f.cmd}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-baseline gap-3">
                <span className="rounded bg-indigo-100 px-2 py-1 font-mono text-sm text-indigo-700">
                  {f.cmd}
                </span>
                <h2 className="text-xl font-semibold">{f.title}</h2>
              </div>
              <p className="mt-3 text-slate-600">{f.desc}</p>
              <div className="mt-4 rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
                <div className="text-slate-500">$ mekong {f.example}</div>
                <div className="mt-2 text-emerald-300">{f.output}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-indigo-50 p-8 text-center">
          <h3 className="text-2xl font-bold">Bạn cần thêm tính năng?</h3>
          <p className="mt-2 text-slate-600">
            Mekong AI hỗ trợ 342+ commands — kế hoạch năm, định giá, vay vốn, hợp đồng...
          </p>
        </div>
      </div>
    </section>
  );
}
