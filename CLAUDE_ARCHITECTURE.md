# me-deep-wrapper — Claude Code CLI Integration Architecture

## 1. Tổng quan

MEKONG wrapper là solo company orchestrator với:
- 58 unified agents (Mekong CLI + ClaudeKit merged)
- 10 departments có SOP gates và evidence contracts
- `state/` memory, `sops/departments/`, `orchestrator/` pattern

Claude Code CLI (mặc định dùng Claude Sonnet/Opus qua CLI) cần được tích hợp vào hệ thống này như **Engineering Factory Engine** — chịu trách nhiệm thực thi các SOP gates của engineering-factory, quality-compliance, platform-operations departments.

## 2. Kiến trúc phân lớp

```
┌─────────────────────────────────────────────────────────────┐
│                    MEKONG wrapper CLI                        │
│         /usr/local/bin/me (universal dispatch)              │
├─────────────────────────────────────────────────────────────┤
│  Orchestrator: Solo Company Loop                           │
│  ├── CEO Command → Market Intelligence → Product Strategy   │
│  └── Engineering Factory ← Quality Compliance               │
│       ← Platform Operations                                 │
├─────────────────────────────────────────────────────────────┤
│                 Claude Code CLI Integration                  │
│                                                             │
│  .claude/                                                   │
│  ├── settings.json    # Auto mode, max_parallel=3           │
│  ├── CLAUDE.md        # Project context (agent instructions) │
│  ├── rules/             # Workflow rules                    │
│  │   ├── primary-workflow.md   # Main pipeline            │
│  │   ├── development-rules.md    # Code standards          │
│  │   └── orchestration-protocol.md # Multi-agent rules     │
│  └── hooks/               # Git pre-commit / post-checkout │
│       ├── claude-code-review.sh  # Auto code review        │
│       └── claude-deploy-prep.sh  # Pre-deploy checklist    │
├─────────────────────────────────────────────────────────────┤
│         MEKONG State Layer (shared disk)                     │
│  ├── state/gates/           # SOP gate artifacts            │
│  ├── state/departments/   # Department run ledger          │
│  └── state/products/evidence/ # Product proof artifacts     │
├─────────────────────────────────────────────────────────────┤
│         mvp/ (Next.js project — Claude Code target)         │
│         sops/    (department SOPs — input for Claude)       │
│         agents/  (registry.json — agent mapping)            │
└─────────────────────────────────────────────────────────────┘
```

## 3. Claude Code CLI — Agent Mapping

Mỗi department trong MEKONG mind có thể map sang Claude Code capability:

| Department | Claude Code Role | Input | Output Artifact |
|---|---|---|---|
| engineering-factory | `claude code -- "Build feature X"` | SOP file + state gate | source code, tests |
| quality-compliance | `claude review` / pre-commit hook | PR diff or branch | review report JSON |
| platform-operations | `claude ops deploy` / hooks | mvp/ build output | deploy manifest |

## 4. Tích hợp kỹ thuật

### 4a. CLAUDE.md — Central Agent Instruction File

File này Claude Code CLI sẽ đọc khi làm việc trong repo:
- Define project context, architecture rules, tech stack
- Link back to SOP gates và evidence contracts
- Mỗi agent role được define với input/output contract

### 4b. .claude/rules/ — Workflow Automation

Tạo các rule files để Claude Code CLI tự động áp dụng khi:
- `primary-workflow.md`: Quy trình code → test → review → deploy
- `development-rules.md`: Coding standards (YAGNI, KISS, DRY)
- `orchestration-protocol.md`: Rules cho multi-agent coordination

### 4c. .claude/hooks/ — Git Hooks Integration

Pre-commit hook tự động gọi Claude Code để:
- Review code changes trước khi commit
- Generate documentation cho mỗi change
- Update state/gates nếu cần

## 5. Data Flow

```
user input (idea/goal)
    │
    ▼
me <cli> <command> → mekong mind CLI → resolve agent via registry.json
    │
    ▼
Claude Code CLI receives task
    │  .claude/CLAUDE.md provides context
    │  .claude/rules/ provide workflow
    └──► Executes in mvp/ directory
         │
         ├── source code written to mvp/
         ├── tests generated + run
         └── artifact produced → state/gates/<gate>.json

state/gate passes evidence contract validation
    │
    ▼
Next department SOP triggered (via mekong mind loop)
```

## 6. Tối ưu hóa performance

Với M1 Max 64GB:
- Claude Code CLI chạy local-first qua Ollama (qwen3.6:35b ~20GB) hoặc remote via API
- `max_parallel=3` để không overheat CPU
- Pre-commit hooks chỉ trigger trên files thay đổi, không scan toàn bộ repo

## 7. File Structure hoàn chỉnh

```
/Users/macbook/Documents/me-deep-wrapper/
├── .claude/
│   ├── settings.json          # Auto mode config (đã tạo)
│   ├── CLAUDE.md              # Main agent instructions (cần tạo)
│   ├── rules/                 # Workflow rules (cần tạo)
│   │   ├── primary-workflow.md
│   │   ├── development-rules.md  
│   │   └── orchestration-protocol.md
│   └── hooks/                 # Git automation (optional)
│       ├── claude-code-review.sh
│       └── claude-deploy-prep.sh
├── .claudekit/                # ClaudeKit config (nếu cần)
│   ├── agents.json            # Agent role definitions
│   └── prompts/               # Prompt templates
├── state/                     # MEKONG memory (đã có)
│   ├── gates/                 # SOP gate evidence
│   ├── departments/           # Run ledger
│   └── products/evidence/     # Product proof artifacts
├── sops/                      # SOP definitions (đã có)
│   ├── departments/           # Per-department SOPs
│   └── *.md                   # Cross-cutting SOPs
└── mvp/                       # Next.js project target
```

## 8. Integration Points quan trọng

1. **Agent Registry + CLAUDE.md**: Mỗi agent trong registry.json cần một "Claude Code Prompt Template" — cách transform command → Claude Code CLI call
2. **SOP Gates + Evidence**: Claude Code outputs phải validate against department evidence contracts (JSON schema)
3. **Orchestrator Loop**: MEKONG wrapper loop có thể trigger Claude Code CLI commands thông qua `me claudekit` bridge

## 9. Pitfalls cần tránh

- Không để Claude Code CLI tự động modify state/ mà không pass gate validation
- Tránh parallel quá 3 tasks trên M1 Max — dễ OOM khi kết hợp với node_modules
- Mỗi Claude Code session cần clear context, không reuse state từ session trước
- Evidence contracts phải be deterministic — same input → same output structure
