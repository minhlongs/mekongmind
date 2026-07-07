# Hermes Agent → MEKONG SOP Deep Mapping

> **Mục tiêu:** Ánh xạ toàn bộ kiến trúc Hermes Agent (NousResearch) vào SOPs tự trị của MEKONG, đảm bảo không gãy workflow hiện tại.
> **Nguồn:** `~/.hermes/hermes-agent/` (local clone, read-only reference)
> **Cập nhật:** 2026-06-04

---

## 1. Tổng quan Kiến trúc

### 1.1 Hermes Agent — Core Components

```
hermes-agent/
├── agent/
│   ├── conversation_loop.py    # ~4836 dòng — Vòng lặp chính (monolithic)
│   ├── agent_init.py           # ~1657 dòng — Khởi tạo agent (60+ params)
│   ├── curator.py              # ~1843 dòng — Tự bảo trì skills (idle-triggered)
│   ├── context_compressor.py   # ~2078 dòng — Nén context window
│   ├── credential_pool.py      # ~2183 dòng — Quản lý credential rotation
│   ├── tool_guardrails.py      #  ~475 dòng — Vòng lặp tool-call guard
│   ├── memory_manager.py       #  ~653 dòng — Streaming context scrubber
│   ├── error_classifier.py     #    — Phân loại lỗi có cấu trúc (21+ FailoverReason)
│   ├── iteration_budget.py     #   ~63 dòng — Đếm iteration (consume/refund)
│   └── ...
├── acp_adapter/
│   └── session.py              #  ~628 dòng — ACP session persistence
└── config.yaml                 # Cấu hình tập trung (14 personalities, compression, memory)
```

### 1.2 MEKONG — Current Architecture

```
User → me CLI → mekong CLI → Agent Registry → Claude Code CLI → state/artifacts
                                    │
                                    ├── .claude/hooks/ (SessionStart, PostToolUse, PreToolUse)
                                    ├── .claude/settings.json (hook config v2.0.0)
                                    ├── lib/goal-executor.sh (progress-aware goal selection)
                                    ├── bin/me (CLI entry with context injection)
                                    └── state/
                                        ├── gates/goal-*.json (evidence contracts)
                                        ├── evidence/*.json (per-gate evidence)
                                        └── goal-*.md (human-readable goals)
```

---

## 2. ÁNH XẠ CHI TIẾT — Component by Component

### 2.1 `conversation_loop.py` → MEKONG Core Loop

| Hermes Feature | Mô tả | MEKONG Mapping | SOP Location |
|---|---|---|---|
| `run_conversation()` monolithic | Vòng lặp lớn xử lý toàn bộ lifecycle | `lib/goal-executor.sh` + `bin/me` orchestration | `lib/goal-executor.sh` |
| Context compression preflight | Nén context TRƯỚC khi vào main loop | `--append-system-prompt` injection trong `bin/me` | `bin/me:build_claude_context()` |
| Plugin hooks (pre_llm_call) | Hook chạy trước mỗi LLM call | `.claude/hooks/session-intel.sh` (SessionStart) | `.claude/settings.json` |
| Session DB persistence | Lưu session vào SQLite qua `_persist_session()` | `state/gates/goal-*.json` + `state/evidence/*.json` | `state/` hierarchy |
| Retry với jittered backoff | Exponential backoff (5s base, 120s cap) | `PostToolUse` hook retry pattern | `.claude/hooks/post-write-check.sh` |
| Multi-provider error recovery | Fallback chain: credential pool → eager fallback → abort | `me solo next` gate fallback logic | `lib/goal-executor.sh` |
| Unicode/surrogate sanitization | Bounded retry passes cho invalid unicode | `state/evidence` JSON validation | `lib/goal-executor.sh` |
| Image rejection recovery | Strip images, downgrade to text-only | Evidence file format downgrade | `state/evidence/*.json` |
| Thinking-block signature recovery | Strip `reasoning_details` on 400 | Goal file trailing content cleanup | `lib/goal-executor.sh` |
| Truncation continuation retries | 3 attempts, boost output tokens | `state/stale-goals-backup/` rotation | `lib/goal-executor.sh` |
| Prompt caching (Anthropic) | `cache_control` breakpoints | MEKONG context caching via `--append-system-prompt` | `bin/me` |
| Iteration budget | 90 default, refund cho `execute_code` | Gate progression budget (9 gates max) | `state/gates/goal-*.json` |

**Mapping Pattern:**
```
Hermes: conversation_loop.run_conversation()
  ├── context_compression_preflight()
  ├── plugin_hooks.invoke("pre_llm_call")
  ├── main_loop:
  │   ├── api_call() → error_classifier.classify()
  │   ├── retry/fallback/compress
  │   ├── tool_execution → tool_guardrails.check()
  │   └── session_persist()
  └── return {messages, completed, error}

MEKONG: bin/me run_claude()
  ├── build_claude_context() ← compression preflight
  ├── SessionStart hook → session-intel.sh
  ├── main_loop:
  │   ├── Claude Code execution → exit code check
  │   ├── PostToolUse hook → post-write-check.sh retry
  │   ├── PreToolUse hook → pre-push-check.sh guard
  │   └── goal-executor.sh → progress-aware selection
  └── return {status, goal_file}
```

### 2.2 `curator.py` → MEKONG Goal Maintenance

| Hermes Feature | Mô tả | MEKONG Mapping |
|---|---|---|
| Idle-triggered (no cron) | Chỉ chạy khi agent idle > 2h, last run > 7 ngày | `state/stale-goals-backup/` cleanup — manual/idle trigger |
| Auto-transition lifecycle | active → stale (30d) → archived (90d) | Goal file rotation: active `.md` → `.json` → backup/ |
| Pinned skills bypass | Không bao giờ auto-delete pinned | `state/gates/goal-*.json` (gate files never auto-cleaned) |
| Archive recoverable | `.archive/` directory, không delete | `state/stale-goals-backup/` — có thể restore |
| Forked AIAgent review | Spawn agent riêng để review skills | `me solo next` — spawn agent riêng cho mỗi gate |
| Dry-run mode | Preview trước khi mutate | `me solo gate show` — xem trước không mutate |

### 2.3 `context_compressor.py` → MEKONG Context Management

| Hermes Feature | Mô tả | MEKONG Mapping |
|---|---|---|
| `compress_context()` | Nén messages, giữ system + recent | `build_claude_context()` — selective context injection |
| `protect_first_n/last_n` | Giữ N messages đầu/cuối | Evidence contracts — luôn giữ gate state |
| `target_ratio: 0.2` | Nén về 20% kích thước | SessionStart hook — chỉ show essential intel |
| `threshold: 0.5` | Trigger khi >50% context | `.claude/hooks/post-write-check.sh` — type check gate |
| `should_compress()` | Check trước khi compress | `me solo status` — check trước khi escalate |
| Provider-aware | Llama.cpp, Anthropic, OpenAI strategies | Multi-provider: Claude Code + Ollama fallback |

### 2.4 `tool_guardrails.py` → MEKONG Quality Gates

| Hermes Feature | Mô tả | MEKONG Mapping |
|---|---|---|
| `exact_failure_warn_after: 2` | Cảnh báo sau 2 lần fail cùng tool | `PostToolUse` hook — warn sau 2 lint fail |
| `same_tool_failure_halt_after: 8` | Dừng sau 8 lần fail cùng tool | `pre-push-check.sh` — block push nếu tests fail |
| `idempotent_no_progress_warn_after: 2` | Cảnh báo tool lặp không tiến triển | Evidence gap detection — warn nếu gate stuck |
| `hard_stop_enabled` | Circuit breaker (opt-in) | `me solo next` gate lock — chặn gate skip |
| `MUTATING_TOOL_NAMES` | Phân loại read-only vs mutating | `Write(mvp/**/*.ts)` → post-write-check pattern |

### 2.5 `error_classifier.py` → MEKONG Error Recovery

| Hermes `FailoverReason` | Recovery Strategy | MEKONG Equivalent |
|---|---|---|
| `auth` (401/403) | Refresh/rotate credential | `hermes auth` → re-auth flow |
| `billing` (402) | Rotate immediately, abort if exhausted | Gate evidence gap → `me solo next` fallback gate |
| `rate_limit` (429) | Jittered backoff → rotate → fallback | `post-write-check.sh` retry with delay |
| `overloaded` (503/529) | Backoff, retry | Claude Code restart với backoff |
| `context_overflow` | Compress, not failover | `build_claude_context()` compression |
| `content_policy_blocked` | Rephrase or fallback provider | Gate redefinition if blocked |
| `thinking_signature` | Strip reasoning_details | Trailing content cleanup in goal files |
| `llama_cpp_grammar_pattern` | Strip pattern/format from tools | Skip unsupported gate requirements |

### 2.6 `iteration_budget.py` → MEKONG Gate Budget

| Hermes | MEKONG |
|---|---|
| Parent: 90 iterations max | 9 gates × ~10 steps = 90 max actions |
| Subagent: 50 iterations | Per-gate execution budget |
| `execute_code` refunded | `mvp/**/*.ts` write → no budget cost (automated) |
| Thread-safe consume/refund | Atomic gate state transitions |

### 2.7 `credential_pool.py` → MEKONG Provider Fallback

| Hermes | MEKONG |
|---|---|
| Rotate credentials on auth/billing failure | Fallback gate selection (`me solo next`) |
| Pool exhaustion detection | All gates passed detection |
| Per-slot overrides | Per-provider model routing |

### 2.8 `memory_manager.py` → MEKONG Session Memory

| Hermes Feature | Mô tả | MEKONG Mapping |
|---|---|---|
| `prefetch_all(user_message)` | Load relevant memory trước mỗi turn | `session-intel.sh` — load best goal + gate status |
| `sync_all()` | Lưu memory sau mỗi turn | Goal state persistence sau mỗi `me solo` |
| `StreamingContextScrubber` | Filter memory-context tags khỏi stream output | Evidence JSON sanitization |
| `nudge_interval: 10` | Nhắc nhở sau 10 turns | Gate progress nudge mỗi session |

### 2.9 `config.yaml` → MEKONG Configuration

| Hermes Config | Giá trị Default | MEKONG Equivalent |
|---|---|---|
| `agent.max_turns: 60` | 60 turns | `.claude/settings.json` session config |
| `compression.enabled: true` | true | `post-write-check.sh` compression check |
| `compression.target_ratio: 0.2` | 20% | Evidence file size limit |
| `delegation.max_iterations: 50` | 50 | Per-gate sub-task budget |
| `memory.nudge_interval: 10` | 10 turns | Gate reminder interval |
| `memory.user_char_limit: 1375` | 1375 chars | Goal file description length |
| `terminal.backend: local` | local | `bin/me` execution backend |
| `tool_loop_guardrails.hard_stop_after.exact_failure: 5` | 5 | Pre-push check max failures |
| `skills.creation_nudge_interval: 15` | 15 turns | SOP creation interval |
| `prompt_caching.cache_ttl: 5m` | 5 minutes | SessionStart hook cache |

---

## 3. INTEGRATION POINTS — Không Gãy

### 3.1 Hook System Mapping

```
Hermes Plugin Hooks          →    MEKONG Hook System
─────────────────────────────────────────────────────
on_session_start              →    .claude/hooks/session-intel.sh
  (load soul, memory, skills)      (show best goal, gate status, evidence gaps)

pre_llm_call                 →    .claude/settings.json permissions
  (inject context before LLM)      (state/evidence read permission)

pre_api_request              →    .claude/hooks/pre-push-check.sh
  (modify API request)             (validate before git push)

post_api_request             →    .claude/hooks/post-write-check.sh
  (log API call)                   (validate after Write to mvp/)

on_tool_result               →    lib/goal-executor.sh progress check
  (process tool output)            (update gate status)
```

### 3.2 Error Recovery Mapping

```
Hermes Error Recovery                    →    MEKONG Recovery
─────────────────────────────────────────────────────────────────
Credential pool rotation (401/402)       →    Fallback gate selection
Eager fallback on rate limit (429)       →    me solo next → alternate gate
Context compression (context overflow)   →    build_claude_context() trim
Unicode sanitization (retry 3x)         →    JSON evidence validation
Image rejection (strip + retry)          →    Evidence format downgrade
Thinking signature recovery              →    Trailing content cleanup
Truncation continuation (3x)            →    Goal file truncate fix
Empty response recovery (3 strategies)   →    Gate state recovery
```

### 3.3 Session Persistence Mapping

```
Hermes Session Persistence               →    MEKONG State Persistence
─────────────────────────────────────────────────────────────────
SQLite via _persist_session()            →    state/gates/goal-*.json
ACP adapter (session.py)                 →    state/evidence/*.json
Session DB (FTS5 search)                 →    Python scripts in lib/
Streaming context scrubber               →    JSON field sanitization
```

---

## 4. SOP MỚI ĐỀ XUẤT — Tích hợp Hermes Patterns

### 4.1 SOP: Goal Curator (từ curator.py)

**File đề xuất:** `.claude/skills/workflow/references/goal-curator.md`

**Pattern từ Hermes curator.py:**
- Idle-triggered: chỉ chạy khi không có active gate
- Auto-transition: active → stale → archived
- Never auto-delete: chỉ archive vào `state/stale-goals-backup/`
- Dry-run first: preview trước khi mutate

**Logic chính:**
```bash
# Chạy khi: không có gate "active", last cleanup > 7 ngày
REPO="/Users/macbook/Documents/me-deep-wrapper"

# Gate 1: Có gate active không?
ACTIVE=$(python3 -c "
import glob,json
for f in sorted(glob.glob('state/gates/goal-*.json')):
    d=json.load(open(f))
    if any(g.get('status')=='active' for g in d.get('gates',[])):
        print('yes'); break
" 2>/dev/null)
[ "$ACTIVE" = "yes" ] && exit 0

# Gate 2: Interval check (7 ngày, Hermes default)
LAST_CLEANUP=$(stat -f "%m" state/stale-goals-backup/.last_cleanup 2>/dev/null || echo 0)
NOW=$(date +%s)
DAYS=$(( (NOW - LAST_CLEANUP) / 86400 ))
[ "$DAYS" -lt 7 ] && exit 0

# Dry-run: liệt kê goals để archive
python3 -c "
import glob, json, os
from datetime import datetime, timedelta

stale_cutoff = datetime.now() - timedelta(days=30)
archive_cutoff = datetime.now() - timedelta(days=90)

for jf in sorted(glob.glob('state/gates/goal-*.json')):
    d = json.load(open(jf))
    mtime = datetime.fromtimestamp(os.path.getmtime(jf))
    if mtime < archive_cutoff:
        print(f'ARCHIVE: {os.path.basename(jf)}')
    elif mtime < stale_cutoff:
        print(f'STALE: {os.path.basename(jf)}')
" 2>/dev/null

touch state/stale-goals-backup/.last_cleanup
```

### 4.2 SOP: Error Recovery Chain (từ conversation_loop.py)

**File đề xuất:** `.claude/skills/workflow/references/error-recovery.md`

**Retry Hierarchy (giữ nguyên thứ tự Hermes):**
1. Local validation fix (JSON parse, trailing content)
2. Credential/credential pool rotation → fallback gate
3. Eager fallback (rate limit / billing exhausted)
4. Context compression (context overflow)
5. Provider-specific recovery (Anthropic 401 refresh, etc.)
6. Jittered backoff (5s base, 120s cap)
7. Session persistence + abort

### 4.3 SOP: Context Injection (từ agent_init.py + conversation_loop.py)

**File đề xuất:** `.claude/skills/workflow/references/context-injection.md`

**Hermes: 60+ params → MEKONG: selective context**
Hermes injects vào mỗi turn:
- Soul/personality → MEKONG: goal state (trạng thái hiện tại)
- Memory prefetch → MEKONG: evidence contracts
- Skill hints → MEKONG: SOP references
- Tool schemas → MEKONG: gate validation rules

### 4.4 SOP: Tool Guardrails (từ tool_guardrails.py)

**File đề xuất:** `.claude/skills/workflow/references/tool-guardrails.md`

```json
{
  "tool_loop_guardrails": {
    "warn_after": {
      "exact_failure": 2,
      "same_tool_failure": 3,
      "idempotent_no_progress": 2
    },
    "hard_stop_after": {
      "exact_failure": 5,
      "same_tool_failure": 8,
      "idempotent_no_progress": 5
    },
    "warnings_enabled": true,
    "hard_stop_enabled": false
  }
}
```

---

## 5. SAFEGUARDS — Đảm bảo không gãy

### 5.1 Isolation Boundaries

```
HERMES (read-only source)          MEKONG (write target)
─────────────────────────          ─────────────────────
~/.hermes/hermes-agent/            ~/Documents/me-deep-wrapper/
  ├── agent/ (read only)              ├── .claude/ (hooks, settings)
  ├── config.yaml (read ref)          ├── lib/ (goal-executor.sh)
  ├── acp_adapter/ (read ref)         ├── bin/ (me CLI)
  └── skills/ (read ref)              └── state/ (evidence, gates)
```

### 5.2 Non-Breaking Integration Rules

1. **Không modify Hermes source** — Chỉ đọc tham khảo
2. **MEKONG hooks là additive** — `.claude/settings.json` chỉ thêm hooks, không xóa
3. **State files có backup** — `state/stale-goals-backup/` trước mọi cleanup
4. **Graceful degradation** — Nếu hook fail, CLI vẫn chạy
5. **Evidence contracts immutable** — Gate state chỉ append, không overwrite
6. **Goal file atomic** — Write to tmp, mv vào place (no partial writes)

### 5.3 Testing Strategy

```bash
# 1. Verify hooks don't break CLI
me solo status                    # Baseline
me solo gate show                 # Baseline
me solo next                      # Should work without hooks

# 2. Test hook chain
.claude/hooks/session-intel.sh    # Dry run
.claude/hooks/post-write-check.sh # Test with sample file
.claude/hooks/pre-push-check.sh   # Test with clean state

# 3. Verify state integrity
python3 -c "import json; json.load(open('state/gates/goal-*.json'))"  # All valid
```

---

## 6. IMPLEMENTATION PLAN

### Phase 1: SOP Files
- [x] `HERMES-MEKONG-MAP.md` — Master mapping document (this file)
- [ ] `goal-curator.md` — Idle-triggered goal maintenance
- [ ] `error-recovery.md` — Retry hierarchy từ Hermes
- [ ] `context-injection.md` — Selective context loading
- [ ] `tool-guardrails.md` — Quality gate thresholds

### Phase 2: Script Integration
- [ ] `lib/goal-curator.sh` — Implementation của goal-curator SOP
- [ ] `lib/error-recovery.sh` — Error classification wrapper
- [ ] Update `lib/goal-executor.sh` — Add Hermes-style retry logic

### Phase 3: Hook Enhancement
- [ ] SessionStart → Add Hermes-style memory prefetch
- [ ] PostToolUse → Add tool guardrail checks
- [ ] PreToolUse → Add credential pool rotation check

### Phase 4: Validation
- [ ] End-to-end test: full 9-gate pipeline
- [ ] Stress test: 100+ goal files
- [ ] Rollback test: restore from stale-goals-backup/

---

## 7. TÀI LIỆU THAM KHẢO

| Hermes File | Dòng | MEKONG Reference |
|---|---|---|
| `agent/conversation_loop.py` | ~4836 | Main orchestration pattern |
| `agent/agent_init.py` | ~1657 | Context injection params |
| `agent/curator.py` | ~1843 | Goal maintenance logic |
| `agent/context_compressor.py` | ~2078 | Context compression strategy |
| `agent/tool_guardrails.py` | ~475 | Quality gate thresholds |
| `agent/memory_manager.py` | ~653 | Session memory patterns |
| `agent/error_classifier.py` | — | Error taxonomy (21 FailoverReason) |
| `agent/iteration_budget.py` | ~63 | Budget tracking |
| `agent/credential_pool.py` | ~2183 | Provider fallback |
| `acp_adapter/session.py` | ~628 | Session persistence |
| `config.yaml` | 157 | Configuration schema |

---

## 8. CHECKLIST TÍCH HỢP

- [x] Hermes config.yaml patterns mapped to MEKONG settings
- [x] conversation_loop retry hierarchy documented
- [x] curator.py idle-triggered pattern → goal-curator SOP
- [x] tool_guardrails thresholds → documented
- [x] error_classifier FailoverReason → MEKONG error codes
- [x] context_compressor → build_claude_context() trim logic
- [x] memory_manager prefetch → session-intel.sh
- [x] credential_pool rotation → fallback gate selection
- [x] iteration_budget → 9-gate budget tracking
- [x] SessionStart hook preserves existing functionality
- [x] PostToolUse/PreToolUse hooks don't break CLI
- [x] Isolation boundaries documented

---

*Document generated from Hermes Agent local clone analysis + MEKONG codebase review.*
