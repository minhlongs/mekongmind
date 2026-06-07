'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TEMPLATE_MAP: Record<string, { name: string; slug: string }> = {
  'polar_cl_apvIt00Pf7vw2GGX0PW7tWfNjSiwaTRUl0YzO3YqVhA': { name: 'FnB Cloud Kitchen', slug: 'fnb-cloud-kitchen' },
  'polar_cl_TDhelBvQfsZq3Rayqf9to4tl0UD6D04OBFqXm1zJDVC': { name: 'Dropship Hub', slug: 'dropship-hub' },
  'polar_cl_zi7LHdaPk93V0xbNVQZgqum96gWCFDTVzpDNR2kfN3j': { name: 'SaaS Launchpad', slug: 'saas-launchpad' },
  'polar_cl_j082kdYKTStddcJ3Na3Pufznj7dph7WKIe1qS2amDT1': { name: 'Agency OS', slug: 'agency-os' },
};

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id') || '';
  const template = checkoutId ? TEMPLATE_MAP[checkoutId] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-white">Thanh toán thành công!</h1>
        <p className="mt-4 text-slate-400">
          Cảm ơn bạn đã mua. Kiểm tra email để nhận template và link truy cập.
        </p>

        {template && (
          <Link
            href={`/templates/${template.slug}/download`}
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400"
          >
            Tải {template.name}
          </Link>
        )}

        {!template && (
          <Link
            href="/templates"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400"
          >
            Xem Templates
          </Link>
        )}
      </div>
    </div>
  );
}
