# TASK BRIEF — Cho agent phiên kia hoàn thiện
Ngày: 2026-06-01 | Ưu tiên: CAO

## 1. Context
- Repo: `/Users/macbook/Documents/me-deep-wrapper/`
- CLI đã deploy: `/usr/local/bin/me` → symlink tới `bin/me`
- Lib: `lib/agent-patterns.sh`, `lib/goal-executor.sh`
- Registry: `agents/registry.json` (8 patterns)
- State: `state/goal-<stamp>.md`

Paradigm:
- `/command` = route trực tiếp tới mekong / claudekit / claude
- `/idea` = Harness Engineering: tạo goal → apply pattern → execute step-by-step

## 2. Bug đã fix (KHÔNG LÀM LẠI)
Bug: `pattern_label` bị mất khi `create_goal` gọi.
Root cause: subshell từ `apply_harness_pattern` hoặc duplicate local.
Giải pháp: `run_idea()` (line ~106-132) gán `pattern_label=$(apply_harness_pattern ...)` TRƯỚC khi gọi `create_goal`. `create_goal` nhận giá trị qua tham số `$2` — không phụ thuộc biến toàn cục.
=> Không còn bug. Verify: `grep -A2 "pattern_label" bin/me`.

## 3. Việc cần làm ngay (theo thứ tự)

### B1. Implement `me step N` (BẮT BUỘC)
Hiện `create_goal` chỉ tạo file, Steps luôn `[]`.
Cần:
- Thêm subcommand `step` vào dispatch
- Đọc goal mới nhất từ `state/goal-*.md` (sort desc theo timestamp)
- Parse `Steps: [...]`, chạy step thứ N (1-indexed)
- Pattern-specific execution: resolve agent từ registry, gọi mekong
- Ghi output vào goal file, mark completed
- Pattern → agent mapping: orchestrator→orchestrator, supervisor→supervisor, iterative-refiner→iterative-refiner, code-review→code-reviewer, tdd→tdd-implementer, strategic→strategic-planner, fanout-fanin→fanout-coordinator, hierarchical→hierarchical-coordinator

### B2. Implement `me goal show --watch`
- Hiển thị Goal, Pattern, Status, Steps, completed steps
- `--watch` poll mỗi 2s (clear + redraw)

### B3. Implement `me goal chain <file.yaml>`
- Parse YAML đơn giản (grep/sed), format: `- goal: "..."` + `pattern: ...`
- Execute tuần tự, hỏi user trước mỗi goal

## 4. Phase 2 (sau B1-B3)
4. Full step execution cho 8 patterns
5. Thêm 4 CEO-level patterns: ceo-strategy, ceo-1on1, ceo-board, ceo-hiring

## 5. Phase 3
6. RaaS: `me role create/list/run`
7. SOPs: `me sops create/run`
8. Chains: `me chain run <file>`
9. Docs: `docs/HARVEST-ENGINEERING.md`

## 6. Quy tắc vàng
- Giữ nguyên bash, không đổi sang python/node
- Mỗi lần modify `bin/me` → smoke test: `me idea --pattern orchestrator "test"` → verify file
- State lưu vào `state/`
- Commit message: `feat(me): <mô tả>` hoặc `fix(me): <mô tả>`

## 7. Test commands
```bash
which me && me --version
me idea --pattern orchestrator "build API"
cat state/goal-*.md | head
me goal show
me step 1   # (sau B1)
me goal chain chains/demo.yaml   # (sau B3)
```

## 8. File cần đọc trước khi làm
- `bin/me` — main CLI
- `lib/agent-patterns.sh` — pattern routing
- `lib/goal-executor.sh` — goal state helpers (mới tạo)
- `agents/registry.json` — agent registry
- `orchestrator/orchestrator-patterns.md` — orchestrator docs
- `HARVEST_PLAN.md` — plan gốc
- `state/goal-*.md` — ví dụ goal đã tạo
