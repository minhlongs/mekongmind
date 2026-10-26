import Link from 'next/link';

const navLinks = [
  { label: 'Mekong CLI', href: '/cli' },
  { label: 'OPC Cockpit', href: 'http://localhost:3000/dashboard/opc' },
  { label: 'CMO Swarm', href: '/cmo' },
  { label: 'Packs Registry', href: '/templates' },
  { label: 'Sovereign Pricing', href: '/#pricing' },
  { label: 'GitHub Open-Core', href: 'https://github.com/mekongmind/mekongmind' },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#06080d]/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">MEKONG OPC</span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Sovereign 2027</span>
            </div>
          </Link>
          <div className="flex items-center gap-5 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#pricing"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
