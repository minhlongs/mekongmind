import { COMMERCIAL_TIERS, TIER_IDS, type TierId } from '@/lib/raas-config';
import CheckoutForm from './checkout-form';

export function generateStaticParams() {
  return TIER_IDS.map((plan) => ({ plan }));
}

interface CheckoutPageProps {
  params: Promise<{ plan: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { plan: rawPlan } = await params;
  const plan = rawPlan as TierId;
  const tier = COMMERCIAL_TIERS[plan];

  if (!tier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Gói RaaS không tồn tại</h1>
          <p className="mt-2 text-slate-400">Vui lòng chọn một trong các gói: basic, premium, enterprise, master.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] py-24">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-8 shadow-2xl">
          <div className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-4">
            Dual-Rail RaaS Checkout
          </div>
          <h1 className="text-3xl font-extrabold text-white">{tier.name}</h1>
          <p className="mt-2 text-sm text-slate-400">{tier.description}</p>

          <div className="mt-6 pb-6 border-b border-white/10 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white">
                ${tier.priceUsd.toLocaleString()}
              </span>
              <span className="text-sm text-slate-400"> / chu kỳ</span>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-emerald-400 font-mono">
                {tier.priceVnd.toLocaleString('vi-VN')} VND
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {tier.mcuCredits.toLocaleString()} MCU Credits
              </div>
            </div>
          </div>

          <div className="mt-8">
            <CheckoutForm tier={tier} />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 font-mono">
            Khóa mật mã MEKONG-RAAS-v1 HMAC-SHA256 được kích hoạt tự động ngay sau khi xác nhận thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
}
