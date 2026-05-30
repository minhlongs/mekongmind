# Quarterly Review Framework

**Cadence:** Last week of each quarter
**Duration:** 1 ngày off-site (recommend HCM hoặc resort gần CT để escape ops)
**Attendees:** All founders + Tech Lead + Sales Lead (Y2+)
**Output:** 1 pager decision doc + updated OKRs

---

## Agenda (full day)

### Morning (3h) — DATA REVIEW

#### 1. Financial review (45m)
- Revenue actual vs target (per service tier)
- Margin per project
- Cost structure breakdown
- Runway months remaining
- AR/AP aging

#### 2. Customer review (45m)
- New customers added Q
- Churn (retainer cancellation)
- NPS từ closeout retro
- Top 3 complaints / top 3 praises
- Customer concentration % (largest 3 = ?% revenue)

#### 3. Pipeline review (30m)
- Lead source ROI (referral_source breakdown)
- Conversion rate per stage
- Average deal size trend
- Sales cycle length trend

#### 4. Pattern mining (60m) — **CRITICAL**
Run SQL queries trên Pain Tag CSV:
- Pain category lặp ≥5 customer cùng industry?
- Likely repeatable + status=won → sản phẩm candidate?
- Cross-vertical patterns (cùng pain ở 2+ industries)?

**Output:** ranked list of 0–3 product candidates với data backing.

### Afternoon (3h) — STRATEGY

#### 5. Architecture review (45m)
- Shared lib usage stats — package nào used <2x → kill
- Tech debt list từ retros
- Stack drift (project nào dùng off-stack?)
- Security/compliance audit

#### 6. People review (45m)
- Team retention
- Hiring plan next Q
- Comp adjustment needed?
- 1:1 founder check-in (relationship + burnout)

#### 7. Decision: continue/pivot/double-down (60m)

Hard gate framework:

| Metric | Continue Archetype C | Fall back to A | Pivot to B |
|---|---|---|---|
| Service revenue/month | ≥ target | <60% target | any |
| Margin | ≥25% | <15% | any |
| Pattern signal | 2+ candidates | 0 candidates | 1 strong (≥5 willing-to-pay) |
| Team retention | ≥80% | <60% | any |
| Cash runway | ≥6mo | <3mo | ≥9mo (B more capital intensive) |

Decision doc format:
```
## Q[X] Decision

### Status
- Service rev: ___ vs target ___ (___%)
- Margin: ___%
- Patterns: ___
- Runway: ___ months

### Decision
[ ] CONTINUE Archetype C as planned
[ ] DOUBLE DOWN: invest more in vertical __
[ ] FALL BACK: reduce headcount, focus reseller
[ ] PIVOT: build vertical SaaS as primary

### Rationale
___

### Action items (next Q)
- [ ] ...
- [ ] ...

### Risks
- ___

### Reversibility check
- This decision can be reversed in ___ weeks at cost of ___
```

#### 8. OKR reset (30m)
3–5 objectives, each with 2–3 measurable key results.

---

## Hard Gates (Y1)

### End Q1 (Month 3)
- 5 lighthouse customers signed?
- 5 SOW templates field-tested?
- Founder relationship intact (NPS internal)?
- → If NO 2+ → reduce burn, extend runway

### End Q2 (Month 6)
- 15+ customers cumulative?
- Revenue 150tr+/month?
- 1 pattern signal emerging?
- Shared lib v0.1 usable?
- → If NO 2+ → consider pivot

### End Q3 (Month 9) — **CRITICAL DECISION GATE**
- Revenue 200tr+/month?
- 2+ product candidates from pattern mining?
- Margin 25%+?
- Cash 6+ months runway?
- → Decision: continue C / fall back A / pivot B

### End Q4 (Month 12) — **YEAR REVIEW**
- Annual P&L
- 2 lighthouse pattern → 1 vertical MVP?
- 3 alpha customers committed?
- Year 2 strategy locked

---

## Anti-pattern checklist (kill if observed)

- [ ] Same architectural decision re-litigated 3+ times → freeze, document, move on
- [ ] Customer concentration >25% from single client → diversify aggressively
- [ ] Reseller revenue >40% of total → high concentration risk, build own product faster
- [ ] >3 projects margin <20% → re-price or decline tier
- [ ] Founder working >70h/week sustained → hiring or descope
- [ ] Pattern review skipped 2 consecutive Qs → product extraction failed, need intervention
- [ ] Tech stack drift (3+ "exception" stacks) → enforce mono-stack or formally update convention

---

## Sample Q1 review output (mock)

```
## Q1 Decision (Mar 2026)

### Status
- Service rev: 95tr/month vs target 80tr (+19%)
- Margin: 32%
- Patterns: 0 strong (only 4 customers — too early)
- Runway: 9 months
- Customers: 5 (3 web + 1 POS + 1 marketing)

### Decision
[x] CONTINUE Archetype C as planned

### Rationale
- Above revenue target shows demand exists
- Margin healthy
- Too early for product signal (need 15+ customers minimum)
- Founder team intact

### Action items (next Q)
- [ ] Hire 2nd dev (mid-level, from HCM)
- [ ] Standardize onboarding to scale lighthouse → 15 by end Q2
- [ ] Setup pattern tag CSV in Airtable (currently Google Sheets)
- [ ] First Vertical SOW with HTX or OCOP customer (any tier)

### Risks
- Reseller margin Misa cut announced — track impact
- Sales bottleneck (only 1 sales founder, all customers needed CEO touch)

### Reversibility
- Hiring decision: 3-month probation, reversible
- All other decisions: low reversibility cost
```
