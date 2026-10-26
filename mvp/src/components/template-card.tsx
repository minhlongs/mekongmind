'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface Template {
  name: string;
  category: string;
  price: number;
  icon: string;
  desc: string;
  plan: string;
  cliCommand?: string;
  deliverable?: string;
}

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const command = template.cliCommand || `mekong opc run ${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-[#0b0f17] p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between space-y-4">
      <div>
        <div className="text-4xl mb-4">{template.icon}</div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{template.name}</h3>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">
            {template.category}
          </span>
        </div>

        <p className="mb-4 text-xs text-slate-400 leading-relaxed">{template.desc}</p>

        {/* CLI Command Box */}
        <div className="rounded-xl bg-[#06080d] border border-white/10 p-3 space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
            <span>Lệnh Kích Hoạt CLI</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-400 hover:text-emerald-300"
            >
              {copied ? '✓ Đã chép' : 'Chép lệnh'}
            </button>
          </div>
          <div className="text-emerald-400 break-all">
            <span className="text-slate-500 select-none">$ </span>
            {command}
          </div>
        </div>

        {template.deliverable && (
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-cyan-400 font-mono">Đầu ra:</span>
            <span>{template.deliverable}</span>
          </div>
        )}
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
