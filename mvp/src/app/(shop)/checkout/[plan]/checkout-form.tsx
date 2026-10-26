'use client';

import { useState } from 'react';
import type { RaasTierConfig } from '@/lib/raas-config';

interface CheckoutFormProps {
  tier: RaasTierConfig;
}

export default function CheckoutForm({ tier }: CheckoutFormProps) {
  const [rail, setRail] = useState<'vietqr' | 'nowpayments'>('vietqr');
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const qs = new URLSearchParams({
          tier: tier.id,
          rail,
          email,
        });
        window.location.href = `/checkout/success?${qs.toString()}`;
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
          Chọn cổng thanh toán Dual-Rail
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRail('vietqr')}
            className={`rounded-xl border p-4 text-left transition-all ${
              rail === 'vietqr'
                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                : 'border-white/10 bg-[#06080d] text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-sm font-bold">VietQR Napas 247</div>
            <div className="text-xs text-slate-400 mt-1">
              {tier.priceVnd.toLocaleString('vi-VN')} VND · Tức thì
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRail('nowpayments')}
            className={`rounded-xl border p-4 text-left transition-all ${
              rail === 'nowpayments'
                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                : 'border-white/10 bg-[#06080d] text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-sm font-bold">NOWPayments Crypto</div>
            <div className="text-xs text-slate-400 mt-1">
              ${tier.priceUsd.toLocaleString()} USDT · IPN Quốc tế
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
          Email nhận khóa MEKONG-RAAS-v1
        </label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="founder@company.com"
          className="w-full rounded-xl border border-white/10 bg-[#06080d] px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-slate-950 transition-colors hover:bg-emerald-400"
      >
        {rail === 'vietqr'
          ? `Thanh toán ${tier.priceVnd.toLocaleString('vi-VN')} VND qua VietQR`
          : `Thanh toán $${tier.priceUsd.toLocaleString()} USDT qua NOWPayments`}
      </button>
    </form>
  );
}
