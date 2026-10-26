import TemplateCard, { Template } from '@/components/template-card';

const templates: Template[] = [
  {
    name: 'Client Proposal & Follow-Up',
    category: 'opc-pack/v1',
    price: 199,
    icon: '📜',
    desc: 'Intake đa tiền tệ (USD/VND/EUR), báo giá tự động, SHA-256 Approval Gate và chuỗi Follow-up 3 bước.',
    plan: 'basic',
    cliCommand: 'mekong opc run client-proposal-followup --currency VND',
    deliverable: 'Báo giá PDF + SHA-256 Digest + Chuỗi 3 email/Zalo',
  },
  {
    name: 'FnB Cloud Kitchen Sovereign',
    category: 'F&B Pack',
    price: 399,
    icon: '🍜',
    desc: 'Ghost kitchen + delivery ops với đồng bộ thực đơn, tồn kho, hóa đơn TT78 & VietQR Napas 247.',
    plan: 'premium',
    cliCommand: 'mekong opc run fnb-cloud-kitchen --sync-vietqr',
    deliverable: 'Sổ cái tồn kho SQLite + Mã QR động + Hóa đơn TT78',
  },
  {
    name: 'Dropship & Cross-Border Hub',
    category: 'E-commerce Pack',
    price: 199,
    icon: '📦',
    desc: 'Quản lý danh mục đa kênh, đối soát biên lợi nhuận Honest Usage Ledger và vận đơn tự động.',
    plan: 'basic',
    cliCommand: 'mekong opc run ecommerce-crossborder --reconcile',
    deliverable: 'Báo cáo biên lợi nhuận ròng + Trạng thái vận đơn',
  },
  {
    name: 'SaaS Sovereign Launchpad',
    category: 'SaaS Pack',
    price: 399,
    icon: '🚀',
    desc: 'Dual-Rail Checkout (VietQR + NOWPayments), MEKONG-RAAS-v1 verifier & MCU metering tự động.',
    plan: 'premium',
    cliCommand: 'mekong opc run saas-launchpad --dual-rail',
    deliverable: 'Cổng thanh toán VietQR/USDT + License Key HMAC',
  },
  {
    name: 'Solo Agency OS',
    category: 'Agency Pack',
    price: 799,
    icon: '🤝',
    desc: 'Quản trị hợp đồng B2B, phê duyệt mật mã SHA-256, multi-workspace isolation & thu phí retainer.',
    plan: 'enterprise',
    cliCommand: 'mekong opc run solo-agency-os --workspace client-a',
    deliverable: 'Hợp đồng dịch vụ VN + Cổng duyệt SHA-256 + Retainer',
  },
  {
    name: 'Technical Freelancer Stack',
    category: 'Freelance Pack',
    price: 199,
    icon: '💼',
    desc: '100% Offline-Capable runtime, dự toán giờ công, kiểm soát chi phí thực tế vs dự kiến và tính thuế TNCN.',
    plan: 'basic',
    cliCommand: 'mekong opc run freelancer-stack --calc-tncn',
    deliverable: 'Bảng chấm công + Tờ khai thuế TNCN + Link thanh toán',
  },
];

export default function TemplatesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center px-4">
        <div className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          Declarative Manifests · opc-pack/v1
        </div>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          OPC Business Packs Registry
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-400">
          Mỗi Business Pack là một quy trình nghiệp vụ đóng gói sẵn, kích hoạt trực tiếp bằng 1 câu lệnh{' '}
          <code className="text-emerald-400 font-mono">mekong opc run</code> kèm cổng phê duyệt SHA-256.
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard key={t.name} template={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
