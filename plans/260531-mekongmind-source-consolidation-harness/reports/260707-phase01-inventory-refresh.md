# Source Inventory — Refresh (260607-2100)
*Auto-refreshed: 2026-07-07 | Production reload for cook execution*

## Refresh Delta from 2026-05-31

| Metric | Old | New | Delta |
|--------|-----|-----|-------|
| Apps | 32 | 33 | +1 (`content-hub`) |
| Packages | 57 | 49 | -8 (vibe-* merged/deduplicated) |
| Docs | 13 | 17 | +4 |
| External sources | 8 | 7 | -1 (`.cheetahclaws-src` missing) |

External sources still exist: 7 of 8. `.cheetahclaws-src` removed. Inventory from prior run is otherwise current — no new apps/packages beyond consolidation.

## Original Inventory (2026-05-31)
*See original document for full counts, decisions, and codebase context.*

## Implications for Cook Execution
- Package reduction is positive: vibe-* consolidation already happened upstream. Treat removed packages as `merged` not `lost`.
- `content-hub` is a new app — add to Phase 2 source map.
- `.cheetahclaws-src` missing → CheetahClaws must be sourced from `~/projects/openclaw` or embedded Python. Verify in Phase 4.
- 750 stale path refs to `mekong-cli` in docs — Phase 1 reporting gate passes (read-only); resolvable in Phase 2.
