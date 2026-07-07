# Orchestration Protocol — Multi-Agent Coordination Rules

## Purpose

Defines how Claude Code coordinates with other MEKONGmind agents through CLI commands, preventing race conditions and ensuring proper department handoff.

## Agent Pool Architecture

MEKONG wrapper has 58 unified agents across 10 departments. When a task requires multiple agent types, they execute in sequence (not parallel) unless explicitly marked as `fanout-fanin` pattern:

```
ceo-command → market-intelligence → product-strategy → engineering-factory → quality-compliance → platform-operations → growth-marketing → sales-revenue → customer-success → knowledge-memory
```

### Sequential Execution (Default)

Most tasks follow department SOP handoff order. Claude Code acts as **engineering-factory** and waits for:
1. Product Strategy gate (`offer-validated.json`) to exist before building
2. Quality Compliance SOP gate evidence to trigger review pass

Example CLI flow:
```bash
# Step 1: CEO defines the goal
me idea "Build RaaS checkout for clinic booking"

# Step 2: Market Intelligence validates ICP and pricing  
me solo run market-intelligence ready "ICP validated"

# Step 3: Product Strategy creates blueprint
me solo run product-strategy ready "Offer blueprint valid"

# Step 4: Claude Code executes engineering tasks
claude -p "Implement clinic booking checkout flow in mvp/" --allowedTools "Read,Write,Bash" --max-turns 15

# Step 5: Quality Compliance reviews output
claude -p "Review all changes against sops/departments/quality-compliance.md standards" --max-turns 5

# Step 6: Engineering evidence gate passes
me solo artifact validate engineering-factory state/evidence/mvp-live.json
```

### Fanout-Fanin Pattern (Parallel Subtasks)

For tasks marked as `fanout-fanin`, Claude Code can execute multiple subtasks in parallel:
- Build frontend component AND backend API endpoint simultaneously
- Write unit tests AND integration tests concurrently

Implementation via tmux workspaces:
```bash
# Task A: Frontend build  
tmux new-session -d -s claude-fe 'cd mvp && claude -p "Build checkout page" --max-turns 10'

# Task B: Backend API
tmux new-session -d -s claude-be 'cd mvp && claude -p "Build /api/checkout endpoint" --max-turns 10'

# Wait for both, then fanin merge
sleep 30
echo "Both tasks complete. Merging outputs..."
```

### Producer-Reviewer Pattern (Feedback Loop)

For code that needs multiple review iterations:
```bash
# First pass — producer writes code  
claude -p "Implement auth middleware" --max-turns 5

# Second pass — reviewer checks quality
claude -p "Review the auth middleware changes. Check for injection, session leaks, and edge cases." --max-turns 3

# Third pass (optional) — fix based on feedback
claude -p "Apply these fixes to the auth middleware: [reviewer findings]" --max-turns 3
```

## Handoff Contract Between Departments

Before handoffing from engineering-factory (Claude Code) → quality-compliance, ensure:

1. Build passes (`npm run build` exits 0)
2. All new files have corresponding tests
3. No TODO comments without deadline/owner  
4. Evidence artifacts written to `state/evidence/` matching SOP contract fields
5. Git commit message references the gate being closed

## Bottleneck Routing Rules

When Claude Code encounters a blocker:
1. Cannot build → escalate to Product Strategy (was scope defined?)
2. Integration test fails with real API → escalate to Platform Operations (is sandbox configured?)  
3. State validation fails → escalate to CEO Command (are goal constraints valid?)

Never bypass gates. If evidence contract fields are missing, do NOT proceed to next department.

## Model Selection Protocol

| Task Type | Claude Model | Reasoning Effort |
|---|---|---|
| Simple fix / typo / logging | sonnet-4-6 | low |
| New feature with existing patterns | sonnet-4-6 | medium |  
| Complex multi-step build | opus-4-0-20250514 | high
| Architecture-level design decision | opus-4-0-20250514 + ultrathink | max

## Parallel Execution Limits

- Maximum 3 parallel Claude Code instances (matches `max_parallel: 3` in settings.json)
- Each instance gets `--max-turns 15` maximum to prevent runaway contexts
- Total token budget per session: ~$0.50 (set via `--max-budget-usd`)

## Error Recovery Protocol

If a Claude Code task fails:
1. Check context window health — if >70% used, run `/compact` first
2. Verify the SOP gate artifact exists and is valid before retrying
3. If same error persists for 3 attempts → escalate to CEO Command
4. Log failure details to `state/gates/failures.log` with timestamp and error message
