# Demo Goal: Build "Nhip Song Xanh" Web App

Status: active  
Mode: demo-integration  
Department: hermes-integration, engineering-factory  
Model: qwen3.6:35b-cc-65k  
---
# Demo Goal: Nhip Song Xanh (Green Rhythm Life)

This goal demonstrates the full MEKONG + Hermes deep integration pipeline by building a simple web application for sustainable living concepts.

## Department Responsibilities

### hermes-integration (Primary)
- Build a React-based landing page
- Use browser tools for UI/UX validation  
- Write evidence JSON after each milestone

### engineering-factory (Secondary)  
- Create the actual code files
- Run tests and lint checks
- Prepare artifacts for quality-compliance handoff

## Evidence Contract (Mandatory Fields)
```json
{
   "department": "hermes-integration",
   "artifacts": ["src/landing-page.jsx"],
   "proof": "Landing page renders correctly on mobile viewports",
   "bottleneck_status": "clear",
   "handoff_to": "engineering-factory",
   "mrr_contribution": 0,
   "timestamp": "2026-06-04T12:30:00Z"
}
```

## Expected Flow
1. MEKONG creates this goal and registers in `state/goal-demo.json`
2. hermes-integration reads SOP chain from `sops/departments/hermes-integration.md`  
3. Task delegation goes through `lib/hermes-bridge.sh` to Hermes Agent
4. Hermes executes coding work using file/terminal tools
5. Evidence artifacts written to state/evidence/ directory
6. Gate validation checks all required fields present
7. Handoff to quality-compliance when MVP complete

## Success Criteria
- Landing page renders in browser (no console errors)
- Code passes lint and basic tests  
- Evidence JSON contains ALL required fields
- Department ledger updated with timestamps
