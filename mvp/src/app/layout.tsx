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
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#06080d] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
