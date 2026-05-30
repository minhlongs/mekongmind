"use client";
export default function Page() {
  return (
    <div className="flex flex-col gap-[var(--spacing-xl)] p-[var(--spacing-xl)]">
      <div><h1 className="font-mono text-[var(--font-2xl)] font-bold text-[var(--text-primary)]">Financial Reports</h1><p className="mt-[var(--spacing-xs)] text-[var(--font-sm)] text-[var(--text-secondary)]">P&L, balance sheet, cash flow</p></div>
      <div className="grid grid-cols-4 gap-[var(--spacing-lg)]">
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Reports</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">12</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Last Close</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">Mar 2026</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Days to Close</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">5</span></div>
        <div className="flex flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]"><span className="text-[var(--font-xs)] text-[var(--text-muted)]">Accuracy</span><span className="font-mono text-[var(--font-xl)] font-bold text-[var(--text-primary)]">99.8%</span></div>
      </div>
      <section className="flex flex-col gap-[var(--spacing-md)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-xl)]">
        <h2 className="font-mono text-[var(--font-lg)] font-semibold text-[var(--text-primary)]">P&amp;L summary — March 2026</h2>
        <table className="w-full text-left text-[var(--font-sm)]">
          <thead className="text-[var(--text-muted)]">
            <tr><th className="py-2">Line</th><th>Mar 26</th><th>Feb 26</th><th>Δ</th></tr>
          </thead>
          <tbody className="font-mono text-[var(--text-primary)]">
            {[
              ['Revenue', '$8,200', '$6,400', '+28%'],
              ['COGS (LLM API)', '-$1,640', '-$1,280', '+28%'],
              ['Gross profit', '$6,560', '$5,120', '+28%'],
              ['Infra (CF/Stripe)', '-$120', '-$98', '+22%'],
              ['Operating income', '$6,440', '$5,022', '+28%'],
            ].map((r) => (
              <tr key={r[0] as string} className="border-t border-[var(--border-subtle)]">
                {r.map((cell, i) => (
                  <td key={i} className="py-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[var(--font-xs)] text-[var(--text-muted)]">
          Numbers wired from Polar invoices + Cloudflare usage once /v1/finance/snapshot ships.
        </p>
      </section>
    </div>
  );
}
