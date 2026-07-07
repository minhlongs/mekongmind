'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DownloadClientProps {
  slug: string;
}

const CHECKOUT_LINKS: Record<string, string> = {
  'polar_cl_apvIt00Pf7vw2GGX0PW7tWfNjSiwaTRUl0YzO3YqVhA': 'fnb-cloud-kitchen',
  'polar_cl_TDhelBvQfsZq3Rayqf9to4tl0UD6D04OBFqXm1zJDVC': 'dropship-hub',
  'polar_cl_zi7LHdaPk93V0xbNVQZgqum96gWCFDTVzpDNR2kfN3j': 'saas-launchpad',
  'polar_cl_j082kdYKTStddcJ3Na3Pufznj7dph7WKIe1qS2amDT1': 'agency-os',
};

const TEMPLATE_SLUGS = ['fnb-cloud-kitchen', 'dropship-hub', 'saas-launchpad', 'agency-os', 'creator-economy', 'freelance-stack'];

const TEMPLATE_NAMES: Record<string, string> = {
  'fnb-cloud-kitchen': 'FnB Cloud Kitchen',
  'dropship-hub': 'Dropship Hub',
  'saas-launchpad': 'SaaS Launchpad',
  'agency-os': 'Agency OS',
  'creator-economy': 'Creator Economy',
  'freelance-stack': 'Freelance Stack',
};

export default function DownloadClient({ slug: initialSlug }: DownloadClientProps) {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id') || '';
  const urlSlug = searchParams.get('template') || '';
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [resolvedSlug, setResolvedSlug] = useState('');

  useEffect(() => {
    const resolved = initialSlug || urlSlug || CHECKOUT_LINKS[checkoutId] || '';
    if (!resolved || !TEMPLATE_SLUGS.includes(resolved)) {
      setError('Không tìm thấy template.');
      setStatus('error');
      return;
    }
    setResolvedSlug(resolved);
    setStatus('ready');
  }, [initialSlug, urlSlug, checkoutId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Đang xác thực đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Không thể xác thực</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <a href="/templates" className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400">
            Về trang Templates
          </a>
        </div>
      </div>
    );
  }

  const displayName = TEMPLATE_NAMES[resolvedSlug] || resolvedSlug;

  return (
    <div className="min-h-screen bg-slate-900 py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white">Template của bạn đã sẵn sàng</h1>
          <p className="mt-2 text-slate-400">
            Tải xuống bộ template <span className="text-emerald-400 font-semibold">{displayName}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Files bao gồm:</h2>
          <ul className="mb-6 space-y-2 text-slate-300">
            <li>📁 Source code đầy đủ</li>
            <li>📄 README + hướng dẫn deploy</li>
            <li>📋 LICENSE</li>
            <li>🔧 package.json + dependencies</li>
          </ul>

          <a
            href={`/templates/${resolvedSlug}/download/files.zip`}
            className="block w-full rounded-lg bg-emerald-500 px-6 py-4 text-center font-semibold text-slate-900 hover:bg-emerald-400"
          >
            ⬇️ Tải xuống ZIP
          </a>

          <p className="mt-4 text-center text-sm text-slate-500">
            Link tải có sẵn trong email xác nhận từ Polar.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a href="/templates" className="text-slate-400 hover:text-emerald-400">
            ← Quay lại trang Templates
          </a>
        </div>
      </div>
    </div>
  );
}
