const links = [
  {
    title: 'OPC Platform',
    items: [
      { label: 'Business Packs (opc-pack/v1)', href: '/templates' },
      { label: 'SHA-256 Approval Gate', href: '#pricing' },
      { label: 'Honest Usage Ledger', href: '#pricing' },
    ],
  },
  {
    title: 'Open-Core Runtime',
    items: [
      { label: 'GitHub Repository', href: 'https://github.com/mekongmind/mekongmind' },
      { label: '25-Step Blueprint', href: '#' },
      { label: 'CycloneDX 1.5 SBOM', href: '#' },
    ],
  },
  {
    title: 'Dual-Rail RaaS',
    items: [
      { label: 'VietQR Napas 247', href: '#pricing' },
      { label: 'NOWPayments Crypto IPN', href: '#pricing' },
      { label: 'MEKONG-RAAS-v1 Verifier', href: '#pricing' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { label: 'MIT Core License', href: '#' },
      { label: 'Privacy & Sovereignty', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06080d]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {links.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs font-mono text-slate-500">
          <p>© 2027 MEKONG OPC — Sovereign Operating System for One-Person Companies. MIT Open-Core + Dual-Rail RaaS.</p>
        </div>
      </div>
    </footer>
  );
}
