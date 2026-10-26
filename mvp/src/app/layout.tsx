import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'MEKONG OPC 2027 — Sovereign Operating System for One-Person Companies',
  description:
    'The Global Platform for One-Person Companies. Declarative Business Packs, Payload-Bound SHA-256 Approvals, Honest Usage Economics & Dual-Rail RaaS.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="dark scroll-smooth">
      <body className="min-h-dvh bg-[#06080d] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-slate-950 focus:shadow-lg"
        >
          Chuyển đến nội dung chính (Skip to main content)
        </a>
        {children}
      </body>
    </html>
  );
}
