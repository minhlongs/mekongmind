'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CommandItem {
  name: string;
  category: 'csuite' | 'accounting' | 'zalo' | 'marketing' | 'legal' | 'devops';
  syntax: string;
  plainDesc: string;
  sampleOutput: string;
}

const COMMAND_CATEGORIES = [
  { key: 'all', label: 'Tất cả lệnh (39+)' },
  { key: 'csuite', label: 'Ban Giám Đốc AI (C-Suite)' },
  { key: 'accounting', label: 'Thuế & Kế Toán VN (TT78)' },
  { key: 'zalo', label: 'Zalo OA & Khách Hàng' },
  { key: 'marketing', label: 'Tiếp Thị & CMO Swarm' },
  { key: 'legal', label: 'Pháp Lý & Hợp Đồng VN' },
  { key: 'devops', label: 'Hạ Tầng & Vận Hành' },
];

const COMMAND_LIST: CommandItem[] = [
  // C-Suite
  {
    name: 'mekong cfo',
    category: 'csuite',
    syntax: 'mekong cfo budget [--thang MM] [--nam YYYY]',
    plainDesc: 'Giám đốc Tài chính AI: Lập ngân sách, phân tích điểm hòa vốn, đối soát Napas 247/USDT.',
    sampleOutput: '{"projected_arr": "$124,500", "net_margin": "88.5%", "status": "HEALTHY"}',
  },
  {
    name: 'mekong cmo',
    category: 'csuite',
    syntax: 'mekong cmo {campaign|outreach|launch|growth}',
    plainDesc: 'Giám đốc Tiếp thị AI: Điều hành chiến dịch truyền thông đa kênh, SEO và săn lead B2B.',
    sampleOutput: '{"campaign_asset": "Ready", "seo_blueprint": "Score 95", "leads": 12}',
  },
  {
    name: 'mekong cso',
    category: 'csuite',
    syntax: 'mekong cso pipeline [--target enterprise]',
    plainDesc: 'Giám đốc Bán hàng & Chiến lược AI: Quản trị phễu khách hàng lớn, đàm phán hợp đồng giá trị cao.',
    sampleOutput: '{"pipeline_value": "450M VND", "active_deals": 8, "win_rate": "65%"}',
  },
  {
    name: 'mekong cto',
    category: 'csuite',
    syntax: 'mekong cto health [--check-gate]',
    plainDesc: 'Giám đốc Kỹ thuật AI: Giám sát toàn vẹn SQLite WAL, cổng mật mã SHA-256 và bảo mật.',
    sampleOutput: '{"health": "100%", "gate": "SHA-256 Active", "open_core": "25/25 READY"}',
  },

  // Thuế & Kế Toán VN
  {
    name: 'mekong ke-toan',
    category: 'accounting',
    syntax: 'mekong ke-toan tt78 [--quy 1-4] [--doi-soat-xml]',
    plainDesc: 'Tự động quét hóa đơn điện tử XML, đối soát thuế GTGT/TNDN theo Thông tư 78/2021/TT-BTC.',
    sampleOutput: '{"invoices_scanned": 142, "vat_payable": "29.3M VND", "gate": "PENDING_APPROVAL"}',
  },
  {
    name: 'mekong thue',
    category: 'accounting',
    syntax: 'mekong thue tncn [--thang MM] [--xuat-to-khai]',
    plainDesc: 'Tính toán thuế Thu nhập cá nhân (TNCN) cho nhân sự và chuyên gia theo quy định hiện hành.',
    sampleOutput: '{"taxpayers": 5, "total_tncn": "8.4M VND", "export_file": "TK_TNCN_Q4.xml"}',
  },
  {
    name: 'mekong bhxh',
    category: 'accounting',
    syntax: 'mekong bhxh tinh-toan [--muc-luong-co-so]',
    plainDesc: 'Tính tỷ lệ đóng BHXH, BHYT, BHTN theo mức lương cơ sở mới nhất của Nhà nước.',
    sampleOutput: '{"bhxh_employee": "10.5%", "bhxh_company": "21.5%", "total": "12.8M VND"}',
  },
  {
    name: 'mekong vietqr',
    category: 'accounting',
    syntax: 'mekong vietqr generate --amount <VND> --order-id <ID>',
    plainDesc: 'Tạo mã VietQR Napas 247 động chuẩn EMVCo, nhận tiền vào tài khoản ngân hàng ngay lập tức.',
    sampleOutput: '{"qr_code_data": "000201010212...", "payment_url": "https://img.vietqr.io/..."}',
  },

  // Zalo OA & CRM
  {
    name: 'mekong zalo-oa broadcast',
    category: 'zalo',
    syntax: 'mekong zalo-oa broadcast --template <TPL> --target <TAG>',
    plainDesc: 'Gửi tin nhắn thông báo chăm sóc khách hàng hàng loạt qua Zalo OA chính thức được duyệt.',
    sampleOutput: '{"sent": 86, "opened": "94.2%", "responses": 28, "status": "COMPLETED"}',
  },
  {
    name: 'mekong zalo-oa chatbot',
    category: 'zalo',
    syntax: 'mekong zalo-oa chatbot --auto-reply --faq-file <PATH>',
    plainDesc: 'Bật trợ lý AI tự động trả lời tư vấn dịch vụ và giải đáp thắc mắc của khách qua Zalo.',
    sampleOutput: '{"bot_status": "ONLINE", "avg_response_time": "1.2s", "satisfaction": "98%"}',
  },
  {
    name: 'mekong crm lead',
    category: 'zalo',
    syntax: 'mekong crm lead list [--filter hot]',
    plainDesc: 'Quản lý danh sách khách hàng tiềm năng, lưu trữ lịch sử tương tác hoàn toàn cục bộ.',
    sampleOutput: '{"total_leads": 128, "hot_leads": 24, "database": "SQLite WAL (.mekong/crm.db)"}',
  },

  // Marketing & CMO Swarm
  {
    name: 'mekong marketing cmo-run',
    category: 'marketing',
    syntax: 'mekong marketing cmo-run <BRIEF> [--channel zalo|linkedin|blog|social]',
    plainDesc: 'Chạy toàn bộ quy trình CMO Swarm 4 mũi: Nội dung, SEO, Săn Lead SDR và Hợp đồng SOP.',
    sampleOutput: '{"brief": "OPC Launch", "leads": 12, "sop_artifact": "repeatable-channel.json"}',
  },
  {
    name: 'mekong marketing outreach',
    category: 'marketing',
    syntax: 'mekong marketing outreach <TARGET> [--count N]',
    plainDesc: 'Săn tìm danh sách khách hàng B2B tiềm năng, chấm điểm độ phù hợp ICP và tạo chuỗi email 3 bước.',
    sampleOutput: '{"prospects": 10, "qualified": 4, "handoff": "sales-revenue"}',
  },
  {
    name: 'mekong marketing seo',
    category: 'marketing',
    syntax: 'mekong marketing seo <KEYWORD> [--domain <DOMAIN>]',
    plainDesc: 'Phân tích từ khóa tìm kiếm, kiểm toán cấu trúc thẻ Heading và phát hiện lỗ hổng nội dung.',
    sampleOutput: '{"keyword": "mekong cli", "domain": "mekongmind.com", "gap_topics": 5}',
  },
  {
    name: 'mekong marketing growth',
    category: 'marketing',
    syntax: 'mekong marketing growth <HYPOTHESIS> [--metric <M>]',
    plainDesc: 'Thiết kế thử nghiệm tăng trưởng A/B và tính toán cỡ mẫu cần thiết để kiểm chứng giả thuyết.',
    sampleOutput: '{"metric": "Conversion Rate", "sample_size": 1200, "duration": "14 days"}',
  },

  // Pháp Lý & Hợp Đồng VN
  {
    name: 'mekong legal contract',
    category: 'legal',
    syntax: 'mekong legal contract generate --type service-agreement --client <NAME>',
    plainDesc: 'Tự động soạn thảo hợp đồng dịch vụ chuẩn Bộ Luật Dân Sự Việt Nam và Luật Thương Mại.',
    sampleOutput: '{"contract_id": "HD_2026_091", "template": "Dịch vụ B2B", "status": "DRAFTED"}',
  },
  {
    name: 'mekong legal nd91',
    category: 'legal',
    syntax: 'mekong legal nd91 check --campaign <ID>',
    plainDesc: 'Kiểm tra tính tuân thủ Nghị định 91/2020/NĐ-CP về chống tin nhắn rác và cơ chế từ chối (Opt-out).',
    sampleOutput: '{"opt_out_link": "PRESENT", "sender_id": "REGISTERED", "compliance": "100%"}',
  },

  // Hạ Tầng & Vận Hành
  {
    name: 'mekong init',
    category: 'devops',
    syntax: 'mekong init [--name <NAME>] [--tier basic|premium|enterprise]',
    plainDesc: 'Khởi tạo không gian làm việc doanh nghiệp mới với SQLite WAL và thiết lập 25 bước sẵn sàng.',
    sampleOutput: '{"initialized": true, "database": ".mekong/company.db", "runtime": "Offline-Ready"}',
  },
  {
    name: 'mekong opc run',
    category: 'devops',
    syntax: 'mekong opc run <PACK_NAME> [--input <DATA>]',
    plainDesc: 'Thực thi một gói Business Pack khai báo (declarative manifest) có cổng phê duyệt SHA-256.',
    sampleOutput: '{"pack": "client-proposal", "sha_digest": "a8f941...", "status": "APPROVED"}',
  },
  {
    name: 'mekong status',
    category: 'devops',
    syntax: 'mekong status [--json]',
    plainDesc: 'Kiểm tra sức khỏe tổng thể hệ thống, trạng thái các cổng thanh toán và số dư MCU tín dụng.',
    sampleOutput: '{"mcu_balance": 1500, "dual_rail": "ACTIVE", "sqlite": "WAL_OK"}',
  },
];

export default function CliDictionaryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredCommands = COMMAND_LIST.filter((cmd) => {
    const matchCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const matchSearch =
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.plainDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0b0f17] to-cyan-500/10 p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider border border-emerald-500/40">
          ● Mekong CLI Reference · 39+ Nhóm Lệnh Thực Tế
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Từ Điển &amp; Cẩm Nang Lệnh Mekong CLI
        </h1>
        <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
          Tra cứu nhanh cú pháp, công dụng bằng tiếng Việt bình dân và mẫu dữ liệu trả về cho mọi câu lệnh
          trong bộ công cụ Mekong CLI v6.0.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto pt-4">
          <input
            type="text"
            placeholder="Tìm kiếm lệnh (ví dụ: cfo, tt78, zalo, cmo, init)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-[#06080d] px-5 py-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none shadow-lg"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {COMMAND_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                active
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-[#0b0f17] text-slate-400 border border-white/10 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Command Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCommands.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Không tìm thấy lệnh nào khớp với từ khóa &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.name + idx}
              className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4 hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold font-mono text-emerald-400">{cmd.name}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(cmd.syntax, idx)}
                    className="text-[11px] font-mono text-slate-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-white/5 border border-white/10 transition-colors"
                  >
                    {copiedIndex === idx ? '✓ Đã sao chép' : 'Sao chép cú pháp'}
                  </button>
                </div>

                <div className="rounded-xl bg-[#06080d] border border-white/10 p-3 font-mono text-xs text-slate-200 break-all">
                  <span className="text-slate-500 select-none">$ </span>
                  {cmd.syntax}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{cmd.plainDesc}</p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">Mẫu dữ liệu trả về:</div>
                <pre className="text-[11px] font-mono text-cyan-300 bg-black/40 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
                  {cmd.sampleOutput}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#0b0f17] p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Sẵn Sàng Trải Nghiệm Mekong CLI?</h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Cài đặt ngay hôm nay để tự động hóa trọn gói nghiệp vụ doanh nghiệp của bạn với chi phí tiết kiệm &gt;85%.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            href="/#pricing"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Nhận Bản Quyền Dual-Rail
          </Link>
          <Link
            href="/templates"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Khám Phá Gói Nghiệp Vụ (Packs)
          </Link>
        </div>
      </div>
    </div>
  );
}
