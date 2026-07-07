# CEO Solo Harness DNA

Date: 260601

## Decision

`me` is the Mekongmind Agentic Platform Solo entrypoint. User provides one `idea/goal`; wrapper creates a CEO Solo Company operating state and coordinates the factory through SOP gates until first `$1M MRR`.

## Runtime Contract

- `me idea "<idea>"` creates durable `state/goal-*.md`
- State includes autonomous Solo mode, Mekongmind platform DNA, active factory loop, `$1M` revenue target, current SOP gate, and clone strategy
- Legacy 25-step `/idea` blueprint remains preserved
- Binh Phap chain remains the strategic execution spine
- Live execution hands off to `mekong goal create/run`

## SOP Gates

1. Idea accepted
2. Company blueprint ready
3. Offer validated
4. MVP live
5. First revenue
6. Repeatable channel
7. Fulfillment stable
8. Scale ready
9. First `$1M MRR`

## Cloneable RaaS DNA

Each project gets own ICP, offer, product, metrics, and experiments while inheriting shared Mekongmind harness, agent registry, GoalEngine handoff, SOP gates, and operating cadence.

## Commands

- `me idea "<idea>"`: mint CEO Solo Company goal
- `me solo start "<idea>"`: explicit Solo Company start alias
- `me solo status`: inspect active company state
- `me solo loop --once`: show next coordinator pass safely

## Unresolved Questions

- Exact metric source for live MRR tracking.
- Whether continuous loop should become launchd/daemon or stay GoalEngine-driven.
