# mekong-model-orchestrator

Part of the **Mekong IDE** monorepo.

CheetahClaws AI OS model orchestrator — intelligent LLM auto-routing and MCP server.

## Components

- **`cc-mcp-server.py`** — Exposes CheetahClaws AI OS capabilities (memory, tasks, agents, skills, brainstorm, trading, monitor, plan, SSJ) as MCP tools over stdio.
- **`cc-mcp-wrapper.sh`** — Shell wrapper that invokes `cc-mcp-server.py` using the CheetahClaws Python interpreter.
- **`router.py`** — Intelligent LLM auto-routing engine. Classifies prompts by complexity (5-dimension heuristic), routes to optimal model tier (7b/14b/35b/Claude), cascades on failure, logs to SQLite.
- **`router.sh`** — CLI wrapper for `router.py`.

## Usage

```bash
# MCP server (stdio transport for OpenCode/Claude)
python3 cc-mcp-server.py

# Model router
echo "Write a Python function" | python3 router.py
router.py --score "hello world"
router.py --dry-run "complex distributed system design"
router.py --json "analyze this architecture"
```

## Requires

- Python >= 3.11
- CheetahClaws AI OS (for cc-mcp-server.py)
- Ollama (for router.py local model tiers)

## Install (development)

```bash
pip install -r requirements.txt
```
