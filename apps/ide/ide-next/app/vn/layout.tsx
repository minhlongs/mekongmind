import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mekong AI Hub — Trợ lý AI cho doanh nghiệp 1 người",
  description:
    "Mekong AI giúp 1 người vận hành doanh nghiệp như 10 người: kế toán VAS, marketing Zalo, thuế VN, VietQR — chỉ từ 199.000₫/tháng.",
  openGraph: {
    title: "Mekong AI Hub",
    description: "1 người. 6 bộ phận. 0 nhân viên.",
    locale: "vi_VN",
  },
};

const NAV = [
  { href: "/vn", label: "Trang Chủ" },
  { href: "/vn/tinh-nang", label: "Tính Năng" },
  { href: "/vn/bang-gia", label: "Bảng Giá" },
  { href: "/vn/huong-dan", label: "Hướng Dẫn" },
  { href: "/vn/lien-he", label: "Liên Hệ" },
];

export default function VNLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      lang="vi"
      style={{ fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
      />
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/vn" className="text-lg font-bold text-indigo-700">
            🌾 Mekong AI
          </Link>
          <ul className="hidden gap-6 text-sm md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-slate-600 hover:text-indigo-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/vn/bang-gia"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Dùng thử 14 ngày
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>© 2026 Mekong AI · Built for Vietnamese OPC · Made with ❤️ in TP.HCM</p>
        <p className="mt-2">
          <Link href="/vn/lien-he" className="hover:text-indigo-700">Liên hệ</Link> · {" "}
          <a
            href="https://zalo.me/mekongmind"
            className="hover:text-indigo-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Zalo OA
          </a>
        </p>
      </footer>
    </div>
  );
}
