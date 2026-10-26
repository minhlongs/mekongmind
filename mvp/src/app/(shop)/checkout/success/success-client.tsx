'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { COMMERCIAL_TIERS, type TierId } from '@/lib/raas-config';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const tierId = (searchParams.get('tier') || 'premium') as TierId;
  const rail = searchParams.get('rail') || 'vietqr';
  const tier = COMMERCIAL_TIERS[tierId] || COMMERCIAL_TIERS.premium;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080d]">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0b0f17] p-8 shadow-2xl">
          <div className="text-5xl mb-4">✅</div>
          <div className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400 uppercase mb-3">
            Dual-Rail · {rail === 'vietqr' ? 'VietQR Napas 247' : 'NOWPayments Crypto IPN'}
          </div>
          <h1 className="text-2xl font-bold text-white">Kích hoạt {tier.name} thành công!</h1>
          <p className="mt-3 text-sm text-slate-400">
            Đã cấp phát <span className="text-emerald-400 font-mono font-bold">{tier.mcuCredits.toLocaleString()} MCU Credits</span> cùng khóa mật mã{' '}
            <code className="text-emerald-300">MEKONG-RAAS-v1</code> HMAC-SHA256.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/templates"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
            >
              Mở Business Packs Registry
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
