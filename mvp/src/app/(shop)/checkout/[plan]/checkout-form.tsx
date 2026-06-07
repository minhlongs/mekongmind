'use client';

interface ProductInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
}

interface CheckoutFormProps {
  product: ProductInfo;
}

export default function CheckoutForm({ product }: CheckoutFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = (e.target as HTMLFormElement).email.value;
        const qs = new URLSearchParams({
          product: product.id,
          email,
          success: '/checkout/success',
          cancel: '/checkout/cancel',
        });
        window.location.href = `https://polar.sh/checkout?${qs}`;
      }}
    >
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Email
      </label>
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      <button
        type="submit"
        className="mt-6 w-full rounded-lg bg-emerald-500 px-6 py-4 font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
      >
        Mua với Polar
      </button>
    </form>
  );
}
