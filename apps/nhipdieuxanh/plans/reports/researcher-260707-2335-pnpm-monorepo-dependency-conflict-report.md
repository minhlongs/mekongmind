# pnpm Monorepo Dependency Conflict Report

**Date:** 2026-07-07
**Context:** ultracode app (Next.js 16 + React 19) fails to resolve correct node_modules in a multi-workspace monorepo

---

## Root Cause Analysis

### The 3-tier workspace problem

1. **Root workspace** (`pnpm-workspace.yaml` at `/Users/macbook/mekongmind/`) defines packages but has **no root `pnpm-lock.yaml`** and no root `package.json`.
2. **`apps/ultracode/pnpm-workspace.yaml`** exists with `ignoredBuiltDependencies` only — it defines NO workspace packages, so pnpm treats any install within ultracode as the workspace root.
3. **`apps/nhipdieuxanh/pnpm-workspace.yaml`** exists as a standalone workspace (also with no workspace packages defined) — fully self-contained.

### What this means in practice

When `pnpm install` runs at the **root** (`pnpm-workspace.yaml` includes `apps/*/` and `apps/mekonmind-landing`):
- pnpm builds a **shared** `node_modules` at the root level (via hoisting)
- If ultracode or its peer workspace dependencies resolve different versions of react/next, the shared hoisted version wins
- There is **no lockfile** to pin versions, so `^` ranges resolve inconsistently

When `pnpm install` runs **inside ultracode**:
- Its `pnpm-workspace.yaml` has no workspace packages declared
- pnpm installs dependencies but may still hoist or bleed from parent workspace if parent was previously installed

### Specific version conflict zones

| Package | ultracode `package.json` | nhipdieuxanh `package.json` | Type |
|---------|--------------------------|----------------------------|------|
| `next` | `^16.2.0` | `16.2.6` (exact) | Major apps diverge on exact patch |
| `react` | `^19.2.0` | `19.2.4` (exact) | Same major, different patch |
| `react-dom` | `^19.2.0` | `19.2.4` (exact) | Same issue |
| `lucide-react` | `^0.475.0` | `^0.475.0` | Identical range |

### Why nhipdieuxanh "works"

nhipdieuxanh has **pinned exact versions** (`16.2.6`, `19.2.4`) and only uses `apps/*/` scope **without** nested workspace files conflicting. It installs as a self-contained unit.

---

## Root-Level Causes (Systemic)

1. **No root `package.json`** — the root directory lacks a root workspace package to own shared lockfile and hoisting policy
2. **No root `pnpm-lock.yaml`** — every `pnpm install` is a fresh resolution that may differ across subs vs root
3. **`apps/ultracode/pnpm-workspace.yaml` has no workspace packages defined** — this file creates an ambiguous install scope
4. **Two Next.js apps with different pinning strategies** in the same workspace glob: nhipdieuxanh pins exact, ultracode uses `^`
5. **`.npmrc` in ultracode only sets `ignoredBuiltDependencies`** — does NOT set `public-hoist-pattern` or `shamefully-hoist` (which is the usual workaround for React 19 + Next.js 16 interop issues)

---

## Fix Options Ranked

### Option 1: Per-app install (recommended for ultracode initially)

Run `pnpm install` **inside `apps/ultracode/`** only. Do NOT run install at root.

Evidence: nhipdieuxanh appears to follow this pattern — its own `pnpm-workspace.yaml` and isolated workspace scope.

Trade-offs:
- Each app manages its own lockfile
- No shared dependency deduplication across apps (acceptable — they don't share runtime code)
- Fast, low-risk, no root coordination needed

Steps:
```bash
cd /Users/macbook/mekongmind/apps/ultracode
rm -rf node_modules  # clean bleed from parent
pnpm install
```

Then pin exact versions to match nhipdieuxanh pattern:
- `next`: use exact `16.2.6` instead of `^16.2.0`
- `react`/`react-dom`: pin exact versions, e.g., `19.2.7` (latest React 19 stable)

### Option 2: Clean root workspace + per-app lockfiles (medium-term)

Add `pnpm-lock.yaml` ONLY at root and remove `pnpm-workspace.yaml` from each app. Each app becomes an independent sub-workspace.

But this is over-engineering. The apps are truly independent. YAGNI.

### Option 3: Delete `apps/ultracode/pnpm-workspace.yaml` (cleanest)

The file serves no purpose — it has no workspace packages. Remove it. Then ultracode is either:
- Treated as part of the parent workspace (via `apps/*/` glob), or
- A standalone app with its own install scope

If the parent workspace never runs install, this is equivalent to Option 1.

---

## Recommendation

**Do Option 1 now, add a `.npmrc` with shared hoisting config for React 19 + Next.js 16.**

React 19 + Next.js 16 has known peer resolution complexity. Add this to `apps/ultracode/.npmrc`:

```
ignoredBuiltDependencies=sharp,unrs-resolver
link-workspace-packages=false
public-hoist-pattern[]=*react*
public-hoist-pattern[]=*next*
```

The `link-workspace-packages=false` prevents pnpm from linking to sibling workspace packages that may have incompatible versions. `public-hoist-pattern` ensures react/next are in the correct scope after hoisting.

## Unresolved Questions

1. Is there a script or CI step that runs `pnpm install` at the root? If yes, we need to delete the running-install-at-root step before fixing.
2. Does `apps/mekonmind-landing` also run Next.js? If yes, it may share React/Next versions and root hoisting could benefit from a proper root lockfile.
3. What version of `next` was originally specified — `^16.2.0` or `16.x`? The caret range on a Next.js major is unusual (Next.js doesn't always honor semver perfectly).
4. What React/Next.js version does the root workspace's other apps (non-Next.js) require? If any share these, a single root lockfile could help.
