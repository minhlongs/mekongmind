"use client";

export default function Page() {
  return (
    <div className="flex flex-col gap-[var(--spacing-xl)] p-[var(--spacing-xl)]">
      <div>
        <h1 className="font-mono text-[var(--font-2xl)] font-bold text-[var(--text-primary)]">MCU Billing</h1>
        <p className="mt-[var(--spacing-xs)] text-[var(--font-sm)] text-[var(--text-secondary)]">Credit consumption, invoicing, and usage tracking</p>
      </div>
      <div className="grid grid-cols-4 gap-[var(--spacing-lg)]">
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">MRR</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">$8.2K</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Credits Used</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">4.2K</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Avg Per Tenant</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">350</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Overdue</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">0</span></div>
      </div>
      <section className="flex flex-col gap-[var(--spacing-md)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-xl)]">
        <h2 className="font-mono text-[var(--font-lg)] font-semibold text-[var(--text-primary)]">Recent invoices</h2>
        <table className="w-full text-left text-[var(--font-sm)]">
          <thead className="text-[var(--text-muted)]">
            <tr>
              <th className="py-2">Invoice</th>
              <th>Tenant</th>
              <th>Tier</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issued</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[var(--text-primary)]">
            {[
              ['INV-1042', 'cus_polar_42', 'Growth', '$149.00', 'paid', '2026-04-21'],
              ['INV-1041', 'cus_polar_18', 'Pro', '$499.00', 'paid', '2026-04-20'],
              ['INV-1040', 'cus_polar_07', 'Starter', '$49.00', 'paid', '2026-04-15'],
              ['INV-1039', 'cus_polar_03', 'Growth', '$149.00', 'paid', '2026-04-12'],
            ].map((r) => (
              <tr key={r[0]} className="border-t border-[var(--border-subtle)]">
                {r.map((cell, i) => (
                  <td key={i} className="py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[var(--font-xs)] text-[var(--text-muted)]">
          Real data wires through <code>/v1/billing/invoices</code> once Polar webhooks land in D1.
        </p>
      </section>
    </div>
  );
}
