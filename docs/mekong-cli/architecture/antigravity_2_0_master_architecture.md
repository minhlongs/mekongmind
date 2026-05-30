# ANTI-GRAVITY 2.0: HYBRID LOCAL-FIRST ARCHITECTURE
## Principal Systems Design & Production Blueprint

This document defines the production architecture for **Anti-Gravity 2.0**, a terminal-native, hybrid coding-agent runtime optimized for Apple Silicon (M1 Max 64GB unified memory), utilizing local Qwen models (Qwen2.5/3.6-35B-A3B) via `llama.cpp` and official Claude Code CLI escalation logic.

---

## 1. Full Architecture Diagram

The system operates on a zero-dependency, local-first runtime written in Rust (or Go) interacting directly with the local OS, tree-sitter indices, a local SQLite store, and the LLM runtime APIs.

```mermaid
graph TD
    subgraph User Terminal
        UI[Terminal UX: CLI / TUI]
    end

    subgraph Runtime Orchestrator [Rust/Go Engine]
        Core[Agent Loop Core]
        Context[Context Compactor & AST Retriever]
        Router[Router Engine: Token/Latency Aware]
        SysExec[Secure Sandbox Executor]
    end

    subgraph Index & Storage
        TS[Tree-sitter Indexer]
        DB[(SQLite Session/AST DB)]
    end

    subgraph Local Inference [M1 Max 64GB]
        LC[llama.cpp server / Metal]
        Ollama[Ollama / Backup]
    end

    subgraph Cloud Gateway
        Claude[Anthropic Cloud API: Sonnet/Opus]
    end

    UI <=> Core
    Core --> Context
    Core --> Router
    Core --> SysExec
    
    Context --> TS
    Context --> DB
    
    Router --> LC
    Router --> Claude
    
    SysExec --> TS
    SysExec --> DB
```

---

## 2. Runtime Topology

This topology details physical process boundaries, CPU core mapping, memory layout, and unified memory access (UMA) distribution on the Apple Silicon M1 Max (64GB).

```mermaid
graph LR
    subgraph Apple Silicon M1 Max 64GB
        subgraph CPU Cores
            P_Cores[8x Performance Cores: Thread Pool t=8]
            E_Cores[2x Efficiency Cores: OS / CLI overhead]
        end

        subgraph Unified Memory UMA [400 GB/s]
            VRAM[Unified VRAM: ~48GB Reserved for Model Weight Loading]
            RAM[System RAM: ~16GB OS & Runtime Orchestrator]
        end

        subgraph GPU Core Array
            Metal[32-Core GPU: Metal Offloading -ngl 99]
        end
    end

    subgraph Process Boundaries
        CLI[antigravity-cli process]
        LC_Serv[llama.cpp server process]
    end

    CLI -->|IPC / TCP Loopback| LC_Serv
    LC_Serv -->|Metal API| Metal
    LC_Serv -->|Thread Pool| P_Cores
    LC_Serv -->|MMAp Model Load| VRAM
```

---

## 3. Token Flow Diagram

Prompt construction, context compaction, and KV cache reuse loops.

```mermaid
sequenceDiagram
    participant CLI as Orchestrator / CLI
    participant KV as KV Cache (llama.cpp)
    participant Model as Local Model / API

    CLI->>CLI: Gather task, diffs, AST chunks
    CLI->>CLI: Apply Tree-sitter + Diff Compactor
    Note over CLI: Compacted Context fits KV window
    
    CLI->>KV: Request Context Matching (Prefix Caching)
    alt KV Hit (Shared Prefix)
        KV-->>CLI: Reuse KV Cache (Save up to 90% ingestion time)
    else KV Miss
        CLI->>Model: Ingest new system context + file maps
        Model-->>KV: Save new KV state
    end
    
    CLI->>Model: Stream generation request (Temp=0.0, Top_P=0.9)
    Model->>CLI: Token stream output (Chunked SSE)
    Note over CLI: Streaming parsing of patches
```

---

## 4. Memory Pipeline

Anti-Gravity 2.0 avoids bloated conversation histories by employing a multi-tier memory pipeline:

```mermaid
graph TD
    Ephemeral[Ephemeral Tool Caching: Memory map / RAM] --> |Success Diffs| DiffMem[Diff Memory: Track file state mutations]
    DiffMem --> |Session Handoff| SessionSummary[SQLite: Compressed session summary]
    SessionSummary --> |Project Setup| ProjectMem[Project Configuration & Custom Rules]
    
    subgraph Memory Layers
        Ephemeral
        DiffMem
        SessionSummary
        ProjectMem
    end
```

### Memory Retention Policies:
1. **Tool-Result Caching**: Cache result hashes of repetitive terminal commands (`npm run test`, `git status`) for 30 seconds.
2. **Diff Memory**: Keep a rolling patch-history stack to allow rollbacks.
3. **Session Summarization**: Every 5 turns, generate an incremental summary (max 200 tokens) using the local Qwen model. Purge details of resolved tool execution outputs.

---

## 5. Retrieval Pipeline

```mermaid
graph TD
    Query[User Request / Error Output] --> RG[Ripgrep search: Symbol Match]
    Query --> TS[Tree-sitter Query: AST Symbols]
    
    RG --> Filter[AST-based Ranker]
    TS --> Filter
    
    Filter --> Compactor[Context Compactor: Retain only import blocks, class/func headers]
    Compactor --> LLM[System Prompt Construction]
```

---

## 6. Repo Indexing Architecture

To support symbol-level search and local reasoning, Anti-Gravity 2.0 maintains a local database storing high-level AST indices without storing full file contents.

### Indexing Engine:
* **Tooling**: Built on `tree-sitter` (via tree-sitter Rust bindings or Go AST parser) and `ast-grep` CLI.
* **Schema**: Stored in a lightweight SQLite database at `.git/antigravity/index.db`.

### Database Schema (SQLite):
```sql
-- Represents files in the repository
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    last_modified INTEGER NOT NULL,
    hash TEXT NOT NULL
);

-- Represents individual AST symbols (classes, methods, structs)
CREATE TABLE symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER,
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- e.g., 'class', 'function', 'struct', 'interface'
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    signature TEXT NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Index for fast symbol lookup
CREATE INDEX idx_symbol_name ON symbols(name);
CREATE INDEX idx_symbol_kind ON symbols(kind);

-- Represents project dependencies / imports
CREATE TABLE dependencies (
    source_file_id INTEGER,
    target_symbol_name TEXT NOT NULL,
    FOREIGN KEY(source_file_id) REFERENCES files(id) ON DELETE CASCADE
);
```

---

## 7. Agent Loop Pseudocode

Here is the highly optimized agent loop implementation written in Rust-style pseudo-code to ensure low process overhead and zero-bloat state management.

```rust
// src/agent/loop.rs
use std::process::Command;
use crate::router::{RouteEngine, ModelProvider};
use crate::context::{ContextCompactor, ASTIndex};
use crate::terminal::UI;

pub struct AgentLoop {
    router: RouteEngine,
    compactor: ContextCompactor,
    index: ASTIndex,
    session_id: String,
}

impl AgentLoop {
    pub async fn run(&mut self, initial_task: &str) -> Result<(), AgentError> {
        let mut task = initial_task.to_string();
        let mut iteration = 0;
        const MAX_ITERATIONS: usize = 20;

        UI::print_info(&format!("Starting agent loop for session: {}", self.session_id));

        while iteration < MAX_ITERATIONS {
            iteration += 1;
            UI::status_update(format!("Iteration {}/{} - Analyzing state", iteration, MAX_ITERATIONS));

            // 1. Gather & compact context
            let context = self.compactor.gather_active_context(&self.index, &task)?;

            // 2. Select route (Local vs Cloud)
            let route = self.router.determine_route(&task, &context)?;
            UI::print_route(&route);

            // 3. Request LLM generation (Streams text response + structured patches/tools)
            let response = match route.provider {
                ModelProvider::LocalQwen => {
                    self.router.call_local_stream(&context, &task).await?
                }
                ModelProvider::ClaudeCloud => {
                    self.router.call_cloud_stream(&context, &task).await?
                }
            };

            // 4. Parse execution targets (Commands or patches)
            if let Some(tool_call) = response.extract_tool_call() {
                // Interactive Approval Step
                if UI::request_approval(&tool_call)? {
                    let result = self.execute_tool(&tool_call)?;
                    
                    // 5. Observe output & update task diff
                    task = self.evaluate_outcome(&tool_call, &result);
                    if self.is_goal_met(&task) {
                        UI::success("Goal achieved successfully.");
                        break;
                    }
                } else {
                    UI::warn("Tool execution rejected by user. Adjusting course.");
                    task = format!("User rejected tool execution: {}. Adjust parameters.", tool_call.name);
                }
            } else {
                UI::success("Iteration finished with no tool calls. Reviewing output.");
                break;
            }
        }
        Ok(())
    }

    fn execute_tool(&self, call: &ToolCall) -> Result<ToolResult, AgentError> {
        match call.name.as_str() {
            "shell" => {
                let output = Command::new("sh")
                    .arg("-c")
                    .arg(&call.args["command"])
                    .output()?;
                Ok(ToolResult::new(output.status.success(), String::from_utf8_lossy(&output.stdout).to_string()))
            }
            "patch" => {
                // Apply fast line diffs
                let file_path = &call.args["path"];
                let diff_content = &call.args["patch"];
                let apply_status = crate::patcher::apply(file_path, diff_content)?;
                Ok(apply_status)
            }
            _ => Err(AgentError::UnknownTool(call.name.clone()))
        }
    }
}
```

---

## 8. Configuration System

To customize the runtime environment, configure the following production files under `.antigravity/` (or `.gemini/` / `config/`).

### `.env.example`
```bash
# Antigravity Local-First Configuration
PORT=8080
LLM_BASE_URL=http://localhost:8080
LLM_API_KEY=local-no-key-required
LLM_MODEL=Qwen3.6-35B-A3B

# Fallback Cloud Settings
ANTHROPIC_API_KEY=sk-ant-prod-xxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com

# System Settings
WORKSPACE_ROOT=/Users/macbook/mekong-cli
SQLITE_DB_PATH=/Users/macbook/mekong-cli/.git/antigravity/session.db
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
SECURITY_SANDBOX_ENABLED=true
```

### `config.yaml`
```yaml
system:
  startup_timeout_ms: 2000
  default_persistence: "sqlite"
  max_iterations: 15
  temp_dir: ".git/antigravity/tmp"

runtime:
  thread_pool_size: 8
  enable_metal_acceleration: true
  max_kv_cache_tokens: 32768
```

### `routing.yaml`
```yaml
routing:
  default_provider: "local"
  escalation_threshold: 0.85
  max_local_token_budget: 16384
  
  heuristics:
    force_local_keywords:
      - "format"
      - "ripgrep"
      - "ast-grep"
      - "check syntax"
      - "run tests"
      - "git status"
    force_cloud_keywords:
      - "refactor architecture"
      - "audit security"
      - "migrate framework"
      - "reason performance bottleneck"
```

### `models.yaml`
```yaml
models:
  local:
    name: "Qwen3.6-35B-A3B"
    file_path: "models/qwen3.6-35b-instruct-q4_k_m.gguf"
    context_window: 32768
    temperature: 0.0
    top_p: 0.9
  cloud:
    primary: "claude-3-5-sonnet-20241022"
    secondary: "claude-3-opus-20240229"
    context_window: 200000
    temperature: 0.0
```

### `tools.yaml`
```yaml
tools:
  shell:
    enabled: true
    sandbox: "bubblewrap" # Linux / macOS native sandbox
    timeout_ms: 30000
    approval_required: true
  patch:
    enabled: true
    engine: "ast-grep"
    approval_required: false
  ripgrep:
    enabled: true
    binary_path: "rg"
    approval_required: false
```

### `memory.yaml`
```yaml
memory:
  max_session_summaries: 10
  vector_store:
    enabled: false # Disabled to prevent vector-db bloat
  sqlite:
    vacuum_on_start: true
    journal_mode: "WAL"
```

---

## 9. Docker Setup

To orchestrate the local inference container safely alongside the development workspace, use this minimalist Docker configuration.

### `Dockerfile`
```dockerfile
FROM alpine:3.18 AS builder
RUN apk add --no-cache git build-base cmake clang-dev libstdc++

# Clone and compile llama.cpp with CPU features (Apple Silicon runs natively, Docker used as sandbox fallback)
WORKDIR /app
RUN git clone https://github.com/ggerganov/llama.cpp.git && \
    cd llama.cpp && \
    mkdir build && \
    cd build && \
    cmake .. -DLLAMA_AVX2=ON && \
    cmake --build . --config Release

FROM alpine:3.18
RUN apk add --no-cache libstdc++ libgcc bash curl sqlite
COPY --from=builder /app/llama.cpp/build/bin/llama-server /usr/local/bin/llama-server

WORKDIR /workspace
EXPOSE 8080
ENTRYPOINT ["llama-server"]
```

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  llama-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models
      - ./.git/antigravity:/workspace/.git/antigravity
    command: >
      -m /models/qwen3.6-35b-instruct-q4_k_m.gguf
      -c 32768
      -b 512
      --host 0.0.0.0
      --port 8080
      --threads 8
    deploy:
      resources:
        reservations:
          devices:
            - driver: cpu
              count: all
    restart: unless-stopped
```

---

## 10. llama.cpp Launch Scripts

For bare-metal compilation and execution on Apple Silicon (M1 Max macOS), execute this launch script to guarantee hardware acceleration (Metal backend).

### `scripts/launch-llama.sh`
```bash
#!/usr/bin/env bash

set -euo pipefail

# Configurations for M1 Max 64GB
MODEL_PATH="/Users/macbook/mekong-cli/models/qwen3.6-35b-instruct-q4_k_m.gguf"
CONTEXT_SIZE=32768
BATCH_SIZE=512
THREADS=8 # Matches Performance Cores on M1 Max
PORT=8080

echo "=== System Check ==="
sysctl -n machdep.cpu.brand_string
echo "Unified Memory Allocation:"
vm_stat | perl -ne 'destroy; if (/(.*?)\s*:\s*(\d+)\./) { printf "%-30s %10.2f MB\n", $1, $2*4096/1024/1024; }'

if [ ! -f "$MODEL_PATH" ]; then
    echo "Error: Model not found at $MODEL_PATH"
    echo "Please download Qwen3.6-35B-A3B Instruct model in GGUF format."
    exit 1
fi

echo "=== Launching llama.cpp Server with Metal Acceleration ==="
# -ngl 99 ensures all layers of the 35B model are offloaded to Apple Silicon Metal GPU
exec llama-server \
    --model "$MODEL_PATH" \
    --ctx-size "$CONTEXT_SIZE" \
    --batch-size "$BATCH_SIZE" \
    --threads "$THREADS" \
    --n-gpu-layers 99 \
    --port "$PORT" \
    --host 127.0.0.1 \
    --cont-batching \
    --flash-attn \
    --no-mmap
```

---

## 11. Claude Code Integration Examples

To wire the official Anthropic Claude Code CLI to use the local router when handling basic execution tasks:

### Running Claude Code with Local Routing Endpoint:
```bash
# 1. Start your local routing proxy (which implements the Anthropic SDK specification)
# 2. Redirect CLI API traffic to local routing engine
export ANTHROPIC_BASE_URL=http://localhost:8080/v1
export ANTHROPIC_MODEL=Qwen3.6-35B-A3B
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# Execute a fast patch loop locally
claude "fix the syntax error in mekong/core/executor.py"
```

### Scripting the Pipeline:
```bash
#!/usr/bin/env bash
# scripts/run-claude-hybrid.sh

set -e

TASK="$1"

# Heuristic router directly in bash for minimal latency
if [[ "$TASK" =~ (refactor|architecture|design|rewrite) ]]; then
  echo "Reasoning task detected. Routing directly to Claude Cloud..."
  unset ANTHROPIC_BASE_URL
  export ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
else
  echo "Local-first task detected. Routing to llama.cpp..."
  export ANTHROPIC_BASE_URL="http://localhost:8080/v1"
  export ANTHROPIC_MODEL="Qwen3.6-35B-A3B"
fi

claude "$TASK"
```

---

## 12. Local Model Routing Logic

The routing engine classifies queries to avoid wasting expensive cloud context.

```python
# src/router/engine.py
import re
from typing import Dict, Any

class RoutingEngine:
    def __init__(self, routing_config: Dict[str, Any]):
        self.config = routing_config
        self.local_keywords = self.config.get("heuristics", {}).get("force_local_keywords", [])
        self.cloud_keywords = self.config.get("heuristics", {}).get("force_cloud_keywords", [])
        self.escalation_threshold = self.config.get("escalation_threshold", 0.85)

    def determine_route(self, task: str, context_summary: str) -> str:
        # Step 1: Check force heuristics first
        for keyword in self.cloud_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', task, re.IGNORECASE):
                return "CLAUDE_CLOUD"

        for keyword in self.local_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', task, re.IGNORECASE):
                return "LOCAL_QWEN"

        # Step 2: Context Token Budget Calculation
        estimated_tokens = len(task.split()) + len(context_summary.split())
        if estimated_tokens > self.config.get("max_local_token_budget", 16384):
            return "CLAUDE_CLOUD" # Local KV context overflow

        # Step 3: Run quick confidence classification using Local Qwen
        # returns confidence score [0.0 - 1.0] for handling the task locally
        confidence = self._evaluate_local_confidence(task)
        if confidence < self.escalation_threshold:
            return "CLAUDE_CLOUD"

        return "LOCAL_QWEN"

    def _evaluate_local_confidence(self, task: str) -> float:
        # Lightweight classification check (runs in < 150ms on M1 Max)
        # Mock score for implementation:
        if len(task) < 100:
            return 0.90
        return 0.75
```

---

## 13. Session Persistence Design

Anti-Gravity 2.0 maintains system state using a single-file SQLite database located in the repo's `.git/antigravity/session.db`.

```sql
-- Represents persistent workspace sessions
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    current_branch TEXT NOT NULL,
    last_active_at INTEGER NOT NULL
);

-- Keeps the chronological transaction log of modifications
CREATE TABLE session_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    iteration_step INTEGER NOT NULL,
    task_description TEXT NOT NULL,
    route_choice TEXT NOT NULL,
    execution_outcome TEXT NOT NULL,
    patch_applied TEXT,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- Keeps the active KV state mapping metadata
CREATE TABLE kv_cache_registry (
    key TEXT PRIMARY KEY,
    last_accessed INTEGER NOT NULL,
    token_count INTEGER NOT NULL,
    content_hash TEXT NOT NULL
);
```

---

## 14. Performance Optimization Checklist

* [ ] **Unified Memory Allocation**: Allocate exactly `-ngl 99` inside the llama.cpp server configuration to prevent CPU offloading bottlenecks.
* [ ] **Flash Attention Enabled**: Launch with `--flash-attn` to cut attention space computation in half.
* [ ] **MMAp Pre-Loading Disable**: Use `--no-mmap` to load weights strictly into physical RAM to guarantee instant inference loops.
* [ ] **Tree-sitter Indexing Truncation**: Run index updates in background git-hooks; limit symbol parsing depth to class/method headers.
* [ ] **Context Window Limit**: Force local Qwen context window ceiling at `32768` to maintain steady token generation speed (t/s).

---

## 15. M1 Max Optimization Guide

To extract maximum performance from the M1 Max (64GB Unified Memory model):

| Attribute | M1 Max Profile | Optimization Target | Configuration / Value |
|---|---|---|---|
| **Thread Count** | 8 Perf, 2 Cores | Avoid CPU core context switching | `-t 8` |
| **VRAM Buffer** | 64GB UMA | Maximize Local 35B Execution | Allocate 48GB Max |
| **Batch Size** | 400 GB/s Memory Bandwidth | Speed up prompt processing | `-b 512` |
| **Metal GPU** | 32 Core GPU | Compute Unified Shaders | `--n-gpu-layers 99` |

### Prevention of Thermal Throttling:
M1 Max stays quiet under default runs, but prolonged local training/inference runs can heat up. Use local fan controller utilities (`m1-cooler.sh`) or run llama.cpp at lower batch sizes if system temperature exceeds 85°C.

---

## 16. Failure Recovery Strategy

```mermaid
graph TD
    A[Inference Error / Connection Loss] --> B{Retry Counter < 3?}
    B -->|Yes| C[Re-initialize llama.cpp server]
    B -->|No| D{Claude API Key Available?}
    D -->|Yes| E[Escalate to Claude Cloud fallback]
    D -->|No| F[Halt execution & Output Safe Mode terminal error]
```

### Handling KV Cache Overflow:
When a local task context overflows `32768` tokens, the orchestrator triggers an automatic semantic summarization run. It truncates standard shell tool outputs in the context by retaining only the first and last 20 lines of the output logs.

---

## 17. Logging Strategy

Anti-Gravity 2.0 uses structured JSON logging strictly piped to `stderr` or a localized log file (`.git/antigravity/logs/agent.log`), leaving `stdout` clean for CLI pipes and output capture.

```json
{"timestamp": 1779951600, "level": "INFO", "component": "Orchestrator", "message": "Starting prompt execution", "session_id": "sess_89f0a2"}
{"timestamp": 1779951601, "level": "DEBUG", "component": "Router", "selected_route": "LOCAL_QWEN", "confidence_score": 0.88}
{"timestamp": 1779951603, "level": "WARNING", "component": "Patcher", "message": "Failed code application at line 142. Executing rollback.", "file": "src/api/auth.rs"}
```

---

## 18. Observability Design

The runtime tracks three core metrics:
1. **Time-To-First-Token (TTFT)**: Targets `< 300ms` for local runs.
2. **Generation Rate**: Targets `> 25 tokens/sec` for Qwen-35B on Metal.
3. **Task Completion Ratio**: Percentage of iterations resolving without human intervention.

---

## 19. Benchmark Methodology

To run system validation:
```bash
# Evaluate time to first token and tokens/sec for Qwen 35B
llama-bench \
    -m /Users/macbook/mekong-cli/models/qwen3.6-35b-instruct-q4_k_m.gguf \
    -p 512 -n 128 -t 8 -ngl 99
```

---

## 20. Production Deployment Structure

Deploy the following layout inside the root repository directory:

```bash
/Users/macbook/mekong-cli
├── .antigravity/
│   ├── config.yaml          # System configurations
│   ├── routing.yaml         # Route configurations
│   ├── models.yaml          # Model configuration file
│   ├── tools.yaml           # Executable tool setups
│   └── memory.yaml          # Memory buffer setups
├── docs/
│   └── architecture/
│       └── antigravity_2_0_master_architecture.md  # System Architecture doc
└── scripts/
    ├── launch-llama.sh      # llama.cpp server configuration shell execution script
    └── run-claude-hybrid.sh # Hybrid router run wrapper for Claude Code CLI
```
