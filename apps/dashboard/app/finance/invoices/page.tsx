"use client";
export default function Page() {
  return (
    <div className="flex flex-col gap-[var(--spacing-xl)] p-[var(--spacing-xl)]">
      <div><h1 className="font-mono text-[var(--font-2xl)] font-bold text-[var(--text-primary)]">Invoices</h1><p className="mt-[var(--spacing-xs)] text-[var(--font-sm)] text-[var(--text-secondary)]">Invoice management and AR</p></div>
      <div className="grid grid-cols-4 gap-[var(--spacing-lg)]">
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Outstanding</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">12</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Value</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">$45K</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Overdue</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">2</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Avg Days</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">28</span></div>
      </div>
      <section className="flex flex-col gap-[var(--spacing-md)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-xl)]">
        <h2 className="font-mono text-[var(--font-lg)] font-semibold text-[var(--text-primary)]">AR aging</h2>
        <table className="w-full text-left text-[var(--font-sm)]">
          <thead className="text-[var(--text-muted)]">
            <tr><th className="py-2">Bucket</th><th>Count</th><th>Amount</th></tr>
          </thead>
          <tbody className="font-mono text-[var(--text-primary)]">
            {[
              ['Current (0-30d)', 8, '$32,400'],
              ['31-60d', 2, '$8,200'],
              ['61-90d', 1, '$2,400'],
              ['90d+', 1, '$2,000'],
            ].map((r) => (
              <tr key={r[0] as string} className="border-t border-[var(--border-subtle)]">
                <td className="py-2">{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[var(--font-xs)] text-[var(--text-muted)]">
          Aging buckets backed by `accounting.invoices` once `lib/accounting` ledger sync lands.
        </p>
      </section>
    </div>
  );
}
