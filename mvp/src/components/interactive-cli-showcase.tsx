'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Scenario {
  id: string;
  tabLabel: string;
  badge: string;
  description: string;
  command: string;
  terminalOutput: string[];
  cockpitCard: {
    title: string;
    status: string;
    statusColor: string;
    shaDigest: string;
    summary: string;
    details: { label: string; value: string }[];
    actionLabel: string;
    actionHref: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'init',
    tabLabel: '01. Khởi tạo 30s',
    badge: 'Boot & Setup',
    description: 'Cài đặt Mekong CLI, khởi tạo không gian làm việc cục bộ 100% offline với SQLite WAL.',
    command: 'mekong init --name "CongTyMotThanhVien" --tier basic',
    terminalOutput: [
      '[INFO] Khởi tạo không gian làm việc Mekong OPC v6.0...',
      '[OK] Tạo cơ sở dữ liệu SQLite WAL: .mekong/company.db',
      '[OK] Xác thực cấu trúc 25-bước: 25/25 READY (HMAC verified)',
      '[OK] Cài đặt 4 Giám đốc C-Suite AI: /cfo, /cmo, /cso, /cto',
      '[OK] Cấu hình Dual-Rail: VietQR Napas 247 + NOWPayments USDT',
      '[SUCCESS] Không gian làm việc sẵn sàng trong 3.2s! Gõ `mekong` để bắt đầu.',
    ],
    cockpitCard: {
      title: 'Trạng thái Doanh nghiệp (OPC Cockpit)',
      status: '25/25 READY',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      shaDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      summary: 'Không gian làm việc đã khởi tạo thành công trên máy của bạn với zero-cloud lock-in.',
      details: [
        { label: 'Doanh nghiệp', value: 'CongTyMotThanhVien' },
        { label: 'Cơ sở dữ liệu', value: 'SQLite WAL (Cục bộ)' },
        { label: 'Bộ máy điều hành', value: '4 Giám đốc C-Suite AI' },
        { label: 'Cổng thanh toán', value: 'VietQR Napas 247 + USDT' },
      ],
      actionLabel: 'Mở OPC Cockpit Web →',
      actionHref: 'http://localhost:3000/dashboard/opc',
    },
  },
  {
    id: 'ke-toan',
    tabLabel: '02. Kế toán & Thuế TT78',
    badge: 'Phễu Kế Toán VN',
    description: 'Đối soát hóa đơn điện tử TT78, tính thuế TNCN/TNDN/GTGT và xuất tờ khai chuẩn Tổng cục Thuế.',
    command: 'mekong ke-toan tt78 --quy 4 --nam 2026 --doi-soat-xml',
    terminalOutput: [
      '[INFO] Đang quét 142 hóa đơn điện tử XML đầu vào & đầu ra...',
      '[OK] Định dạng Thông tư 78/2021/TT-BTC: Hợp lệ 100%',
      '[INFO] Tính toán nghĩa vụ thuế Q4/2026:',
      '  - Thuế GTGT đầu ra: 48,500,000 VND | Đầu vào: 19,200,000 VND',
      '  - Thuế GTGT còn phải nộp: 29,300,000 VND',
      '  - Tạm tính TNDN: 18,600,000 VND',
      '[GATE] Đã tạo SHA-256 Approval Digest: a8f9...31c2',
      '[WAIT] Chờ CEO phê duyệt trên Cockpit để xuất file nộp qua Thuedientu.',
    ],
    cockpitCard: {
      title: 'Tờ Khai Thuế & Hóa Đơn TT78 (Q4/2026)',
      status: 'CHỜ DUYỆT SHA-256',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      shaDigest: 'sha256:a8f941b2c7e03492815e102f4a569cb91427ae41e4649b934ca495991b7831c2',
      summary: 'Dữ liệu thuế đã được đối soát 100% khớp XML. Cần chữ ký phê duyệt của Founder.',
      details: [
        { label: 'Tổng hóa đơn', value: '142 hóa đơn TT78' },
        { label: 'GTGT phải nộp', value: '29,300,000 VND' },
        { label: 'TNDN tạm tính', value: '18,600,000 VND' },
        { label: 'Cơ chế duyệt', value: 'Payload-Bound SHA-256' },
      ],
      actionLabel: 'Phê duyệt Tờ Khai Ngay →',
      actionHref: '#pricing',
    },
  },
  {
    id: 'zalo-oa',
    tabLabel: '03. Zalo OA & Chăm sóc',
    badge: 'Phễu Khách Hàng VN',
    description: 'Tự động gửi thông báo hóa đơn, phản hồi tin nhắn khách hàng và gửi báo giá qua Zalo OA chính thức.',
    command: 'mekong zalo-oa broadcast --template "thong_bao_tt78" --target leads_q4',
    terminalOutput: [
      '[INFO] Kết nối Zalo Official Account API (Token hợp lệ)...',
      '[OK] Template "thong_bao_tt78" đã kiểm duyệt bởi VNG / Zalo',
      '[INFO] Lọc danh sách khách hàng: 86 khách hàng đủ chuẩn ICP',
      '[PROGRESS] [████████████████████████] 86/86 (100%)',
      '  - Tỷ lệ mở đọc tin: 94.2%',
      '  - Số lượng phản hồi yêu cầu báo giá: 28 leads',
      '[SUCCESS] Toàn bộ phản hồi được chuyển về CRM cục bộ (SQLite).',
    ],
    cockpitCard: {
      title: 'Chiến Dịch Zalo OA Broadcast',
      status: 'HOÀN THÀNH 100%',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      shaDigest: 'sha256:f1c8432a921d7b098192a45012e8b01247ae41e4649b934ca495991b785291aa',
      summary: 'Tin nhắn gửi trực tiếp vào Zalo của khách hàng Việt Nam với thương hiệu tích xanh chính thức.',
      details: [
        { label: 'Kênh gửi', value: 'Zalo OA Doanh Nghiệp' },
        { label: 'Khách nhận', value: '86 doanh nghiệp' },
        { label: 'Tỷ lệ mở', value: '94.2% (Siêu cao)' },
        { label: 'Khách quan tâm', value: '28 leads chất lượng' },
      ],
      actionLabel: 'Xem Báo Cáo Zalo CRM →',
      actionHref: '/cmo',
    },
  },
  {
    id: 'cmo-run',
    tabLabel: '04. CMO Swarm 4 Mũi',
    badge: 'Marketing & Tăng Trưởng',
    description: 'Chấp bút nội dung song ngữ, phân tích lỗ hổng SEO, săn lead B2B SDR và xuất hợp đồng bằng chứng SOP.',
    command: 'mekong marketing cmo-run "Tăng trưởng One-Person Company" --channel zalo',
    terminalOutput: [
      '[INFO] Kích hoạt CMO Swarm 4 Mũi Giáp Công:',
      '  [Mũi 1] Viết bài truyền thông Zalo & LinkedIn song ngữ: Hoàn thành',
      '  [Mũi 2] Kiểm toán SEO từ khóa "One-Person Company": Điểm 95/100',
      '  [Mũi 3] Săn 12 B2B Leads đủ chuẩn ICP (Điểm >= 70%): Sẵn sàng',
      '  [Mũi 4] Đóng cổng bằng chứng repeatable-channel.json: 14/14 trường chuẩn',
      '[SUCCESS] Bàn giao hợp đồng tăng trưởng sang bộ phận Sales & Revenue.',
    ],
    cockpitCard: {
      title: 'Hồ Sơ Tăng Trưởng CMO Swarm',
      status: '14/14 TRƯỜNG SOP',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      shaDigest: 'sha256:7b92a45118c7e098192a45012e8b01247ae41e4649b934ca495991b7852c039f',
      summary: 'Quy trình tiếp thị khép kín thay thế 3 nhân viên phòng Marketing truyền thống.',
      details: [
        { label: 'Bài viết sẵn sàng', value: '4 kênh (Zalo, Blog, LI, X)' },
        { label: 'Leads đạt chuẩn ICP', value: '12 doanh nghiệp' },
        { label: 'Chi phí mỗi Lead', value: '$15.50 (Tiết kiệm 82%)' },
        { label: 'Hợp đồng SOP', value: 'repeatable-channel.json' },
      ],
      actionLabel: 'Khám phá CMO Cockpit →',
      actionHref: '/cmo',
    },
  },
  {
    id: 'cfo-budget',
    tabLabel: '05. Giám đốc Tài chính /cfo',
    badge: 'Tài Chính & Định Giá',
    description: 'Dự báo dòng tiền 12 tháng, kiểm soát điểm hòa vốn và đối soát doanh thu đa tiền tệ (VND/USD/USDT).',
    command: 'mekong cfo budget --thang 11 --nam 2026 --doi-chieu-arr',
    terminalOutput: [
      '[INFO] Giám đốc Tài chính AI (/cfo) tổng hợp số liệu thời gian thực...',
      '  - Doanh thu dự kiến tháng 11/2026: 285,000,000 VND ($11,400)',
      '  - Chi phí hạ tầng & AI Inference thực tế: 9,200,000 VND ($368)',
      '  - Biên lợi nhuận ròng (Net Margin): 88.5%',
      '[OK] Đối soát Napas 247 (VietQR): Khớp 100% tài khoản ngân hàng',
      '[OK] Đối soát NOWPayments USDT: Đã ghi sổ SQLite WAL không trùng lặp',
      '[SUCCESS] Lập kế hoạch tài chính đã sẵn sàng cho quyết định của Founder.',
    ],
    cockpitCard: {
      title: 'Báo Cáo Tài Chính & Dòng Tiền (/cfo)',
      status: 'BIÊN LỢI NHUẬN 88.5%',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      shaDigest: 'sha256:3289ab712c4e5698192a45012e8b01247ae41e4649b934ca495991b7852194bb',
      summary: 'Kiểm soát tài chính trung thực không thiên vị, không hoa hồng ẩn, minh bạch tuyệt đối.',
      details: [
        { label: 'Doanh thu tháng', value: '285,000,000 VND' },
        { label: 'Chi phí vận hành', value: '9,200,000 VND (3.2%)' },
        { label: 'Biên lợi nhuận ròng', value: '88.5%' },
        { label: 'Cổng đối soát', value: 'Dual-Rail (VND + Crypto)' },
      ],
      actionLabel: 'Xem Bảng Giá Đầu Tư →',
      actionHref: '#pricing',
    },
  },
];

export default function InteractiveCliShowcase() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('init');
  const [copied, setCopied] = useState<boolean>(false);

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-24 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* TẦNG 1: INTERACTIVE CLI TERMINAL SIMULATOR                                 */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
            ● Trực quan hóa Mekong CLI &amp; Web Cockpit
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            1 Câu Lệnh Dưới Máy — Toàn Bộ Doanh Nghiệp Vận Hành Trên Web
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bạn không cần am hiểu công nghệ phức tạp. Mọi thao tác kinh doanh từ nộp thuế, chăm sóc khách Zalo,
            đến tiếp thị được thực hiện qua dòng lệnh ngắn gọn và hiển thị tức thì trên buồng lái Web Cockpit.
          </p>
        </div>

        {/* Scenario Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SCENARIOS.map((item) => {
            const active = item.id === activeScenarioId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScenarioId(item.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-[#0b0f17] text-slate-400 border border-white/10 hover:border-slate-600 hover:text-white'
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Dual-Pane Terminal & Web Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: macOS Terminal Simulator */}
          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#07090e] shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0d1117] border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  terminal — mekong-cli v6.0 (darwin-arm64)
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                {scenario.badge}
              </span>
            </div>

            {/* Terminal Content */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed space-y-4 flex-1">
              <div>
                <p className="text-slate-500 text-xs mb-2"># {scenario.description}</p>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 break-all">
                    <span className="text-slate-500 select-none">$</span>
                    <span className="font-bold">{scenario.command}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(scenario.command)}
                    className="shrink-0 text-[11px] text-slate-400 hover:text-emerald-300 ml-2 px-2 py-1 rounded bg-white/5 border border-white/10"
                  >
                    {copied ? '✓ Đã chép' : 'Chép'}
                  </button>
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="space-y-1.5 pt-2 text-slate-300">
                {scenario.terminalOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className={`${
                      line.includes('[SUCCESS]') || line.includes('[OK]')
                        ? 'text-emerald-300'
                        : line.includes('[GATE]') || line.includes('[WAIT]')
                        ? 'text-amber-300'
                        : line.includes('[PROGRESS]')
                        ? 'text-cyan-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-emerald-400 pt-2">
                  <span className="text-slate-500">$</span>
                  <span className="w-2 h-4 bg-emerald-400 inline-block animate-pulse" />
                </div>
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="px-4 py-2.5 bg-[#0a0d14] border-t border-white/10 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>SQLite WAL: .mekong/company.db</span>
              <span className="text-emerald-400">100% Offline-Capable</span>
            </div>
          </div>

          {/* Right: Web Cockpit Output Card */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0e1626] to-[#070b12] p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
                  Màn Hình Web Cockpit
                </span>
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${scenario.cockpitCard.statusColor}`}
                >
                  {scenario.cockpitCard.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{scenario.cockpitCard.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {scenario.cockpitCard.summary}
                </p>
              </div>

              {/* Metrics / Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {scenario.cockpitCard.details.map((d, i) => (
                  <div key={i} className="rounded-xl bg-black/40 border border-white/10 p-3">
                    <div className="text-[11px] font-mono text-slate-400">{d.label}</div>
                    <div className="text-xs font-bold text-white mt-1 break-words">{d.value}</div>
                  </div>
                ))}
              </div>

              {/* Cryptographic Proof */}
              <div className="rounded-xl bg-[#05080f] border border-white/10 p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-500">
                  Cơ chế phê duyệt mật mã (Approval Gate)
                </div>
                <div className="text-[11px] font-mono text-emerald-400 break-all">
                  {scenario.cockpitCard.shaDigest}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={scenario.cockpitCard.actionHref}
                className="w-full block text-center rounded-xl bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                {scenario.cockpitCard.actionLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TẦNG 2: SƠ ĐỒ 3 BƯỚC HOẠT ĐỘNG (HOW IT WORKS)                              */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            ● Quy trình 3 bước khép kín
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Cách Mekong CLI Điều Hành Doanh Nghiệp
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Mọi thứ bắt đầu từ dòng lệnh cục bộ trên máy tính của bạn và đồng bộ minh bạch lên buồng lái Web.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-base">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Cài Đặt &amp; Khởi Tạo 30 Giây</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cài đặt qua <code className="text-emerald-300 font-mono">pip install mekong-cli</code>. Khởi tạo
              doanh nghiệp trong 3 giây. Dữ liệu lưu trữ hoàn toàn trên máy bạn với SQLite WAL, không lo rò rỉ.
            </p>
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 font-mono text-[11px] text-slate-300">
              $ pip install mekong-cli<br />
              $ mekong init --tier basic
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-[#0b0f17] p-6 space-y-4 shadow-lg shadow-emerald-500/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-300 text-base">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Giao Việc Cho Dàn C-Suite AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dùng 189 nhóm lệnh nghiệp vụ chuyên sâu: Thuế TT78, Zalo OA, Tiếp thị hoặc gọi trực tiếp
              4 Giám đốc AI (<code className="text-emerald-300 font-mono">/cfo</code>,{' '}
              <code className="text-emerald-300 font-mono">/cmo</code>,{' '}
              <code className="text-emerald-300 font-mono">/cso</code>,{' '}
              <code className="text-emerald-300 font-mono">/cto</code>).
            </p>
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 font-mono text-[11px] text-emerald-400">
              $ mekong ke-toan tt78<br />
              $ mekong marketing cmo-run
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-base">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Phê Duyệt &amp; Thanh Toán Tức Thì</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mọi hành động nhạy cảm (xuất tiền, nộp thuế, phát hành nội dung) đều tạo chữ ký SHA-256 yêu cầu
              bạn bấm duyệt. Thanh toán tự động qua VietQR Napas 247 hoặc NOWPayments USDT.
            </p>
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 font-mono text-[11px] text-cyan-300">
              ✓ SHA-256 Approval Gate<br />
              ✓ VietQR Napas 247 + USDT
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TẦNG 3: 3 PHỄU NGHIỆP VỤ CỐT LÕI VIỆT NAM                                 */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            ● Nghiệp vụ thực tế sát sườn
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            3 Phễu Nghiệp Vụ Cốt Lõi Cho Doanh Nghiệp Việt
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Được đóng gói sẵn sàng thực thi, giải quyết triệt để các bài toán sống còn của công ty tại Việt Nam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phễu 1: Zalo OA */}
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💬</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                Zalo OA &amp; CRM VN
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Chăm Sóc &amp; Chốt Đơn Zalo Tự Động</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tích hợp chính thức Zalo Official Account. Tự động gửi thông báo phí, hóa đơn TT78, tin chăm sóc
              khách hàng và thu tiền qua VietQR động với tỷ lệ mở đọc trên 90%.
            </p>
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-xs text-blue-300">
              <div className="text-slate-500 text-[10px]"># Lệnh thực thi:</div>
              mekong zalo-oa broadcast
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li>✓ Mẫu tin VNG duyệt chuẩn quy định</li>
              <li>✓ Tích hợp VietQR động chuyển khoản ngay</li>
              <li>✓ Lưu trữ lịch sử chat CRM trên SQLite</li>
            </ul>
          </div>

          {/* Phễu 2: Kế toán & Thuế TT78 */}
          <div className="rounded-2xl border border-emerald-500/40 bg-[#0b0f17] p-6 space-y-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📊</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                VAS &amp; TT78
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Kế Toán &amp; Tờ Khai Thuế Tự Động</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tự động đọc và đối soát file hóa đơn điện tử XML theo chuẩn Thông tư 78/2021/TT-BTC. Tự động tính
              thuế GTGT, TNCN, TNDN và xuất tờ khai chuẩn nộp lên Cổng Thuedientu.
            </p>
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-xs text-emerald-400">
              <div className="text-slate-500 text-[10px]"># Lệnh thực thi:</div>
              mekong ke-toan tt78 --quy 4
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li>✓ Đối soát 100% khớp XML hóa đơn TT78</li>
              <li>✓ Tính thuế TNDN, GTGT chính xác tuyệt đối</li>
              <li>✓ Cổng phê duyệt bảo mật SHA-256 an toàn</li>
            </ul>
          </div>

          {/* Phễu 3: Sophia AI Video & CMO */}
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎬</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                Video AI &amp; CMO
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Sản Xuất Video AI &amp; Tiếp Thị Đa Kênh</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tự động hóa toàn diện từ viết kịch bản video AI đại diện (Sophia Avatar), xuất bản lên TikTok / Reels
              đến vận hành cỗ máy CMO 4 mũi giáp công săn lead B2B cho doanh nghiệp.
            </p>
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-xs text-purple-300">
              <div className="text-slate-500 text-[10px]"># Lệnh thực thi:</div>
              mekong marketing cmo-run
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              <li>✓ Tạo video người ảo avatar phát biểu tự động</li>
              <li>✓ Chấp bút nội dung song ngữ Việt - Anh</li>
              <li>✓ Hợp đồng bằng chứng SOP 14 trường dữ liệu</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
