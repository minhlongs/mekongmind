# TASK BRIEF — Giao cho agent phiên kia thực hiện
> Tạo bởi: Claude Opus 4.7 (session hiện tại)  
> Ngày: 2026-06-01  
> Độ ưu tiên: CAO — deploy trước, rồi làm nốt các bước còn lại

---

## 1. Context nhanh

Project: `/Users/macbook/Documents/me-deep-wrapper/`  
CLI: `bin/me` (bash)  
Deployed: `/usr/local/bin/me` → symlink tới repo `bin/me`  
Lib: `lib/agent-patterns.sh` (source vào `bin/me`)  
Registry: `agents/registry.json` (8 patterns hiện có)  
State: `state/goal-<stamp>.md`

Paradigm chính:
- `/command` = route trực tiếp tới agent mekong/claudekit
- `/idea` = Harness Engineering: tạo goal → apply pattern → execute step by step

## 2. Bug đã fix — đừng làm lại

> **Bug: `pattern_label` bị mất khi `create_goal` gọi**  
> Root cause: cũng có thể do subshell từ `apply_harness_pattern` hoặc duplicate local declaration (đã bị xóa).  
> **Giải pháp đã áp dụng (verify lại):**  
> - `run_idea()` line 106–132: `local pattern_label=""` rồi assign `pattern_label=$(apply_harness_pattern ...)` TRƯỚC khi gọi `create_goal`.  
> - `create_goal` line 51: `local pattern_label="${2:-}"` nhận giá trị qua tham số, không phụ thuộc biến toàn cục.  
> **=> Không còn bug. Không cần patch gì thêm ở đây.**

## 3. Deployment — PHẢI LÀM TRƯỚC

```bash
# Verify deploy đã OK
which me && me --version

# Nếu chưa deploy hoặc code mới bị thay đổi:
sudo ln -sf /Users/macbook/Documents/me-deep-wrapper/bin/me /usr/local/bin/me

# Verify lại
which me   # expect: /usr/local/bin/me
me --help  # expect: xem banner + help text
```

## 4. Việc còn lại (theo HARVEST_PLAN.md Section B — ưu tiên B1 → B2 → B3)

### B1. Implement `me step N` — Execute goal step by step (BẮT BUỘC)
- Mục tiêu: user chạy `me idea --pattern orchestrator "build API"` → `me step 1` → chạy step 1 → lưu output
- Hiện trạng: `create_goal` chỉ tạo file, Steps luôn `[]`
- Cần làm:
  1. Thêm subcommand `step` vào `run_idea()` (hoặc hàm mới `run_step()`)
  2. Đọc goal file mới nhất từ `state/goal-*.md` (sort theo timestamp desc)
  3. Parse `Steps: []`, chạy step thứ N (1-indexed)
  4. Pattern-specific execution:
     - `orchestrator` → gọi mekong agent tương ứng với step
     - `supervisor` → quản lý approval workflow
     - `fanout-fanin` → parallel fanout
     - `hierarchical` → sequential tier execution
  5. Ghi output của step vào goal file (append `Step N Output:`)
  6. Mark step completed, update status

### B2. Implement `me goal show` — hiển thị goal hiện tại (watch mode)
- Thêm option `--watch` để poll mỗi 2s
- Format output đẹp: hiển thị Pattern, Steps, Status, Output

### B3. Implement `me goal chain` — run nhiều goals tuần tự
- Đọc file chain (YAML hoặc JSON), execute từng goal theo thứ tự
- Nếu 1 goal fail → hỏi user continue hay stop

## 5. Phase 2 (sau B1-B3 xong)

### 4. Full step execution cho tất cả 8 patterns
### 5. Thêm 4 CEO-level patterns vào registry:
- `ceo-strategy` — strategic planning + OKR
- `ceo-1on1` — 1-on-1 meeting prep + follow-up
- `ceo-board` — board report + compliance
- `ceo-hiring` — hiring sprint + talent pipeline

## 6. Phase 3 (nếu còn thời gian)

### 7. RaaS: `me role create/list/run` (Role as a Service)
### 8. SOPs: `me sops create/run`
### 9. Chains: `me chain run <file>`
### 10. Docs: `docs/HARVEST-ENGINEERING.md`

## 7. Ràng buộc & quy tắc vàng

- Giữ nguyên bash — không đổi sang python/node
- Mỗi lần modify `bin/me` → chạy smoke test: `me idea --pattern orchestrator "test"` → verify file
- Mọi state lưu vào `state/` theo cấu trúc hiện có
- Agent resolution: ưu tiên `registry.json` → fallback `orchestrator`
- Mỗi feature mới → thêm vào `show_help()` trong `bin/me`
- Commit message format: `feat(me): <mô tả>` hoặc `fix(me): <mô tả>`

## 8. Test commands

```bash
# Deploy check
which me && me --version

# Goal creation
me idea --pattern orchestrator "build REST API"
me idea --pattern supervisor "review audit report"
me idea "just a quick idea"
me idea --pattern fanout-fanin "analyze competitor landscape"

# Verify state file
cat state/goal-*.md | head -30

# Step execution (sau khi implement B1)
me step 1
me step 2

# Goal show (sau khi implement B2)
me goal show
me goal show --watch

# Goal chain (sau khi implement B3)
me goal chain chains/ceo-daily.yaml

# Registry check
cat agents/registry.json | python3 -m json.tool | head

# Full help
me --help
```

## 9. Pattern detection logic (ghi chú cho implement)

`apply_harness_pattern()` trong `lib/agent-patterns.sh` auto-detect pattern từ `goal_desc`:
- `(kế hoạch|plan|chiến lược|strategy|roadmap)` → `strategic`
- `(code|implement|build|phát triển|xây)` → `iterative-refiner`
- `(review|đánh giá|refactor|review)` → `code-review`
- `(test|kiểm tra|unit|e2e)` → `tdd`
- `(triển khai|deploy|release|rollout)` → `supervisor`
- `(phân tích|research|khảo sát|analyze)` → `fanout-fanin`
- `(lần lượt|từng bước|tier|layer)` → `hierarchical`
- default → `orchestrator`

Pattern có thể override bằng `--pattern <id>`.

## 10. File cần đọc trước khi làm

1. `bin/me` — main CLI (356 dòng)
2. `lib/agent-patterns.sh` — pattern routing
3. `agents/registry.json` — agent registry
4. `orchestrator/orchestrator-patterns.md` — orchestrator docs
5. `HARVEST_PLAN.md` — plan gốc
6. `state/goal-*.md` — ví dụ goal đã tạo
7. `docs/VIETNAMESE-ARCHITECTURE-REPORT.md` — architecture

## 11. Deliverables cuối cùng

Khi xong Phase 1 (B1-B3), deliverables:
1. `bin/me` đã có subcommand `step`, `goal show`, `goal chain`
2. `lib/` helper mới nếu cần
3. `tests/test_step_execution.sh` — smoke test cho B1
4. `docs/HARVEST-ENGINEERING.md` — docs tổng quan
5. Tất cả đã deploy (`which me` → `/usr/local/bin/me`)
6. Git commit: `feat(me): implement step execution, goal show, goal chain — Phase 1`

---

## Quick reference: cấu trúc `bin/me` hiện tại

```
bin/me
├── show_help()           # --help
├── run_idea()            # /idea — create goal + apply pattern
│   ├── create_goal()     # ghi file state/goal-*.md
│   └── apply_harness_pattern()  # auto-detect pattern (lib/agent-patterns.sh)
├── run_mekong()          # /mekong <cmd> — route to mekong-cli
├── run_claudekit()       # /claudekit <cmd> — route to claudekit
├── run_claude()          # /claude <cmd> — route to claude
├── main()                # dispatch
└── (cần thêm)
    ├── run_step()        # /step N
    ├── run_goal_show()   # /goal show [--watch]
    └── run_goal_chain()  # /goal chain <file>
```

