---
title: "CLI Registry Explorer Numbered Pagination & Page-Size Controls"
status: completed
branch: feat/cli-registry-pagination
created_at: 2026-10-27
---

# Plan: CLI Registry Explorer Numbered Pagination & Page-Size Controls

## 1. Objective
Implement numbered pagination and a page-size selector (`12`, `24`, `48`, `all` / 197) for Tier 4 (Full 100% Command Registry Explorer) on `https://www.mekongmind.com/cli` (`mvp/src/app/(landing)/cli/page.tsx`), maintaining 0ms full-registry search and cross-mapping filters across all 197 commands.

## 2. Acceptance Criteria
1. Tier 4 defaults to `24` commands per page (8 rows × 3 columns on desktop, 12 rows × 2 columns on tablet — Page 1 of 9 for 197 commands).
2. A Page Size selector supports `12`, `24` (default), `48`, and `'all'` (all 197 commands).
3. Both Top and Bottom pagination bars render range indicators (`Hiển thị X–Y / Z nhóm lệnh (Trang P/T)`) and numbered page buttons (`« Đầu`, `‹ Trước`, numbered pages with ellipsis, `Sau ›`, `Cuối »`).
4. Changing `searchQuery`, `selectedLayer`, `selectedDept`, `selectedCluster`, or `pageSize` automatically resets `currentPage` to `1`.
5. Changing pages from the bottom pagination bar smoothly scrolls to `#command-registry-explorer`.
6. If the currently inspected command (`inspectedCommand`) is present in `filteredCommands` on another page, a quick-jump button (`📍 Nhảy tới trang X chứa lệnh đang thanh tra`) jumps directly to that page.
7. `npm run build` in `mvp/` and `pytest tests/test_cli_full_registry_cross_mapping.py` pass with 0 errors.

## 3. Implementation Steps
- **Phase 1**: Add `PageSizeOption` (`12 | 24 | 48 | 'all'`), `PAGE_SIZE_OPTIONS`, and pure helper `buildPaginationItems(currentPage, totalPages)` to `mvp/src/app/(landing)/cli/page.tsx`.
- **Phase 2**: Wire `pageSize` and `currentPage` state, compute `paginatedCommands`, `totalPages`, `rangeStart`, `rangeEnd`, and `inspectedCommandPage`, and reset `currentPage` on any filter/search change.
- **Phase 3**: Render Top and Bottom pagination controls around the Tier 4 command grid (`#command-registry-explorer`).
- **Phase 4**: Add pagination verification assertions to `tests/test_cli_full_registry_cross_mapping.py`, run `npm run build` and `pytest`, ship PR, merge, and deploy to Cloudflare Pages.
