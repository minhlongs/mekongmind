'use client';

import Link from 'next/link';

interface Template {
  name: string;
  category: string;
  price: number;
  icon: string;
  desc: string;
  plan: string;
}

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="group rounded-xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-emerald-500/50">
      <div className="text-4xl mb-4">{template.icon}</div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
        <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
          {template.category}
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-400">{template.desc}</p>

      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-emerald-400">
          ${template.price}
        </span>
        <Link
          href={`/checkout/${template.plan}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
        >
          Mua ngay
        </Link>
      </div>
    </div>
  );
}
