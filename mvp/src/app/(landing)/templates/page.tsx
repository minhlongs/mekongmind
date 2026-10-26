import TemplateCard from '@/components/template-card';

const templates = [
  {
    name: 'Client Proposal & Follow-Up',
    category: 'opc-pack/v1',
    price: 199,
    icon: '📜',
    desc: 'Intake đa tiền tệ (USD/VND/EUR), báo giá tự động, SHA-256 Approval Gate và chuỗi Follow-up.',
    plan: 'basic',
  },
  {
    name: 'FnB Cloud Kitchen Sovereign',
    category: 'F&B Pack',
    price: 399,
    icon: '🍜',
    desc: 'Ghost kitchen + delivery ops với đồng bộ thực đơn, tồn kho & VietQR Napas 247.',
    plan: 'premium',
  },
  {
    name: 'Dropship & Cross-Border Hub',
    category: 'E-commerce Pack',
    price: 199,
    icon: '📦',
    desc: 'Quản lý danh mục đa kênh, đối soát biên lợi nhuận Honest Usage Ledger.',
    plan: 'basic',
  },
  {
    name: 'SaaS Sovereign Launchpad',
    category: 'SaaS Pack',
    price: 399,
    icon: '🚀',
    desc: 'Dual-Rail Checkout (VietQR + NOWPayments), MEKONG-RAAS-v1 verifier & MCU metering.',
    plan: 'premium',
  },
  {
    name: 'Solo Agency OS',
    category: 'Agency Pack',
    price: 799,
    icon: '🤝',
    desc: 'Quản trị hợp đồng, phê duyệt mật mã SHA-256, multi-workspace isolation & retainer.',
    plan: 'enterprise',
  },
  {
    name: 'Technical Freelancer Stack',
    category: 'Freelance Pack',
    price: 199,
    icon: '💼',
    desc: '100% Offline-Capable runtime, dự toán giờ công, kiểm soát chi phí thực tế vs dự kiến.',
    plan: 'basic',
  },
];

export default function TemplatesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-3">
          Declarative Manifests · opc-pack/v1
        </div>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          OPC Business Packs Registry
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Mỗi Business Pack là một định nghĩa tĩnh an toàn (pure data manifest), tích hợp sẵn SHA-256 Approval Gate và Honest Usage Ledger.
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
