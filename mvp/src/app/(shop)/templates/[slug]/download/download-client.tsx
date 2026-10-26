'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DownloadClientProps {
  slug: string;
}

const TEMPLATE_SLUGS = [
  'client-proposal-followup',
  'fnb-cloud-kitchen',
  'dropship-hub',
  'saas-launchpad',
  'agency-os',
  'creator-economy',
  'freelance-stack',
];

const TEMPLATE_NAMES: Record<string, string> = {
  'client-proposal-followup': 'Client Proposal & Follow-Up (opc-pack/v1)',
  'fnb-cloud-kitchen': 'FnB Cloud Kitchen Sovereign',
  'dropship-hub': 'Dropship & Cross-Border Hub',
  'saas-launchpad': 'SaaS Sovereign Launchpad',
  'agency-os': 'Solo Agency OS',
  'creator-economy': 'Creator Economy Pack',
  'freelance-stack': 'Technical Freelancer Stack',
};

export default function DownloadClient({ slug: initialSlug }: DownloadClientProps) {
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get('template') || '';
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [resolvedSlug, setResolvedSlug] = useState('');

  useEffect(() => {
    const resolved = initialSlug || urlSlug || '';
    if (!resolved || !TEMPLATE_SLUGS.includes(resolved)) {
      setError('Không tìm thấy Business Pack.');
      setStatus('error');
      return;
    }
    setResolvedSlug(resolved);
    setStatus('ready');
  }, [initialSlug, urlSlug]);

  const [licenseKey, setLicenseKey] = useState('');
  const isLicenseValid = /^MEKONG-RAAS-v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(licenseKey.trim());

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Đang xác thực Business Pack...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d]">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Không thể xác thực</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <a href="/templates" className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400">
            Về Business Packs Registry
          </a>
        </div>
      </div>
    );
  }

  const displayName = TEMPLATE_NAMES[resolvedSlug] || resolvedSlug;

  return (
    <div className="min-h-screen bg-[#06080d] py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white">Business Pack đã sẵn sàng</h1>
          <p className="mt-2 text-slate-400">
            Tải xuống bộ gói <span className="text-emerald-400 font-semibold">{displayName}</span>
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Cấu trúc gói opc-pack/v1:</h2>
          <ul className="mb-6 space-y-2 text-slate-300 text-sm">
            <li>📁 manifest.json (Declarative Schema & Cost Policy)</li>
            <li>📄 README + hướng dẫn kích hoạt CLI (`mekong opc validate-pack`)</li>
            <li>🔐 Cấu hình Payload-Bound SHA-256 Approval Gate</li>
            <li>📊 Honest Usage Ledger Schema</li>
          </ul>

          <div className="mb-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Nhập khóa bản quyền MEKONG-RAAS-v1 để mở khóa tải xuống
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="MEKONG-RAAS-v1.<payload_b64>.<hmac_sha256_sig>"
              className="w-full rounded-lg border border-white/10 bg-[#06080d] px-4 py-3 font-mono text-xs text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {isLicenseValid ? (
            <a
              href={`/templates/${resolvedSlug}/download/files.zip`}
              className="block w-full rounded-lg bg-emerald-500 px-6 py-4 text-center font-bold text-slate-950 hover:bg-emerald-400"
            >
              ⬇️ Tải xuống Pack Bundle (.zip)
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="block w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/60 px-6 py-4 text-center font-semibold text-slate-500"
            >
              🔒 Vui lòng nhập khóa MEKONG-RAAS-v1 hợp lệ để tải xuống
            </button>
          )}

          <p className="mt-4 text-center text-xs font-mono text-slate-500">
            Xác thực qua khóa MEKONG-RAAS-v1 Dual-Rail (VietQR / NOWPayments).
          </p>
        </div>

        <div className="mt-8 text-center">
          <a href="/templates" className="text-slate-400 hover:text-emerald-400 text-sm">
            ← Quay lại Business Packs Registry
          </a>
        </div>
      </div>
    </div>
  );
}
