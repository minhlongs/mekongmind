'use client';

import Link from 'next/link';
import { POLAR_PRODUCTS } from '@/lib/polar-config';

const tiers = [
  { id: 'starter' as const, badge: null },
  { id: 'growth' as const, badge: 'POPULAR' },
  { id: 'premium' as const, badge: null },
  { id: 'master' as const, badge: 'ENTERPRISE' },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-400">
            Solo Company OS — từ startup đến enterprise. Credits reset mỗi tháng.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map(({ id, badge }) => {
            const product = POLAR_PRODUCTS[id];
            return (
              <div
                key={id}
                className={`relative rounded-2xl border p-8 ${
                  badge === 'POPULAR'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${
                      badge === 'POPULAR'
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {badge}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{product.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">${product.price}</span>
                  <span className="text-slate-400">/mo</span>
                </div>

                <Link
                  href={`/checkout/${id}`}
                  className={`mt-8 block w-full rounded-lg px-4 py-3 text-center font-semibold transition-colors ${
                    badge === 'POPULAR'
                      ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                      : 'border border-slate-700 text-white hover:bg-slate-800'
                  }`}
                >
                  Get started
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          All plans include 22 operational modules, 385 workflow templates, and community support.
          <br />
          Master tier: white-label deployment, dedicated infrastructure, 24/7 priority support.
        </p>
      </div>
    </section>
  );
}
