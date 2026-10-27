import { Suspense } from 'react';
import DownloadClient from './download-client';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
        <p className="text-slate-400">Đang xác thực...</p>
      </div>
    </div>
  );
}

export default async function DownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DownloadClient slug={slug} />
    </Suspense>
  );
}
