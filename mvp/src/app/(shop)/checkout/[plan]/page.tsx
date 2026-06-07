import { POLAR_PRODUCTS, type ProductId } from '@/lib/polar-config';
import CheckoutForm from './checkout-form';

export function generateStaticParams() {
  return Object.keys(POLAR_PRODUCTS).map((plan) => ({ plan }));
}

interface CheckoutPageProps {
  params: { plan: string };
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const plan = params.plan as ProductId;
  const product = POLAR_PRODUCTS[plan];

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Plan không tồn tại</h1>
          <p className="mt-2 text-slate-400">Vui lòng chọn plan hợp lệ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-24">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8">
          <h1 className="text-3xl font-bold text-white">{product.name}</h1>
          <p className="mt-2 text-slate-400">{product.description}</p>

          <div className="mt-8">
            <span className="text-5xl font-bold text-emerald-400">
              ${product.price}
              <span className="text-2xl text-slate-400">/mo</span>
            </span>
          </div>

          <div className="mt-8">
            <CheckoutForm product={product} />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Thanh toán qua Polar.sh — secure checkout
          </p>
        </div>
      </div>
    </div>
  );
}
