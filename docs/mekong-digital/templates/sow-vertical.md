# SOW Template — Vertical Solution (OCOP / HTX / Tourism / Custom)

**Service Type:** VERTICAL
**Pricing range:** 30tr – 500tr (custom, tùy quy mô)
**Timeline:** 6 tuần – 6 tháng
**Lưu ý:** Đây là template "umbrella" — mỗi vertical có sub-template riêng (ocop-traceability.md, htx-record.md, tourism-pms.md). SOW này = sub-template + phần dưới đây.

---

## 1. Thông tin khách hàng

- Tên DN/HTX: _____________
- Loại hình: [ ] OCOP | [ ] HTX nông nghiệp | [ ] Du lịch | [ ] Khác
- Quy mô: ___ thành viên / ___ ha / ___ phòng
- Sản phẩm/dịch vụ: _____________
- Thị trường mục tiêu: [ ] Nội địa | [ ] Xuất khẩu (___) | [ ] Cả hai

## 2. Phạm vi (chọn 1 sub-vertical bên dưới)

### 2.1. OCOP Traceability QR
- [ ] Catalog sản phẩm với metadata (vùng trồng, ngày, batch, certification)
- [ ] Mã QR mỗi batch sản phẩm → landing page show story + cert
- [ ] Mobile app/web admin để DN tự update
- [ ] Tích hợp với chứng nhận OCOP, ISO, HACCP nếu có
- [ ] Multi-language (Vi + En tối thiểu)
- [ ] Analytics: số scan QR, vùng địa lý
- [ ] Print template QR sticker (gửi designer/print partner)

### 2.2. HTX Nhật Ký Sản Xuất Số
- [ ] Web/mobile để xã viên ghi nhật ký (gieo, bón phân, thu hoạch)
- [ ] Quản lý tổng (admin HTX): xem nhật ký toàn HTX, summary
- [ ] Báo cáo theo mùa vụ
- [ ] Export CSV cho cơ quan quản lý
- [ ] Tích hợp truy xuất nguồn gốc (nếu cần)
- [ ] Offline-first (nông thôn yếu mạng)

### 2.3. Tourism Homestay PMS
- [ ] Quản lý phòng + lịch booking
- [ ] Booking engine direct (không qua OTA)
- [ ] Tích hợp Booking.com / Agoda / Airbnb (channel manager)
- [ ] Quản lý KH: lịch sử, preferences
- [ ] Pricing dynamic theo mùa/peak
- [ ] Multi-language Vi/En/[third]
- [ ] Payment online: VietQR/MoMo/Stripe (tùy thị trường)

### 2.4. Custom Vertical
Nếu khách yêu cầu vertical khác (logistics, F&B chain, manufacturing) — cần discovery riêng + scope rebuild.

## 3. Approach

### 3.1. Discovery phase (BẮT BUỘC, 1–2 tuần)
- Workshop với khách 2–4 buổi
- Map quy trình hiện tại (as-is)
- Define quy trình mong muốn (to-be)
- User stories prioritized (MoSCoW: Must / Should / Could / Won't)
- Tech architecture proposal
- Output: spec doc + Figma wireframe

**Phí Discovery:** 5–15tr (separate, deductible từ project nếu khách approve project sau)

### 3.2. Build phase
- Sprint 2 tuần
- Demo end of each sprint
- Khách approve → next sprint
- Khách reject → 1 round revision miễn phí

### 3.3. UAT + Go-live
- Khách test 1–2 tuần với data thật
- Bug fix
- Train end-user (admin + xã viên/staff)
- Go-live + 30 ngày warranty

## 4. Tech stack (default)

| Layer | Stack |
|---|---|
| Frontend admin | Next.js 15 + Tailwind + shadcn/ui |
| Mobile (nếu có) | PWA (default) hoặc React Native (nếu cần native) |
| Backend | Cloudflare Workers + Hono |
| Database | Supabase Postgres (RLS multi-tenant) |
| Auth | Supabase Auth |
| Storage | Cloudflare R2 |
| QR generator | qrcode.js (client-side) |
| Map (nếu cần) | Mapbox hoặc Goong (VN-friendly) |
| i18n | next-intl |

## 5. Pricing (custom — đây là khung)

### 5.1. OCOP Traceability QR

| Tier | Price | Bao gồm |
|---|---|---|
| MVP | 50–80tr | 1 sản phẩm catalog + 1 landing template + admin web + 100 batch QR |
| Standard | 100–150tr | + multi-product + analytics + multi-language |
| Premium | 200–350tr | + mobile app native + tích hợp ERP khách + custom domain |

### 5.2. HTX Nhật Ký

| Tier | Price | Bao gồm |
|---|---|---|
| MVP | 80–120tr | Web admin + xã viên web + 50 user |
| Standard | 150–250tr | + mobile + offline sync + báo cáo |
| Premium | 300–500tr | + tích hợp truy xuất + dashboard cấp tỉnh |

### 5.3. Tourism PMS

| Tier | Price | Bao gồm |
|---|---|---|
| MVP | 60–100tr | Quản lý phòng + booking direct + 1 channel |
| Standard | 130–220tr | + 3 channels + dynamic pricing + payment online |
| Premium | 250–450tr | + multi-property + analytics + native app |

### 5.4. Maintenance/Hosting (sau go-live)

| Plan | Price/tháng |
|---|---|
| Basic | 3–5tr |
| Standard | 8–15tr |
| Premium | 20–35tr |

**Payment terms:**
- 30% deposit
- 30% sau approve Discovery output (spec + wireframe)
- 30% sau approve Sprint cuối / UAT
- 10% sau 30 ngày go-live (warranty period)

## 6. Cam kết & SLA

- Sprint demo đúng deadline (trễ → not charge revision sprint đó)
- Bug critical sau go-live (warranty 30 ngày): fix trong 24h
- Bug major: fix trong 5 ngày
- Bug minor: fix trong 14 ngày
- Performance: mobile load <3s, web load <2s

## 7. Quyền sở hữu & IP

- Custom code: 100% khách sở hữu sau thanh toán đủ
- Shared lib `@mekong/*`: license MIT-like cho khách (right to use, modify cho khách; chúng tôi giữ ownership, có quyền dùng cho khách khác)
- Brand assets, design specific cho khách: 100% khách
- Knowledge ngầm (documentation, runbook): hand over

## 8. Risk & exclusions

- KHÔNG cam kết tính năng ngoài MoSCoW Must/Should đã ký (Could/Won't = nice-to-have, charged separately)
- KHÔNG chịu trách nhiệm khi khách thay đổi requirement giữa sprint (charge change request fee)
- KHÔNG chịu trách nhiệm uptime của bên thứ ba (Supabase, Cloudflare, Booking.com)
- Phí domain, hosting, third-party API (Mapbox, Stripe, Booking.com, etc.) khách trả trực tiếp

---

## Pain tag (INTERNAL — CRITICAL FOR PATTERN MINING)

**Vertical:** `___` (ocop | htx-agri | tourism | logistics | f&b | manufacture | other)
**Sub-pattern:** `___` (traceability | record | booking | inventory | reporting | other)
**Industry:** `___`
**Budget band:** `___` (50-100 | 100-200 | 200-500 | 500+)
**Urgency:** `___` (low | med | high | regulatory-driven)
**Tech sophistication of customer:** `___` (low | med | high)
**Likelihood of repeat purchase / referral:** `___` (low | med | high)
**Notes for product extraction:** `___` (free text — phần nào của solution có thể productize?)

---

**Chữ ký**

Bên A: _____________ Ngày: _____________

Bên B: _____________ Ngày: _____________
