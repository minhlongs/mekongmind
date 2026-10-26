'use client';

import Link from 'next/link';
import { COMMERCIAL_TIERS, TIER_IDS } from '@/lib/raas-config';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Dual-Rail RaaS · VietQR Napas 247 & NOWPayments
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            OPC 2027 Sovereign Tiers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            1 MCU = 1 Credit thực thi. Cấp phát tức thì qua khóa mật mã{' '}
            <code className="text-emerald-300">MEKONG-RAAS-v1</code> HMAC-SHA256.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {TIER_IDS.map((id) => {
            const tier = COMMERCIAL_TIERS[id];
            const isPopular = tier.badge === 'POPULAR';
            return (
              <div
                key={id}
                className={`relative flex flex-col justify-between rounded-2xl border p-8 transition-all ${
                  isPopular
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-xl shadow-emerald-500/10'
                    : 'border-white/10 bg-[#0b0f17]/90 hover:border-slate-700'
                }`}
              >
                <div>
                  {tier.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide ${
                        isPopular
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="mt-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">
                        ${tier.priceUsd.toLocaleString()}
                      </span>
                      <span className="text-sm text-slate-400">/ chu kỳ</span>
                    </div>
                    <div className="mt-1 text-xs font-mono text-emerald-400">
                      ≈ {tier.priceVnd.toLocaleString('vi-VN')} VND · {tier.mcuCredits.toLocaleString()} MCU
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/checkout/${id}`}
                  className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${
                    isPopular
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'border border-slate-700 bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Kích hoạt {tier.name}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-slate-500 font-mono">
          Dual-Rail Settlement: VietQR (Napas 247 Instant Bank Transfer) & NOWPayments (USDT / Crypto IPN).
          <br />
          Open-Core MIT Core Runtime · 25/25 Readiness Verified · Zero Vendor Lock-in.
        </p>
      </div>
    </section>
  );
}
