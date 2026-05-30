---
title: "Missing Governance Features Implementation"
description: "Implement Phase 10 DAO Governance (GovernanceProposer) + Compliance Checker + Policy Engine"
status: pending
priority: P1
effort: 8h
branch: HEAD
tags: [governance, dao, compliance, policy, phase10]
created: 2026-03-19
---

# Missing Governance Features - Overview Plan

## Context

Coverage reports reference Phase 10 DAO Governance components but source directory is empty (0% coverage, stubs only). Three critical features missing:

1. **GovernanceProposer** - Token-weighted voting, proposal lifecycle
2. **Compliance Checker** - Regulatory compliance validation
3. **Policy Engine** - Policy definition and enforcement

## Phases

| Phase | Feature | Status | Effort |
|-------|---------|--------|--------|
| [Phase 01](./phase-01-governance-proposer.md) | GovernanceProposer class | pending | 3h |
| [Phase 02](./phase-02-compliance-checker.md) | Compliance Checker | pending | 3h |
| [Phase 03](./phase-03-policy-engine.md) | Policy Engine | pending | 2h |

## Dependencies

- Phase 2-6: Existing arbitrage infrastructure
- Phase 10: DAO Governance foundation (token-issuer, dark-pool-creator, liquidity-manager)
- ROIaaS Constitution: Dual-stream revenue model

## Success Criteria

- [ ] All 3 classes implemented with 90%+ test coverage
- [ ] Integration with existing Phase 10 modules
- [ ] Dry-run mode default (production-safe)
- [ ] TypeScript strict mode, 0 any types
- [ ] All tests passing

## Risks

- Regulatory compliance requirements vary by jurisdiction
- Token-weighted voting requires careful quorum tuning
- Policy engine complexity vs. performance trade-off

## Next Steps

1. Review this plan
2. Approve implementation
3. Execute phases in order (01 → 02 → 03)
