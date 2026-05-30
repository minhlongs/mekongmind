# Mekong IDE Core

Multi-agent IDE orchestrator for Apple Silicon. **Go core + Rust FFI safety** bootstrap (4 phases, 102 tests pass, M1 Max verified 2026-04-14).

## Install

```bash
# Homebrew (recommended)
brew tap longtho638-jpg/mekong
brew install mekong-ide

# Or via curl installer
curl -fsSL https://github.com/longtho638-jpg/mekong-ide-core/releases/latest/download/install.sh | bash
```

Requires Apple Silicon macOS (arm64). Landing: https://ide.mekongmind.com

## Build from Source

```bash
# Build Rust safety lib
./rust_safety/build.sh

# Build Go CLI
make build

# Run all 102 tests (10 packages, race-clean)
make test

# Single-turn chat (auto-routes via Smart Router)
./bin/mekong chat "write a Go HTTP server"
./bin/mekong chat --force-model=qwen "implement binary search"
./bin/mekong --help  # Lists all 7 commands
```

## Architecture at a Glance

```
CLI (Go Cobra)
    ↓
Smart Router (heuristic → Gemma 4 | DeepSeek R1 | Qwen Coder)
    ↓
Agent Pipeline (4-step: Architect → Tools → Reasoning → Audit)
    ↓
Rust FFI Guard (kill-switch, drawdown tracking)
    ↓
MLX Farm (3 local models, 26B + 32B + 7B)
```

## Go CLI (Foundation)

Go 1.22+ CLI for local-first prompt routing. Heuristic Smart Router dispatches to one of three MLX endpoints without any LLM call.

### Smart Router Heuristic

| Prompt type | Model | Port |
|---|---|---|
| Code markers (backtick fences, `write a function`, `implement`, `refactor`) | Qwen2.5-Coder | 4003 |
| Reasoning keywords (`why`, `explain`, `analyze`, `trade-offs`) | DeepSeek R1 | 4002 |
| General queries (default) | Gemma 4 | 4001 |

Override routing: `--force-model=gemma|deepseek|qwen`

**Test Coverage:** 102 tests across 10 Go packages (agents, bootstrap, cashclaw, config, ffi, health, llm, router, tools). All pass with `-race` detector clean on M1 Max (2026-04-14).

### Configuration

Config file: `~/.mekong/config.yaml` (created on first run with defaults).

| Env var | Default | Description |
|---|---|---|
| `LLM_HOST` | `127.0.0.1` | MLX server host |
| `ROUTER_PORT` | `4001` | Gemma 4 port |
| `REASONING_PORT` | `4002` | DeepSeek R1 port |
| `AUDIT_PORT` | `4003` | Qwen Coder port |
| `MAX_CONTEXT_TOKENS` | `8192` | Prompt size cap |

### Package Layout

```
cmd/mekong/main.go          < 50 LOC entry point
internal/
  bootstrap/lifecycle.go    wires all subsystems, calls cobra
  config/config.go          YAML + env var loading (viper)
  router/
    smart_router.go         regex-based heuristic classifier
    endpoints.go            MLX endpoint registry
  llm/client.go             OpenAI-compatible stdlib HTTP client
  health/probe.go           parallel 2s-timeout health probes
  cli/
    root.go                 cobra root + subcommand tree
    chat.go                 `mekong chat` command
    health.go               `mekong health` command
    agent-stub.go           placeholder for Phase 2 agent loop
```

## Rust FFI Safety Layer

`rust_safety/` — CDylib (Mach-O 345KB dylib) integrated via cgo. Provides kill-switch guard for drawdown tracking.

- **libmekong_safety.dylib** — Production dynamic library
- **libmekong_safety.a** — Static archive for embedding
- **guard.h** — C header for cgo FFI
- **9 FFI tests pass** — Drawdown math canonical, kill-switch persistence across reinit

See `docs/system-architecture.md` for data flow.

---

## Architecture

```
┌──────────────────────────────┐
│  CLI User Prompt             │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│  Smart Router (heuristic)     │
│  No LLM call — pick endpoint  │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────────────────────────┐
│  Agent Pipeline (4-step executor)                │
│  ├─ Architect (Gemma 4:4001)                     │
│  ├─ Tool Execution (bash, file, RTK)             │
│  ├─ Reasoning (DeepSeek R1:4002, if complex)     │
│  ├─ Audit (Qwen Coder:4003, if code generated)   │
│  └─ Kill-Switch Check (Rust FFI guard)           │
└────────────┬─────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────┐
│  Rust FFI Safety Guard                            │
│  ├─ Kill-switch state (persistent lock)          │
│  ├─ Drawdown tracking & calculation              │
│  └─ Accessible via: mekong safety status|reset   │
└─────────────────────────────────────────────────┘
```

## 4-Step Pipeline

1. **Architect** (Gemma 4 26B A4B, port 4001): Analyzes prompt, plans structure, decides if tools needed. Native function calling.
2. **Tool Execution**: If architect requests tools, dispatches to MCP servers (vnstock, bash).
3. **Reasoning** (DeepSeek R1 32B, port 4002): Complex logic, code generation, Chain-of-Thought. Skipped for simple queries.
4. **Audit** (Qwen2.5-Coder 7B, port 4003): Security review, clean code validation. Skipped if no code generated.

## Hardware Requirements

- Apple Silicon M1 Max+ with 64GB+ Unified Memory
- ~26GB for 3 models (4-bit quantized)
- ~36GB headroom for OS, IDE, KV cache

## Quick Start

```bash
# 1. Setup environment (first time only)
./scripts/setup-m1max.sh

# 2. Start Engine Farm (3 MLX servers)
./engine-farm/start-farm.sh

# 3. Start vnstock-mcp HTTP server (required for CashClaw)
cd tools/vnstock-mcp && ./start.sh &

# 4. Build Go CLI
make build

# 5. Test
./bin/mekong health
./bin/mekong chat "Hello"
./bin/mekong safety status
```

## Project Structure

```
mekong-ide-core/
├── cmd/mekong/            # Go CLI entry point
│   └── main.go            # Bootstrap CLI
├── internal/              # Go packages
│   ├── bootstrap/         # Lifecycle wiring
│   ├── cli/               # Cobra command tree (chat, health, agent, cashclaw, safety)
│   ├── config/            # YAML + env var loading
│   ├── router/            # Smart Router heuristic (3 models)
│   ├── llm/               # OpenAI-compatible HTTP client
│   ├── health/            # Parallel health probes
│   ├── agents/            # Agent pipeline (architect, tools, reasoner, auditor)
│   ├── tools/             # Bash, file reader, RTK proxy
│   ├── cashclaw/          # CashClaw agent + fair value calculator
│   └── ffi/               # cgo wrapper for Rust safety guard
├── rust_safety/           # Rust FFI safety guard
│   ├── src/lib.rs         # Kill-switch, drawdown math
│   ├── include/           # C header for FFI
│   └── build.sh           # Compile dylib + static archive
├── engine-farm/           # Bash — MLX model management
│   ├── config.env         # Model IDs, ports, params
│   ├── start-farm.sh      # Start 3 servers
│   ├── stop-farm.sh       # Graceful shutdown
│   └── health-check.sh    # Health checks
├── tools/                 # Python — MCP tool servers
│   ├── vnstock-mcp/       # Vietnamese stock data (port 5010)
│   └── kronos-service/    # Time-series forecasting (port 5001)
├── scripts/               # Environment setup
└── docs/                  # Technical documentation
```

## CLI Commands

| Command | Purpose |
|---------|---------|
| `mekong chat PROMPT` | Single-turn chat with smart routing |
| `mekong health` | Check MLX farm health (parallel probes) |
| `mekong agent` | Agent pipeline orchestration [placeholder] |
| `mekong cashclaw` | CashClaw agent (vnstock + fair value) |
| `mekong completion PROMPT` | Shell completion helper |
| `mekong safety status` | Show kill-switch state and log path |
| `mekong safety reset --confirm` | Reset kill-switch after reviewing logs |

## Configuration

All via environment variables (see `engine-farm/config.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| LLM_HOST | 127.0.0.1 | MLX server host |
| ROUTER_PORT | 4001 | Gemma 4 MLX server |
| REASONING_PORT | 4002 | DeepSeek R1 MLX server |
| AUDIT_PORT | 4003 | Qwen Coder MLX server |
| MAX_CONTEXT_TOKENS | 8192 | Context window limit |

## License

Apache 2.0 — Clean IP, all dependencies MIT or Apache 2.0.
