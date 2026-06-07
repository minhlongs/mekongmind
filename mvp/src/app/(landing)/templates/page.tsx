import TemplateCard from '@/components/template-card';

const templates = [
  {
    name: 'FnB Cloud Kitchen',
    category: 'F&B',
    price: 149,
    icon: '🍜',
    desc: 'Ghost kitchen + delivery ops với auto-sync menu & inventory.',
    plan: 'growth',
  },
  {
    name: 'Dropship Hub',
    category: 'E-commerce',
    price: 99,
    icon: '📦',
    desc: 'Multi-channel listing, order auto-fulfillment, margin tracking.',
    plan: 'starter',
  },
  {
    name: 'SaaS Launchpad',
    category: 'SaaS',
    price: 299,
    icon: '🚀',
    desc: 'Landing page, Polar checkout, trial flow, cohort analytics.',
    plan: 'premium',
  },
  {
    name: 'Agency OS',
    category: 'Agency',
    price: 249,
    icon: '🤝',
    desc: 'Client CRM, proposal generator, retainer invoicing, reporting.',
    plan: 'growth',
  },
  {
    name: 'Creator Economy',
    category: 'Creator',
    price: 79,
    icon: '🎬',
    desc: 'Patreon-style tiers, content calendar, audience analytics.',
    plan: 'starter',
  },
  {
    name: 'Freelance Stack',
    category: 'Freelance',
    price: 49,
    icon: '💼',
    desc: 'Proposal templates, contract e-sign, time tracking, invoicing.',
    plan: 'starter',
  },
];

export default function TemplatesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          RaaS Templates
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Mỗi template là một Solo Company đã được chứng minh — deploy trong
          vài phút, start earning trong vài giờ.
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
