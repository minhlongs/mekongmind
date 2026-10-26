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
    <div className="group rounded-2xl border border-white/10 bg-[#0b0f17] p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between">
      <div>
        <div className="text-4xl mb-4">{template.icon}</div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{template.name}</h3>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">
            {template.category}
          </span>
        </div>

        <p className="mb-4 text-xs text-slate-400 leading-relaxed">{template.desc}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div>
          <span className="text-xl font-extrabold text-emerald-400">
            ${template.price}
          </span>
          <span className="text-xs text-slate-500"> / gói</span>
        </div>
        <Link
          href={`/checkout/${template.plan}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
        >
          Kích hoạt Pack
        </Link>
      </div>
    </div>
  );
}
