const STEPS = [
  {
    n: 1,
    title: "Cài đặt Mekong CLI",
    code: "curl -fsSL https://mekongmind.com/install.sh | bash",
    desc: "Cài qua 1 lệnh. Hỗ trợ macOS, Linux, Windows (WSL).",
  },
  {
    n: 2,
    title: "Đăng ký tài khoản",
    code: "mekong auth login",
    desc: "Đăng nhập bằng email hoặc Google. Tài khoản FREE: 50 credits dùng thử 14 ngày.",
  },
  {
    n: 3,
    title: "Thử lệnh đầu tiên",
    code: "mekong ke-toan invoice --amount 5000000 --vat 10 --buyer \"Khách thử\"",
    desc: "Tạo hóa đơn điện tử mẫu. Mekong sẽ trả XML + bút toán VAS.",
  },
  {
    n: 4,
    title: "Chuyển sang gói trả phí",
    code: "mekong subscribe starter-vn",
    desc: "Chọn gói 199.000₫/tháng để có 200 credits + tất cả tính năng VN.",
  },
];

const USE_CASES = [
  {
    industry: "🍰 Quán cà phê / Bakery",
    cmds: [
      "mekong ke-toan invoice --amount 250000 --buyer \"Khách bàn 3\"",
      "mekong zalo-oa caption \"croissant mới ra lò\" --tone vui_ve",
      "mekong vietqr --bank TCB --amount 250000 --description \"BAN3 CROISSANT\"",
    ],
  },
  {
    industry: "👗 Shop thời trang online",
    cmds: [
      "mekong marketing-vn facebook \"sale 30% áo dài Tết\"",
      "mekong ke-toan invoice --amount 850000 --vat 10 --buyer \"...\"",
      "mekong thue-dnvn tncn --income 30000000",
    ],
  },
  {
    industry: "💻 Freelancer / Solopreneur",
    cmds: [
      "mekong thue-dnvn tndn --revenue 1200000000",
      "mekong phap-ly-vn hop-dong \"dịch vụ tư vấn IT\"",
      "mekong bhxh report --employees 1 --salary 25000000",
    ],
  },
];

export default function VNGuide() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Hướng Dẫn Nhanh — 5 Phút</h1>
        <p className="mt-3 text-slate-600">
          Từ cài đặt đến hóa đơn đầu tiên — không cần biết lập trình.
        </p>

        <div className="mt-10 space-y-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                  {s.n}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <div className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
                  <code>{s.code}</code>
                </div>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold">Ví Dụ Thực Tế Theo Ngành</h2>
          <div className="mt-8 space-y-8">
            {USE_CASES.map((u) => (
              <div
                key={u.industry}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-xl font-semibold">{u.industry}</h3>
                <div className="mt-4 space-y-2">
                  {u.cmds.map((c) => (
                    <div
                      key={c}
                      className="overflow-x-auto rounded bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
                    >
                      $ {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-amber-50 p-6 text-sm">
          <p>
            <strong>Lưu ý:</strong> Tư vấn AI không thay thế kế toán/luật sư có
            chứng chỉ hành nghề. Luôn xác nhận với chuyên gia trước khi nộp hồ
            sơ chính thức cho cơ quan thuế / Sở KH&ĐT / BHXH.
          </p>
        </div>
      </div>
    </section>
  );
}
