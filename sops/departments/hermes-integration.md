# SOP: Hermes Integration Department (me-wrapper)

## Purpose
This department manages the bridge between MEKONG CLI commands and Hermes Agent execution. When a task requires tool-based operations (file edit, terminal, browser, web search), the hermes-integration department takes ownership.

## Input Contracts
- Task description from any upstream department
- MEKONG goal state file path (for context)
- Required output format specification

## Decision Rights
1. Choose appropriate Hermes toolset based on task type:
   - Coding/Testing → `file,terminal`
   - Research → `web,session_search`  
   - UI/Visual → `browser,vision`
2. Delegate to Hermes via `hermes-bridge.sh` with proper context packet
3. Validate returned evidence against SOP gate requirements

## Output Artifacts
- Evidence JSON in `state/evidence/<department>.json`
- Code artifacts (if applicable) in project directory
- Verification report for upstream department handoff

## Evidence Contract Fields
```json
{
  "timestamp": "<ISO-8601>",
  "department": "hermes-integration",
  "artifacts": ["file_path_1", "file_path_2"],
  "proof": "human-readable verification text",
  "bottleneck_status": "passing|blocked|clear",
  "handoff_to": "<next-department>",
  "mrr_contribution": 0
}
```

## SOP Stages
1. **Receive Task** — Parse input from upstream department
2. **Context Pack** — Build MEKONG state context packet
3. **Toolset Selection** — Choose appropriate Hermes toolsets
4. **Execute via Bridge** — Call `hermes-bridge.sh` with task
5. **Validate Output** — Verify evidence against contract
6. **Handoff** — Pass completed artifacts to next department

## Handoff Rules
- To Quality & Compliance: Code artifacts + test results
- To Product Strategy: Feature spec documentation  
- To Growth Marketing: Deployed application URL
- To Sales Revenue: First customer proof document
