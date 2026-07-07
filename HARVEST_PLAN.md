# HARVEST PLAN — Harness Engineering for CEO Solo
> Giao cho agent phiên kia thực thi. Đọc kỹ trước khi làm.

## A. Đã có sẵn (không cần làm lại)
- `bin/me` đã deploy global → `/usr/local/bin/me`
- 8 harness patterns đã define trong `agents/registry.json`
- `lib/agent-patterns.sh` có `apply_harness_pattern()` + `resolve_agent()`
- `orchestrator/orchestrator-patterns.md` mô tả core loop
- `create_goal()` đã lưu `Pattern: <id>` vào state/goal-*.md
- Fix bug: `--pattern` giờ persist đúng (đã patch `run_idea()`)
- Bash ~36ms, không còn ghi đè file

## B. Việc cần làm ngay (theo thứ tự ưu tiên)

### B1. Implement `me step N` — Execute goal step by step
Hiện `create_goal` chỉ tạo file, Steps luôn `[]`. Cần:
- Đọc goal hiện tại từ `state/goal-*.md`
- Dựa vào `Pattern: <id>` → tạo danh sách Steps phù hợp:
  - `orchestrator` → [Plan → Allocate → Supervise → Report]
  - `expert-pool` → [Define task → Fan-out to agents → Collect → Merge]
  - `pipeline` → [Stage1 → Stage2 → Stage3 → Output]
  - `fanout-fanin` → [Dispatch → Parallel exec → Fan-in → Finalize]
  - etc.
- `me step 1` → chạy step 1, update goal file (Steps: [...], Status: running)
- `me step N` → chạy step N cụ thể
- Mỗi step: invoke agent phù hợp qua `build_agent_context` + `mekong <cmd>`
- `me goal show` → hiện goal + progress

### B2. Implement `me goal chain` — Chain multiple goals
```
me goal chain "build api" "write tests" "deploy"
```
→ tạo 3 goal files có liên kết, chạy tuần tự, mỗi cái done mới qua cái sau.

### B3. Implement `me goal show --watch` — Live progress
- Poll state/goal-*.md mỗi 2s
- Hiện progress bar, current step, agent đang chạy
- Nhấn Ctrl+C để dừng

## C. HARVEST Engineering mở rộng — CEO Solo đặc quyền

Hiện tại chỉ có 8 patterns cơ bản. Mở rộng theo chiến lược CEO Solo:

### C1. CEO-Level Patterns (patterns đặc quyền cho 1 người quản lý cả công ty)
Thêm vào `agents/registry.json`:
- `ceo-strategy` — CEO đặt mục tiêu → auto-decompose thành các OKR, assign pattern phù hợp cho từng mục tiêu
- `boardroom` — Multi-agent debate: 3-5 agents đưa ra proposal → CEO vote → winner executed
- `delegation` — CEO giao task → auto chọn agent → track → report back
- `emergency` — Pattern khẩn cấp: ngắt tất cả, ưu tiên cao, parallel tối đa

### C2. RaaS (Role as a Service) — Định nghĩa role linh hoạt
Hiện có `raas/template.md` nhưng chưa dùng. Mở rộng:
- `me role create <name> --agent <id> --pattern <id>` → tạo role mới từ template
- Lưu vào `state/raas/<name>.md`
- Có thể share giữa các project

### C3. SOPs (Standard Operating Procedures) — Template có sẵn
Hiện `state/sops/` rỗng. Điền:
- `sops/deploy-prod.md` — Template deploy production
- `sops/code-review.md` — Template review code
- `me sops run <name>` → chạy SOP theo template

### C4. Chains — Macro orchestration
- `me chain <chain-file>` → đọc chain.yaml → execute tuần tự
- Mỗi node: command + agent + pattern + condition
- Ví dụ: `dev → test → review → deploy`

## D. Chiến lược triển khai

### Phase 1 (Làm đầu tiên — 20 phút)
1. Implement `me step 1` cho pattern `orchestrator` (đơn giản nhất)
2. Implement `me goal show` (chỉ đọc file, hiện pretty)
3. Test: `me idea --pattern orchestrator "build API"` → `me step 1` → xem output

### Phase 2 (1-2 giờ)
4. Implement full step execution cho tất cả 8 patterns
5. Implement `me goal chain`
6. Thêm 4 CEO-level patterns vào registry

### Phase 3 (2-3 giờ)
7. Implement RaaS (`me role create/list/run`)
8. Implement SOPs (`me sops create/run`)
9. Implement Chains (`me chain run <file>`)
10. Viết docs: `docs/HARVEST-ENGINEERING.md`

## E. Quy tắc vàng
- Mỗi lần modify `bin/me` → chạy smoke test: `me idea --pattern orchestrator "test"` → verify file
- Mỗi feature mới → thêm vào `show_help()` trong bin/me
- Giữ nguyên bash — không đổi sang python/node
- Mọi state đều lưu vào `state/` theo cấu trúc hiện có
- Agent resolution: ưu tiên registry.json → fallback orchestrator

## F. Lệnh kiểm tra nhanh
```bash
me --help          # xem help
me idea --pattern orchestrator "test goal"   # tạo goal
cat state/goal-*.md | head   # xem goal vừa tạo
me goal show       # xem goal hiện tại (sau khi implement)
me step 1          # chạy step 1 (sau khi implement)
which me           # confirm /usr/local/bin/me
```
