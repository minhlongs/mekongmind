---
title: "Mekong CLI Visual Identity & Product Storytelling Overhaul (Full Web UI/UX)"
status: completed
branch: feat/mekong-cli-visual-identity
date: 2026-10-26
---

# Plan: Mekong CLI Visual Identity & Product Storytelling Overhaul

## Objective
Giải quyết triệt để vấn đề "Chưa hình dung được mekong-cli là gì khi lướt Full Web UI/UX" trên `mekongmind/mvp` và `mekong-cli/apps/dashboard`. Tái định vị trực quan bằng hành trình 6 tầng trên Trang chủ (Interactive CLI Terminal 5 kịch bản, Sơ đồ 3 bước hoạt động, 3 Phễu nghiệp vụ cốt lõi VN, Dàn 4 Giám đốc C-Suite AI, Bảng Trước/Sau & Tính ROI, Bảng giá Dual-Rail), tạo mới trang từ điển lệnh `/cli`, nâng cấp `/templates` với lệnh CLI thực thi và bổ sung Mekong CLI Command Bridge trên Dashboard.

## Phases
- **Phase 1 (Mekongmind MVP - Components & Interactive Terminal)**:
  - Tạo `src/components/interactive-cli-showcase.tsx` tích hợp Terminal Simulator 5 kịch bản (`mekong init`, `mekong ke-toan tt78`, `mekong zalo-oa`, `mekong marketing cmo-run`, `mekong cfo budget`) kết hợp màn hình hiển thị kết quả thực tế trên Web Cockpit, Sơ đồ 3 bước hoạt động (`How Mekong CLI Works`), và 3 Phễu Nghiệp Vụ VN (`zalo-oa`, `ke-toan`/`thue`, `sophia`/`cmo`).
  - Tạo `src/components/csuite-and-roi-section.tsx` tích hợp bảng tương tác 4 Giám đốc C-Suite AI (`/cfo`, `/cmo`, `/cso`, `/cto`) và Bảng Đối Chiếu Trước / Sau & Bộ Tính ROI thực tế.
  - Nâng cấp `src/components/hero-section.tsx` và `src/app/(landing)/page.tsx` để kết nối hoàn chỉnh 6 tầng trải nghiệm.
- **Phase 2 (Mekongmind MVP - Trang /cli & Nâng cấp /templates)**:
  - Xây dựng trang mới `src/app/(landing)/cli/page.tsx` phân loại, tìm kiếm và hiển thị 39+ nhóm lệnh thực tế của `mekong-cli` có nút copy lệnh và ví dụ đầu ra.
  - Cập nhật `src/components/navbar.tsx` bổ sung liên kết `Mekong CLI (/cli)`.
  - Nâng cấp `src/components/template-card.tsx` hiển thị câu lệnh CLI thực tế và đầu vào/đầu ra cho từng gói Business Pack.
- **Phase 3 (Mekong CLI Dashboard - Command Bridge)**:
  - Nâng cấp `apps/dashboard/app/dashboard/page.tsx` trong `mekong-cli` bổ sung khối `Mekong CLI Command Bridge & Quick Launch` nối kết Terminal và Web Dashboard.
- **Phase 4 (Validation, Testing, PR & Deploy)**:
  - Kiểm thử `npm run typecheck && npm run build` trên `mekongmind/mvp` và `mekong-cli/apps/dashboard`.
  - Commit, push, tạo PR, merge (`--ship`), deploy Cloudflare Pages và kiểm tra `https://mekongmind.com` và `https://mekongmind.com/cli` (`HTTP 200`).

## Acceptance Criteria
- [x] Trang chủ `/` hiển thị trọn vẹn 6 tầng trực quan: Hero bình dân, Terminal Simulator 5 kịch bản, 3 bước hoạt động, 3 phễu VN, 4 Giám đốc C-Suite AI, Bảng Trước/Sau & ROI, Bảng giá Dual-Rail.
- [x] Trang `/cli` hoạt động (`HTTP 200`), có ô tìm kiếm và lọc theo danh mục lệnh thực tế của `mekong-cli`.
- [x] Trang `/templates` hiển thị rõ câu lệnh CLI thực tế trên mỗi thẻ Pack.
- [x] `mekong-cli/apps/dashboard` có khối Command Bridge kết nối dòng lệnh.
- [x] Build & deploy thành công 100% không lỗi.
