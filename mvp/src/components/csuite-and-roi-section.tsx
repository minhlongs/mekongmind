'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CSuiteDirector {
  id: string;
  role: string;
  title: string;
  name: string;
  avatarIcon: string;
  replacedRoles: string;
  cliCommand: string;
  duties: string[];
  sampleOutput: string;
}

const CSUITE_DIRECTORS: CSuiteDirector[] = [
  {
    id: 'cfo',
    role: '/cfo',
    title: 'Giám Đốc Tài Chính AI',
    name: 'CFO Sophia',
    avatarIcon: '💰',
    replacedRoles: 'Kế toán trưởng + Chuyên viên dự toán tài chính',
    cliCommand: 'mekong cfo budget --thang 11 --nam 2026',
    duties: [
      'Dự toán dòng tiền, chi phí burn rate và điểm hòa vốn',
      'Đối soát doanh thu Dual-Rail Napas 247 và USDT Crypto',
      'Định giá dịch vụ và kiểm soát tỷ suất lợi nhuận ròng >80%',
      'Cảnh báo sớm rủi ro công nợ và quá hạn thanh toán',
    ],
    sampleOutput: `{
  "month": "11/2026",
  "projected_arr": "$124,500",
  "net_margin": "88.5%",
  "burn_rate_daily": "$12.20",
  "runway_months": "Không giới hạn (Có lãi ngay)",
  "status": "HEALTHY"
}`,
  },
  {
    id: 'cmo',
    role: '/cmo',
    title: 'Giám Đốc Tiếp Thị AI',
    name: 'CMO Minh Trí',
    avatarIcon: '📢',
    replacedRoles: 'Trưởng phòng Marketing + Copywriter + SEO Lead',
    cliCommand: 'mekong marketing cmo-run "Tăng trưởng OPC" --channel zalo',
    duties: [
      'Chấp bút nội dung tiếp thị song ngữ VN/EN chuẩn thương hiệu',
      'Phân tích lỗ hổng SEO và đề xuất cấu trúc bài viết đạt top',
      'Săn và chấm điểm khách hàng tiềm năng B2B (ICP >= 70%)',
      'Đóng cổng bằng chứng SOP repeatable-channel.json',
    ],
    sampleOutput: `{
  "campaign": "Tăng trưởng One-Person Company",
  "channel": "Zalo OA & Doanh Nghiệp VN",
  "qualified_leads": 12,
  "blended_cpa": "$15.50",
  "sop_gate": "14/14 trường đạt chuẩn"
}`,
  },
  {
    id: 'cso',
    role: '/cso',
    title: 'Giám Đốc Bán Hàng & Chiến Lược AI',
    name: 'CSO Tấn Phát',
    avatarIcon: '🎯',
    replacedRoles: 'Trưởng phòng Kinh doanh + Account Executive Lead',
    cliCommand: 'mekong cso pipeline --target enterprise --doi-soat-chot-don',
    duties: [
      'Thiết kế phễu chốt hợp đồng và soạn thảo đề xuất dịch vụ',
      'Tự động gửi email/Zalo follow-up 3 bước định kỳ không bỏ sót',
      'Theo dõi trạng thái đàm phán hợp đồng giá trị cao',
      'Phân loại khách hàng và đề xuất mức chiết khấu thông minh',
    ],
    sampleOutput: `{
  "pipeline_value": "450,000,000 VND",
  "deals_active": 8,
  "win_rate_projected": "65%",
  "recommended_action": "Gửi hợp đồng điện tử có chữ ký SHA-256"
}`,
  },
  {
    id: 'cto',
    role: '/cto',
    title: 'Giám Đốc Kỹ Thuật & Bảo Mật AI',
    name: 'CTO Quang Minh',
    avatarIcon: '🛡️',
    replacedRoles: 'Kỹ sư trưởng + DevOps + Quản trị hệ thống',
    cliCommand: 'mekong cto health --check-gate --sqlite-wal',
    duties: [
      'Kiểm soát toàn vẹn cơ sở dữ liệu SQLite WAL và mã hóa dữ liệu',
      'Giám sát cổng phê duyệt mật mã SHA-256 ngăn ngừa tấn công replay',
      'Tự động sao lưu và bảo vệ mã nguồn, hạ tầng vận hành',
      'Đảm bảo thời gian hoạt động 99.99% và không có vendor lock-in',
    ],
    sampleOutput: `{
  "system_health": "100%",
  "security_digest": "SHA-256 HMAC Active",
  "sqlite_wal_integrity": "OK",
  "open_core_compliance": "25/25 READY"
}`,
  },
];

export default function CSuiteAndRoiSection() {
  const [activeDirectorId, setActiveDirectorId] = useState<string>('cfo');
  const [salariesSaved, setSalariesSaved] = useState<number>(75); // Triệu VNĐ mỗi tháng

  const director = CSUITE_DIRECTORS.find((d) => d.id === activeDirectorId) || CSUITE_DIRECTORS[0];

  // Tính toán kinh tế
  const traditionalCostYear = salariesSaved * 12; // Triệu VND
  const mekongCliCostYear = 5; // ~5 triệu VND (gói Basic 4,975,000)
  const netSavedYear = traditionalCostYear - mekongCliCostYear;
  const roiPercent = Math.round((netSavedYear / mekongCliCostYear) * 100);

  return (
    <div className="space-y-24 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* TẦNG 4: 4 GIÁM ĐỐC C-SUITE AI 24/7 (Binh Pháp 13 Chương)                   */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
            ● Ban Giám Đốc C-Suite AI 24/7
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            1 Solo Founder — Sở Hữu Cả Dàn Giám Đốc AI Cao Cấp
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bạn không phải làm việc một mình. Dàn 4 Giám đốc AI hoạt động liên tục 24/7 theo phương pháp
            Binh Pháp Quản Trị, nhận lệnh tức thì qua Mekong CLI và báo cáo trung thực lên Web.
          </p>
        </div>

        {/* Director Switcher Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CSUITE_DIRECTORS.map((d) => {
            const active = d.id === activeDirectorId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDirectorId(d.id)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-xl shadow-emerald-500/10'
                    : 'border-white/10 bg-[#0b0f17] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{d.avatarIcon}</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {d.role}
                  </span>
                </div>
                <div className="text-base font-bold text-white">{d.title}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{d.name}</div>
              </button>
            );
          })}
        </div>

        {/* Director Detail Cockpit */}
        <div className="rounded-2xl border border-white/15 bg-[#07090e] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-2xl">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{director.avatarIcon}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{director.title}</h3>
                <p className="text-xs text-emerald-400 font-mono">
                  Thay thế: {director.replacedRoles}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-xs">
              <div className="text-slate-500 text-[10px]"># Lệnh gọi Giám đốc trực tiếp trên Terminal:</div>
              <div className="text-emerald-400 font-bold mt-1">$ {director.cliCommand}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-slate-400">Các nhiệm vụ tự động đảm nhiệm:</div>
              <ul className="space-y-2 text-xs text-slate-200">
                {director.duties.map((duty, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{duty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#05070c] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-[11px] font-mono uppercase text-slate-400">
                  Dữ Liệu Đầu Ra (Live Output JSON)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Structured
                </span>
              </div>
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {director.sampleOutput}
              </pre>
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">Sẵn sàng vận hành 24/7</span>
              <Link href="#pricing" className="text-emerald-400 font-bold hover:underline">
                Kích hoạt ngay →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TẦNG 5: BẢNG ĐỐI CHIẾU TRƯỚC / SAU & TÍNH TOÁN ROI                         */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
            ● Bài Toán Kinh Tế &amp; ROI
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            So Sánh Hiệu Quả: Mô Hình Truyền Thống vs. Mekong CLI
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Xem rõ số tiền và thời gian thực tế mà bạn tiết kiệm được khi chuyển đổi từ bộ máy cồng kềnh
            sang mô hình One-Person Company điều hành bằng Mekong CLI.
          </p>
        </div>

        {/* Before vs After Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#0b0f17] shadow-2xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#07090e] font-mono uppercase text-slate-400">
                <th className="py-4 px-6">Hạng mục so sánh</th>
                <th className="py-4 px-6 text-red-300 bg-red-950/20">Doanh nghiệp truyền thống</th>
                <th className="py-4 px-6 text-emerald-300 bg-emerald-950/20">Vận hành bằng Mekong CLI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr className="hover:bg-white/5">
                <td className="py-4 px-6 font-semibold text-white">Đội ngũ nhân sự tối thiểu</td>
                <td className="py-4 px-6 text-slate-400">
                  5 nhân sự (Kế toán, Marketing, Sales, IT, CSKH)
                </td>
                <td className="py-4 px-6 font-bold text-emerald-400">
                  1 Solo Founder + Dàn 4 Giám đốc AI
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-4 px-6 font-semibold text-white">Chi phí lương nhân sự/tháng</td>
                <td className="py-4 px-6 text-red-400 font-mono font-bold">
                  ~60,000,000 – 90,000,000 VND / tháng
                </td>
                <td className="py-4 px-6 text-emerald-400 font-mono font-bold">
                  0 VND (Chỉ trả gói bản quyền phần mềm)
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-4 px-6 font-semibold text-white">Công cụ phần mềm rời rạc</td>
                <td className="py-4 px-6 text-slate-400">
                  8-12 SaaS (Kế toán, CRM, Email, Chatbot, PM) ~15M/tháng
                </td>
                <td className="py-4 px-6 text-emerald-400 font-medium">
                  Tích hợp đồng bộ trong 1 CLI + Cockpit duy nhất
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-4 px-6 font-semibold text-white">Thời gian hoàn thành tác vụ</td>
                <td className="py-4 px-6 text-slate-400">
                  3 – 7 ngày làm việc (chờ họp và bàn giao qua lại)
                </td>
                <td className="py-4 px-6 text-cyan-300 font-mono font-bold">
                  10 – 30 giây với 1 câu lệnh duy nhất
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-4 px-6 font-semibold text-white">Độ an toàn &amp; Bảo mật dữ liệu</td>
                <td className="py-4 px-6 text-slate-400">
                  Dữ liệu phân tán trên nhiều bên thứ ba, nguy cơ rò rỉ
                </td>
                <td className="py-4 px-6 text-emerald-400 font-mono">
                  100% Cục bộ SQLite WAL + Duyệt mã SHA-256
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Interactive ROI Calculator Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0b0f17] to-cyan-500/10 p-6 sm:p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
                ● Công Cụ Tính ROI Thực Tế
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                Dự Toán Khoản Tiết Kiệm Hàng Năm Của Bạn
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kéo thanh trượt để điều chỉnh mức chi phí nhân sự &amp; phần mềm dự kiến mà doanh nghiệp bạn
                đang chi trả mỗi tháng:
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Chi phí truyền thống hiện tại:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {salariesSaved.toLocaleString('vi-VN')} triệu VNĐ / tháng
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={salariesSaved}
                  onChange={(e) => setSalariesSaved(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>20 triệu/tháng</span>
                  <span>100 triệu/tháng</span>
                  <span>200 triệu/tháng</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-[#06080e] border border-white/10 p-6 space-y-4 text-center">
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Số tiền tiết kiệm được mỗi năm
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1 font-mono">
                  {netSavedYear.toLocaleString('vi-VN')} triệu VNĐ
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-around text-xs font-mono">
                <div>
                  <div className="text-slate-500 text-[10px]">Tỷ suất ROI</div>
                  <div className="text-cyan-400 font-bold text-base">+{roiPercent.toLocaleString()}%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Thời gian thu hồi</div>
                  <div className="text-emerald-400 font-bold text-base">&lt; 3 ngày</div>
                </div>
              </div>

              <Link
                href="#pricing"
                className="w-full block rounded-xl bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                Nhận Bản Quyền Mekong CLI Ngay →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
