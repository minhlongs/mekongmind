'use client'

// Antigravity widget stubs — render placeholders until the real backend
// streaming layer is wired up.

import * as React from 'react'

export function UnifiedBridgeWidget(): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-[var(--spacing-lg)]">
      <h3 className="font-mono text-[var(--font-md)] font-semibold text-[var(--text-primary)]">
        Unified Bridge
      </h3>
      <p className="mt-[var(--spacing-xs)] text-[var(--font-sm)] text-[var(--text-secondary)]">
        Cross-tenant signals. Wires to <code>antigravityAPI.getAll()</code> once
        the backend stream lands.
      </p>
    </div>
  )
}
