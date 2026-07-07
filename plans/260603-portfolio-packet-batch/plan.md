# Portfolio Packet Batch

## Status
- In progress

## Context
- Portfolio queue covers 1159 products.
- Only one product currently has Growth/Sales and Release readiness packets.
- Goal requires all local products to move through autonomous self-selling stages.

## Scope
1. Add safe batch packet generation for release and Growth/Sales packets.
2. Select products missing the requested packet type.
3. Preserve shared active-goal artifacts after batch.
4. Never send outreach, mutate Polar, sync revenue, or mark self-selling.

## Success Criteria
- `me solo products packet-batch --kind both --limit N` creates product-specific packet files.
- Queue strict audit still passes.
- Self-selling audit still fails until real proof exists.

