# Portfolio Release Readiness Packet

## Status
- In progress

## Context
- `mvp-live.json` passes Engineering Factory but strict gate blocks Quality & Compliance and Platform Operations.
- Current blocker is legitimate: public deploy, version match, release approval, and Polar checkout evidence are not verified.

## Scope
1. Add product command to generate release readiness packet from current `mvp-live.json`.
2. Packet must show engineering/quality/platform pass/fail and exact blockers.
3. Packet must not count as release proof, production proof, campaign proof, or revenue proof.
4. Update registry/docs/tests.

## Success Criteria
- Command writes `state/products/evidence/<product>/release-readiness-packet.json`.
- Queue records packet path and stays non-self-selling.
- Strict audit still passes; self-selling audit still fails until real proof exists.

