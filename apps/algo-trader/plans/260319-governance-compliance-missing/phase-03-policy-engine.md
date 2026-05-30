---
title: "Phase 03: Policy Engine Implementation"
description: "Policy definition and enforcement engine for trading operations"
status: pending
priority: P2
effort: 2h
created: 2026-03-19
---

# Phase 03: Policy Engine Implementation

## Context Links

- Related: `phase-02-compliance-checker.md` (compliance rules consumer)
- Related: `src/arbitrage/config.ts` (configuration)
- Pattern: `.opencode/skills/skill-creator/references/skill-design-patterns.md`

## Overview

- **Priority:** P2 (enhancement over compliance)
- **Status:** pending
- **Description:** Define and enforce trading policies (risk limits, allowed assets, trading hours, circuit breakers) with hot-reload capability

## Key Insights

Policy Engine vs Compliance Checker:
- **Compliance** = External regulatory rules (mandatory, legal)
- **Policy** = Internal business rules (configurable, strategic)

Example policies:
- "No trading during weekends"
- "Max 5% portfolio in single asset"
- "Circuit breaker after 3 consecutive losses"
- "Only trade BTC/ETH/USDT pairs"

## Requirements

### Functional

1. **Policy Definition**
   - JSON/YAML policy files
   - Hot-reload without restart
   - Policy versioning

2. **Policy Types**
   - Asset whitelist/blacklist
   - Trading hours restrictions
   - Position size limits (% portfolio)
   - Daily loss limits (circuit breaker)
   - Leverage limits
   - Counterparty limits

3. **Policy Enforcement**
   - Pre-trade validation
   - Policy violation logging
   - Severity-based actions (block/warn)

4. **Policy Hierarchy**
   - Global policies (system-wide)
   - Strategy policies (per-strategy)
   - User policies (per-operator)

5. **Policy Audit**
   - Policy change history
   - Violation reports
   - Policy effectiveness metrics

### Non-Functional

- Hot-reload support (watch file changes)
- Fast evaluation (< 5ms per policy)
- Clear violation messages
- Default-deny or default-allow modes

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PolicyEngine                         │
├─────────────────────────────────────────────────────────┤
│ - policies: Map<string, Policy>                         │
│ - policyFiles: string[]                                 │
│ - violationLog: PolicyViolation[]                       │
│ - fileWatcher: FSWatcher                                │
│ - config: { hotReload, defaultAction, strictMode }      │
├─────────────────────────────────────────────────────────┤
│ + loadPolicy(path: string): Policy                      │
│ + reloadPolicies(): void                                │
│ + evaluate(context: PolicyContext): PolicyResult        │
│ + checkAsset(asset: string): boolean                    │
│ + checkPosition(asset: string, size: number): boolean   │
│ + checkTradingHours(): boolean                          │
│ + checkCircuitBreaker(): boolean                        │
│ + logViolation(violation: PolicyViolation): void        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ enforces
                          ▼
              ┌───────────────────────┐
              │   ComplianceChecker   │  (policy rules as compliance)
              └───────────────────────┘
                          │
                          │ enforces
                          ▼
              ┌───────────────────────┐
              │    TradingExecutor    │  (pre-trade check)
              └───────────────────────┘
```

### Policy Interface

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: PolicyCondition[];
  action: 'allow' | 'deny' | 'warn';
}

interface PolicyCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not-in' | 'regex';
  value: any;
}

interface PolicyContext {
  asset?: string;
  amount?: number;
  side?: 'buy' | 'sell';
  timestamp?: number;
  strategy?: string;
  counterparty?: string;
  [key: string]: any;
}
```

## Related Code Files

### Create

- `src/arbitrage/policy/policy-engine.ts` (main implementation)
- `src/arbitrage/policy/policy-types.ts` (interfaces, types)
- `src/arbitrage/policy/policy-loader.ts` (file loading, hot-reload)
- `src/arbitrage/policy/policies/default-policies.ts` (built-in policies)
- `src/arbitrage/policy/__tests__/policy-engine.test.ts` (unit tests)

### Modify

- `src/arbitrage/compliance/compliance-checker.ts` (optional: use policy engine)
- `src/arbitrage/executor.ts` (add policy check)

## Implementation Steps

1. **Types** - Define Policy, PolicyCondition, PolicyContext, PolicyResult
2. **Loader** - Load policies from JSON files, validate schema
3. **Evaluator** - Evaluate conditions against context
4. **Hot Reload** - Watch files, reload on change
5. **Built-in Policies** - Define default policies (asset whitelist, trading hours, etc.)
6. **Integration** - Hook into executor pre-trade
7. **Tests** - Cover all policy types + evaluation logic

## Todo List

- [ ] Create `policy-types.ts` with all interfaces
- [ ] Create `policy-loader.ts` with file loading
- [ ] Create `policy-engine.ts` main class
- [ ] Create `default-policies.ts` with built-in policies
- [ ] Write unit tests (15+ test cases)
- [ ] Integration test with executor
- [ ] Verify coverage > 90%

## Success Criteria

```bash
# Compilation
npx tsc --noEmit  # 0 errors

# Tests
npm test -- policy  # 100% pass, 90%+ coverage

# Hot Reload
# Modify policy file → engine reloads automatically

# Quality
grep -r ": any" src/arbitrage/policy/  # 0 results
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Policy file corruption | Engine crashes | Schema validation, rollback |
| Hot reload race condition | Inconsistent state | Debounce file changes |
| Policy conflict | Ambiguous enforcement | Priority ordering, first-match |
| Performance | Latency increase | Cache evaluations, async loading |

## Security Considerations

- Policy file integrity (checksum validation)
- No arbitrary code execution in policies
- Audit trail for policy changes
- Role-based policy access (future)

## Next Steps

1. Policy UI for non-technical operators
2. Policy templates for common scenarios
3. A/B testing for policy effectiveness
4. Policy simulation mode (what-if analysis)

## Unresolved Questions

1. Should policies support JavaScript expressions or only declarative conditions?
2. What's the default action: allow or deny?
3. Should policy violations always block trades or be configurable per policy?
