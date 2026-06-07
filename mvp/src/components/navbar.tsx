import Link from 'next/link';
const navLinks = [
  { label: 'Templates', href: '/templates' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'GitHub', href: 'https://github.com/mekongmind/mekongmind' },
];
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">MEKONG Mind</span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#pricing"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
