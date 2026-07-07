# /me-status

Check MEKONG wrapper CLI state — active goal, department progress, MRR ladder.

Steps:
1. List state/goal-*.md files to find current active goal  
2. Check state/departments/ for each department's run ledger status
3. Read sops/departments/engineering-factory.md if mvp-live gate is pending
4. Report bottleneck departments and next action required

Output example:
```json
{
  "active_goal": "Build RaaS clinic booking SaaS",
  "goal_stamp": "20260603-155324",
  "departments_status": {
    "ceo-command": "completed",
    "market-intelligence": "completed",  
    "product-strategy": "in-progress",
    "engineering-factory": "blocked — awaiting offer validation"
  },
  "bottleneck": "product-strategy",
  "next_action": "Run me solo run product-strategy ready 'Offer blueprint validated'"
}
```
