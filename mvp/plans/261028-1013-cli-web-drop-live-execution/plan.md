# Bỏ live execution khỏi trang /cli

**Status:** approved
**Issue:** https://github.com/minhlongs/mekongmind/issues/17
**Branch:** `refactor/cli-web-drop-live-execution`
**Ship mode:** official
**Route:** refactor (bỏ khả năng hiển thị, giữ engine)

## Problem

`/cli` deploy dưới dạng static export, nên Cloudflare Pages xoá toàn bộ App Router
route handler khỏi `out/`: không có `out/api/`. Hệ quả đo được trên production:

| Endpoint | Trạng thái thực tế |
|---|---|
| `GET /api/cli/gates` | 404 + 8719 byte HTML (trang lỗi CF) |
| `GET /api/cli/runs/RUN-TEST` | 404 + 8719 byte HTML |
| `POST /api/cli/runs` | 405 + body rỗng |
| `POST /api/cli/receipts/verify` | 405 + body rỗng |

Trang web không vỡ — `readJsonBody` và guard `r.ok` xử lý được cả hai dạng phản
hồi. Nhưng nút **▶ Chạy Lệnh Thật** và **Xin Chứng Thực** hiện thông báo lỗi thay
vì kết quả, vì chúng gọi endpoint không tồn tại trên static deploy. Đó là hai yếu
tố gây hiểu lầm trên một trang vốn đã là catalog + visual.

Chủ sở hữu sản phẩm đã chốt: **bỏ live execution khỏi web**, vì live execution
spine đến từ PR #12 (Wave 4) chứ không phải từ yêu cầu gốc ("focused, interactive,
visual như #servo") — phần yêu cầu gốc đã hoàn tất qua `Run Simulation`, vốn chạy
hoàn toàn độc lập với mạng.

## Requirements

1. Không còn nút hoặc handler nào trong `page.tsx` gọi `/api/cli/runs`,
   `/api/cli/receipts/verify`, hay `/api/cli/gates`.
2. `Run Simulation` (xung trực quan, `runSimulation`) giữ nguyên hành vi — vốn
   không đụng mạng.
3. Trạng thái `AWAITING_REAL_EXECUTION` trong khối terminal giữ nguyên: nó nói
   thật rằng lệnh chưa chạy, không hề ngụ ý đã chạy. Các phần UI đi kèm trong
   terminal được giữ và được hiểu đúng bản chất: chỉ báo `● IDLE` (hằng sau
   refactor) và các dòng `TraceLine` là **xem trước tĩnh của `Run Simulation`** —
   `[1/4]`–`[3/4]` dùng `visible={simStep >= N || simStep === 0}` nên hiện ngay
   khi mount mà không cần click, `[4/4]` dùng `simStep >= 4 || simStep === 5` nên
   chỉ hiện sau khi mô phỏng chạy. Cả bốn đều là output của mô phỏng chạy trong
   trình duyệt (`runSimulation`, chỉ `setTimeout`, không mạng), không phải bằng
   chứng lệnh đã thực thi.
4. `cli-execution-bridge.ts` và `cli-execution-bridge.test.ts` **không đổi** —
   engine sinh receipt, phân loại maturity tier, tính PIT VN 7 bậc vẫn được
   `state/` artifacts và CLI local dùng.
5. Cả 5 route trong `mvp/src/app/api/cli/` **không đổi**. Chỉ 2 trong 5 route
   mang `export const revalidate = 0` — `capabilities/route.ts` và
   `runs/[runId]/route.ts` — vì đó là hai route bị `output: 'export'` chặn
   (một đọc `request.url`, một có dynamic segment). Ba route còn lại
   (`gates`, `runs`, `receipts/verify`) không có `revalidate = 0` và **không
   cần nó**: `NEXT_PUBLIC_STATIC_EXPORT=true npm run build` tại HEAD hiện tại
   đã exit 0 với cả 5 route hiện diện, nên câu "xoá `revalidate = 0` sẽ làm
   build đỏ lại" chỉ đúng với 2 route kia.
6. `npm test` vẫn xanh; đây là điều kiện cứng vì file test đó là toàn bộ Node test
   của `mvp/`.

## Non-goals

- Không xoá `cli-execution-bridge.ts` — 668 dòng, chứa thuật toán PIT VN và nhà
  máy ký HMAC mà ledger sản phẩm phụ thuộc.
- Không xoá 5 API route.
- Không port live execution sang Cloudflare Pages Functions — chủ sở hữu đã chọn
  bỏ khỏi web, và chuyển dịch đó là công việc riêng nếu sau này cần live proof.
- Không đổi catalog 197 lệnh, matrics radar 10×4, breadboard 5 chân, pagination,
  hay URL-hash deep linking.

## Files

Sửa (2 file):

- `mvp/src/app/(landing)/cli/page.tsx` — xoá 3 handler + 4 điểm gọi + các phần
  UI chỉ tồn tại để hiển thị kết quả live.
- `tests/test_cli_full_registry_cross_mapping.py` — viết lại assert cho trạng
  thái mới; giữ `assertNotIn("GATE_PASSED_SHA256", src)`.

Không đụng: `mvp/src/lib/cli-execution-bridge.ts`, `*.test.ts`, `src/app/api/**`.

## Steps

1. Trong `page.tsx`: xoá 3 handler — `handleRunLiveCommand` (:286),
   `handleVerifyReceipt` (:318), `handleReconcileMilestoneGate` (:340) — cùng
   toàn bộ helper `readJsonBody` (:30, chỉ 3 handler này gọi nó).

   State xoá: `isExecuting`, `liveRunError`, `receiptVerified`, `companyGates`,
   `isReconcilingGate`, `reconcileNotice`, `terminalTab` (:193 — chết, không
   ai gọi `setTerminalTab`, và literal `'live'` của nó chính là khái niệm bị
   bỏ), và effect fetch gates lúc mount (:218-231).

   **Cảnh báo — `isExecuting` và `liveRunResult` KHÔNG phải state chỉ-live.**
   Xoá `useState` của chúng sẽ làm đỏ `npm run typecheck` nếu không xử lý
   trước những chỗ UI được giữ lại đang đọc chúng:
   - `:1448-1449` (`● {isExecuting ? 'EXECUTING' : liveRunResult ? 'RUN SEALED' : 'IDLE'}`
     và chấm màu đi kèm) — đổi thành chỉ báo hằng `● IDLE` với chấm `bg-white/20`,
     vì sau refactor không còn chuyển tiếp trạng thái thực thi nào.
   - `:1590` (`{!liveRunResult && !liveRunError && (`) — điều kiện đang giữ khối
     JSON `AWAITING_REAL_EXECUTION`. Bỏ điều kiện, render khối `<pre>` vô điều
     kiện. Nếu không, khối JSON biến mất và phá Requirement 3.

   Xoá luôn type import `CommandReceipt` / `ExecutionRunResult` / `MilestoneGate`
   (sau bước trên không còn ai dùng cả 3).
2. Xoá 4 điểm gọi: hai `onClick={() => handleRunLiveCommand(...)}` (:1018,
   :1610), một `handleVerifyReceipt` (:1501), một
   `handleReconcileMilestoneGate` (:1569).
3. Gộp nhóm nút trung tâm về một nút `▶ Run Simulation` duy nhất.
4. Làm sạch phần terminal live: giữ terminal, giữ khối JSON
   `AWAITING_REAL_EXECUTION`; bỏ card receipt, danh sách reconciliation, và mọi
   text đề cập endpoint bị bỏ.
5. Viết lại `test_cli_page_de_simulated_and_wired_for_live_execution` thành
   `test_cli_page_is_de_simulated_with_dead_api_calls`, assert: `page.tsx` không
   chứa `handleRunLiveCommand`, `handleVerifyReceipt`,
   `handleReconcileMilestoneGate`; không còn `fetch(` nào (không chỉ
   `fetch('/api/cli`), không còn chuỗi `RUN SEALED` lẫn `EXECUTING`; vẫn chứa
   `runSimulation`, `AWAITING_REAL_EXECUTION`, `MATURITY_TIERS`; và vẫn giữ
   `assertNotIn("GATE_PASSED_SHA256", src)`.
6. Xoá `test_cli_page_parses_api_bodies_defensively`. Lý do quyết định không
   phải "có fetch nào sót lại hay không" mà là bất biến thật: `readJsonBody`
   cùng cả 3 điểm gọi (`:302`, `:325`, `:358`) đều nằm trong 3 handler bị xoá,
   nên helper chắc chắn biến mất — nhánh "giữ test nếu helper còn lại" của bản
   nháp trước là không thể với. Assert `assertNotIn("fetch(", src)` ở bước 5
   **mạnh hơn** hai assert count cũ (`src.count("readJsonBody") == 4`,
   `src.count("await res.json()") == 1`): nó không chỉ bắt `/api/cli` mà mọi
   fetch mọi URL, nên bắt được cả trường hợp ai đó nối lại live execution qua
   tiền tố khác.
7. Chạy (mọi lệnh từ thư mục `mvp/`, dùng đường dẫn đầy đủ khi grep):
   `npm run typecheck`, `npm test`, `python3 -m pytest
   tests/test_cli_full_registry_cross_mapping.py` từ gốc repo, và
   `NEXT_PUBLIC_STATIC_EXPORT=true npm run build`.
8. Kiểm artifact sau build (đã đo trước refactor, dùng làm mốc so:
   `out/cli.html` = 73.152 byte, chunk = `out/_next/static/chunks/app/(landing)/cli/page-8f022061cde5b127.js`):
   - `out/cli.html` còn `Run Simulation`, **không** còn `Chạy Lệnh Thật`.
   - chunk còn `AWAITING_REAL_EXECUTION` — chuỗi này **không** nằm trong
     `cli.html` (nó chỉ render sau tương tác client), nên không kiểm `cli.html`
     cho chuỗi đó; `cli.html` cũng không được chứa `fetch(` hay `/api/cli`.

   Hash chunk sẽ đổi sau refactor; tự tìm file chunk trong
   `out/_next/static/chunks/app/(landing)/cli/` thay vì ghép tên cứng.

## Acceptance criteria

- [ ] `grep -c "handleRunLiveCommand\|handleVerifyReceipt\|handleReconcileMilestoneGate" "mvp/src/app/(landing)/cli/page.tsx"` = 0 (đường dẫn đầy đủ từ gốc repo — grep `page.tsx` trần sẽ báo `No such file`, exit 2, không phải 0)
- [ ] `grep -c "fetch(" "mvp/src/app/(landing)/cli/page.tsx"` = 0
- [ ] `grep -c "RUN SEALED\|EXECUTING" "mvp/src/app/(landing)/cli/page.tsx"` = 0 (chuỗi chứng minh Requirement 3, không chỉ tên handler)
- [ ] `npm test` xanh (5/5)
- [ ] Python registry suite xanh
- [ ] `npm run typecheck` 0 lỗi
- [ ] Static export build exit 0, `/cli` vẫn render
- [ ] `out/cli.html` còn `Run Simulation`, không còn `Chạy Lệnh Thật`, không còn `fetch(` hay `/api/cli`
- [ ] client chunk (tìm trong `out/_next/static/chunks/app/(landing)/cli/`) còn `AWAITING_REAL_EXECUTION`
- [ ] `git diff --name-only` chỉ chạm đúng 2 file đã liệt kê

## Risk / rollback

Rủi ro thực sự là `npm run typecheck` đỏ, không phải `npm test`: `npm test` chỉ
chạy `src/lib/cli-execution-bridge.test.ts` (5 test) — file thuộc diện
không-đụng — nên nó không thể đỏ vì thay đổi này. `page.tsx` có 1.805 dòng và
không có component test nào, nên `npm run typecheck` cùng assert chuỗi của Python
suite là toàn bộ lớp bảo vệ tự động cho phần sửa `page.tsx` — và `typecheck` sẽ
đỏ nếu bước 1 xoá `isExecuting`/`liveRunResult` mà chưa xử lý `:1448-1449` và
`:1590`. `npm test` có thể đỏ ở khâu trung gian nếu sửa test trước code
(thứ tự nên làm: bước 5-6 rồi mới bước 1-4) và nó chỉ assert đúng chuỗi sắp bị
xoá; đó là lỗi ở chỗ dự kiến, không phải hồi quy.

Rollback: `git revert` trên PR; không có thay đổi schema, migration, hay hành vi
phá dữ liệu. Setup wizard, Telegram bot, và payment flow không nằm trong phạm vi
đụng tới: không có file nào dưới `mvp/src/app/(landing)/cli/` tham chiếu setup
wizard, Telegram, webhook, IPN, hay NOWPayments.

**Đường dẫn deploy (để lần sau không phải đo lại):** `/cli` production không do
GitHub Actions workflow nào tự động deploy — 15 workflow trong
`.github/workflows/` không có workflow nào chạm `mvp/` (chỉ `ci.yml`, `test.yml`
build/test nó, và `ci.yml` chạy `npm run build` **không** có
`NEXT_PUBLIC_STATIC_EXPORT`). Deploy là **thủ công**, theo
`docs/mekong-digital/runbooks/deploy-cloudflare.md`: build
`NEXT_PUBLIC_STATIC_EXPORT=true` rồi `wrangler pages deploy` Direct Upload lên
project `mekong-digital`. Đó là lý do `out/api` không tồn tại trên production.

### Follow-up ngoài phạm vi (không sửa trong plan này)

Hai việc dưới đây được ghi nhận là có thật nhưng deliberately để ngoài phạm vi,
vì chúng đụng `cli-execution-bridge.ts` hoặc 5 API route — cả hai đều nằm trong
Non-goals theo quyết định đã chốt:

1. `POST /api/cli/gates` (`gates/route.ts:36`) gọi `reconcileGate`
   (`cli-execution-bridge.ts:654`) — đổi `gate.status = 'SEALED_VERIFIED'` mà
   **không có auth/authorization/identity check nào** trong cả 5 route. Không
   phải mặt tấn công internet hôm nay vì route handler không tồn tại trên static
   production; sẽ thành vấn đề nếu sau này chuyển sang server deploy.
   → Đã tạo issue **#19**.
2. `cli-execution-bridge.ts:77` — `HMAC_SECRET = process.env.MEKONG_RECEIPT_HMAC_SECRET || '[redacted-hardcoded-fallback]'`.
   Cùng file vừa ký (`:169`) vừa verify (`:172`) receipt, nên khi env var chưa
   set thì ai biết source cũng tự tạo được receipt `valid: true`. Kèm theo:
   `.github/workflows/ci.yml:92` đang allowlist đúng chuỗi này khỏi bộ quét secret.
   Biến `MEKONG_RECEIPT_HMAC_SECRET` cũng không được ghi trong `.env.example` ở
   bất kỳ cấp nào, nên fallback chính là đường mặc định khi dựng môi trường mới.
   → Đã tạo issue **#20**.

## Validation Log

### Verification Results
- Claims checked: 11
- Verified: 11 | Failed: 0 | Unverified: 0
- Tier: Light (Fact Checker, 1 phase)
- Failures: none

Evidence:
- 3 handler tại page.tsx:286, :318, :340; 4 điểm gọi tại :1018, :1501, :1610,
  :1569 (`handleReconcileMilestoneGate` trong danh sách cột mốc).
- 4 điểm `fetch('/api/cli…`) — khớp với 4 endpoint đo trên production.
- `readJsonBody` (:30) cùng 3 điểm gọi (:302, :325, :358) đều nằm trong 3 handler
  bị xoá, nên helper sẽ biến mất hoàn toàn.
- `terminalTab` (:193) là state chết: `setTerminalTab` không có lời gọi nào.
- `isExecuting`/`liveRunResult` còn nuôi UI được giữ: :1448-1449 và :1590.
- `runSimulation` (:601), `AWAITING_REAL_EXECUTION`, `MATURITY_TIERS` đều hiện diện.
- `MATURITY_TIERS` đến từ `@/data/cli-full-registry`; dòng :19 là **duy nhất**
  import từ `@/lib/cli-execution-bridge` (type-only), nên sau refactor sẽ xoá sạch.
- `out/api` không tồn tại sau static-export build; `out/cli.html` = 73.152 byte;
  `AWAITING_REAL_EXECUTION` chỉ nằm trong client chunk, không trong `cli.html`.
- `revalidate = 0` chỉ có ở `capabilities/route.ts` và `runs/[runId]/route.ts`.
- `cli-execution-bridge.ts` 668 dòng; `cli-execution-bridge.test.ts` là toàn bộ
  Node test của mvp (`npm test` trỏ đúng một file).

### Red Team Review

2 reviewer (Security Adversary + Assumption Destroyer), 1 phase, tier Light. Ra
15 finding; dedupe và Evidence Filter xuống 7 ACCEPT / 8 REJECT. Toàn bộ ACCEPT
là lỗi thực thi plan — không có cái nào đảo quyết định phạm vi đã chốt.

| # | Severity | Finding | Quyết định | Áp dụng ở đâu |
|---|---|---|---|---|
| A1 | Critical | Requirement 5 nói cả 5 route có `revalidate = 0` — thực tế chỉ 2/5 | ACCEPT | Requirement 5, sửa lại |
| A2 | Critical | Step 1 bỏ sót `terminalTab`, và gọi nhầm `isExecuting`/`liveRunResult` là state chỉ-live — xoá sẽ đỏ typecheck | ACCEPT | Step 1, thêm cảnh báo + hướng dẫn sửa :1448-1449, :1590 |
| A3 | High | Step 6 đi theo nhánh không thể với (`readJsonBody` chắc chắn biến mất) | ACCEPT | Step 6, ghi thẳng quyết định |
| A4 | High | Acceptance criteria dùng đường dẫn trần, và không test `RUN SEALED`/`EXECUTING` | ACCEPT | Acceptance criteria |
| A5 | High | Requirement 3 không do deliverable thỏa mãn — 3 dòng TraceLine hiện ở mount | ACCEPT | Requirement 3 |
| A6 | High | Step 8 ghi nhãn sai: `AWAITING_REAL_EXECUTION` không nằm trong `cli.html` | ACCEPT (tự phát hiện khi sweep) | Step 8 |
| A7 | Medium | Rủi ro chính được ghi là `npm test`, nhưng nó không thể đỏ vì thay đổi này; rủi ro thật là typecheck | ACCEPT (tự phát hiện khi sweep) | Risk/rollback |

REJECT (kèm phản chứng):

| # | Severity | Finding | Vì sao reject |
|---|---|---|---|
| R1 | High | Không workflow nào deploy `mvp/`, nên tiền đề production chưa được chứng minh | Không chặn: deploy là thủ công theo `docs/mekong-digital/runbooks/deploy-cloudflare.md`, và 4 phép đo production là bằng chứng trực tiếp. Nhưng **chấp nhận một phần**: đã thêm đường dẫn deploy vào Risk/rollback để lần sau khỏi đo lại |
| R2 | Critical | `POST /api/cli/gates` không auth, đổi `SEALED_VERIFIED`, là mặt tấn công đang mở | Đúng nhưng **ngoại phạm vi**: Requirement 4 và Non-goals giữ nguyên cả 5 route. Đo được: route không tồn tại trên production static, nên không phải mặt tấn công internet hôm nay → ghi thành follow-up |
| R3 | High | Fallback `'[redacted-hardcoded-fallback]'` làm verify tự chứng thực; `ci.yml:92` allowlist đúng chuỗi đó | Đúng nhưng đụng `cli-execution-bridge.ts` (Non-goals). Ghi follow-up |
| R4 | High | Toàn bộ acceptance criteria là grep một file client; không có gì chứng minh phía server | Tiêu chí grep là đủ cho một refactor bỏ UI: A4 đã siết thêm `RUN SEALED`/`EXECUTING`, và Step 8 kiểm artifact build. Yêu cầu test phía server là mở rộng scope |
| R5 | Medium | Không có CI nào build `NEXT_PUBLIC_STATIC_EXPORT=true` | Đúng, và đó là bất cập thật của repo, nhưng sửa CI nằm ngoài diff 2 file đã chốt. Ghi lại trong đường dẫn deploy |
| R6 | Medium | `npm test` (5/5) là tiêu chí tạp-năng vì chỉ test file không-đụng | Đúng — A7 đã sửa cách **diễn giải** rủi ro. Tiêu chí `npm test` vẫn giữ vì nó là điều kiện cứng của repo, chỉ không còn là "rủi ro chính" |
| R7 | Medium | Polarity: `handleReconcileMilestoneGate` chưa bao giờ được test assert, nên assert-vắng-mặt của nó không có giá trị hồi quy | Đúng nhưng vô hại: assert đó đi kèm `assertNotIn("fetch(", src)` mới (A3), đã bắt được hành vi thay vì tên |
| R8 | Low | `grep -c` đếm dòng không đếm lần xuất hiện | A4 đã dùng đường dẫn đầy đủ; trong file này mỗi tên nằm trên dòng riêng nên đếm-dòng == đếm-lần. Không đáng thêm lệnh phức tạp hơn |

### Whole-Plan Consistency Sweep
- Requirements 4, 5 (giữ engine và route) khớp với Non-goals và Steps 6-7.
- Steps 4-5 thay đổi contract của test; đã ghi trước Risk, và thứ tự sửa
  test-trong-trước-code-sau đã nằm trong Risk/rollback.
- Requirement 5 (sửa theo A1) khớp với Non-goals "không xoá 5 API route": không
  đổi route nào, chỉ sửa cách mô tả `revalidate = 0`.
- Follow-up R2/R3 khớp với Non-goals (đụng bridge/route) và với Requirement
  4/5 — ghi nhận chứ không sửa.
- Không mâu thuẫn nào tồn tại.

### Decision
Proceed. Không có câu hỏi nào cần hỏi lại: phạm vi đã được chủ sở hữu chốt qua
/ak:advise (bỏ live execution khỏi web, giữ engine); 7 ACCEPT không đảo phạm vi
đó; hai vấn đề R2/R3 được xác nhận có thật nhưng thuộc Non-goals và đã thành
follow-up. Mọi fact có thể kiểm trong repo đã kiểm.
