---
title: "MekongMind Source Consolidation + Local LLM Harness"
description: "Canonical handoff plan to consolidate Mekong sources into MekongMind and wire local-LLM harness operations for OpenClaw + CheetahClaws."
status: ready-for-cook
priority: P0
effort: 5d
branch: codex/mekongmind-source-consolidation-harness
tags: [mekongmind, consolidation, local-llm, openclaw, cheetahclaws, harness]
created: 260531
---

# MekongMind Source Consolidation + Local LLM Harness

## Step 1: Idea Validation

**GO.** Market is real: solo operators need a local-first AI operating system that reduces cloud cost and coordinates coding/ops/sales agents. Technical feasibility is high because current repo already has MekongMind monorepo, Python CLI, TS LLM router, Go/Rust engine, OpenClaw packages, CheetahClaws source, and local LLM hooks. MVP is 5 focused days: inventory, manifest, canonical runtime, local harness, proof gates.

## Step 2: Business Model Canvas

- Value proposition: one local-first AI company OS that lets a solo founder run engineering + ops harnesses from a single MekongMind workspace.
- Customer segments: solo technical founders, AI automation agencies, local-first agent operators.
- Revenue streams: $49-499/mo subscription, paid setup, private harness templates.
- Key resources: MekongMind CLI, local LLM router, OpenClaw daemon, CheetahClaws assistant bridge, Cloudflare deploy surfaces.
- Cost structure: local Mac compute first, optional Claude/Zunef/OpenRouter burst, Cloudflare Pages/Workers, Polar billing.
- Unfair advantage: existing Mekong command catalog + OpenClaw/CheetahClaws integration already lives on this machine.

## Objective

Make `/Users/macbook/mekongmind` the canonical repo for all Mekong-era apps and harness operations. Source repos remain read-only until each migrated component has manifest evidence and verification gates.

## Current Evidence

- Target repo: `/Users/macbook/mekongmind`, 32 apps, 57 packages, Python CLI, Go/Rust/Python engine.
- Existing external plan: `/Users/macbook/plans/mekongmind-consolidation/plan.md`, pending and incomplete for OpenClaw/CheetahClaws harness.
- External sources found: `~/mekong-cli`, `~/mekong-digital`, `~/mekong-foundation`, `~/mekong-ide`, `~/mekong-ide-core`, `~/mekong`, `~/projects/openclaw`, `~/.cheetahclaws-src`.
- Current repo is dirty; Claude must not revert unrelated changes or delete source repos.

## Architecture Decision

Canonical runtime is **MekongMind Harness OS**:

```
MekongMind CLI -> PEV engine -> LLM Router -> Local LLM first -> Cloud burst fallback
       |              |              |
       v              v              v
  CheetahClaws   CheetahClaws MCP   OpenClaw missions
  assistant      + sandbox/tools    + daemon/worker
```

Local LLM is the default execution substrate for cheap repeated harness work. Cloud models are explicit fallback/escalation, not hidden default.

## Phase Summary

| Phase | File | Status | Duration | Purpose |
|---|---|---:|---:|---|
| 1 | [Inventory + Canonical Manifest](phase-01-inventory-manifest.md) | ready | 1d | Prove what exists and decide keep/merge/archive |
| 2 | [Source Consolidation Map](phase-02-source-consolidation-map.md) | ready | 1d | Map external repos into target paths without destructive moves |
| 3 | [Local LLM Harness Runtime](phase-03-local-llm-harness-runtime.md) | ready | 1d | Standardize local/cloud model routing and harness config |
| 4 | [OpenClaw + CheetahClaws Integration](phase-04-openclaw-cheetahclaws-integration.md) | ready | 1d | Make both systems callable from MekongMind with clear boundaries |
| 5 | [Proof, Docs, Claude Handoff](phase-05-proof-docs-handoff.md) | ready | 1d | Gates, docs, and final `/cook` handoff |

## Non-Negotiables

- Copy before move. No source repo deletion.
- Build a manifest before changing imports.
- Do not hide broken modules behind broad ignores.
- Keep canonical env vars: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, plus local overrides.
- Every phase ends with command evidence.

## Success Criteria

- `plans/260531-mekongmind-source-consolidation-harness/source-inventory.md` is complete and checked against live paths.
- Canonical target map exists for every Mekong/OpenClaw/CheetahClaws source; local LLM harness has one config contract and one smoke command.
- OpenClaw and CheetahClaws are represented as first-class harness adapters, not scattered bridges.
- Claude handoff command is ready:

```bash
/cook ./plans/260531-mekongmind-source-consolidation-harness/plan.md --auto
```
