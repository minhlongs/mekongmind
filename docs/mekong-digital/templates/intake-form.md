# Discovery Call Intake Form

**Mục đích:** chuẩn hoá thông tin từ mọi cuộc gặp khách → ghi vào Notion `customers/{slug}/00-discovery.md` → mining sau Q4
**Thời lượng cuộc gặp:** 45–60 phút
**Người dẫn:** Sales co-founder hoặc PM
**Format:** structured, KHÔNG free chat — đảm bảo đủ data point

---

## Phần 1: Thông tin cơ bản

| Field | Value | Required |
|---|---|---|
| customer_id | (auto: `{ngành}-{tên-công-ty}-{date}`) | yes |
| meeting_date | YYYY-MM-DD | yes |
| meeting_format | on-site / Zoom / cafe / phone | yes |
| company_name | | yes |
| contact_person | | yes |
| contact_role | owner / manager / director / staff | yes |
| contact_zalo_phone | | yes |
| company_size | __ nhân viên | yes |
| revenue_range | <500tr / 500tr-2tỷ / 2-10tỷ / 10+tỷ /tháng | yes |
| years_in_business | | yes |
| location | tỉnh + thành phố | yes |
| website | url hoặc "không có" | yes |

## Phần 2: Industry & business

| Field | Options |
|---|---|
| industry_primary | food | retail | tourism | services | agri | manufacture | logistics | other |
| industry_sub | (free text — VD: "homestay", "tạp hóa", "gạo xuất khẩu") |
| customer_type | B2C / B2B / both |
| sales_channel_current | brick-store / FB / Zalo / Shopee / Lazada / TikTok / website / direct-sales / other |
| has_export | yes / no — nếu yes, target market: __ |
| has_certification | OCOP / VietGAP / GlobalGAP / ISO / HACCP / không / khác: __ |

## Phần 3: Tech adoption hiện tại

| System | In use | Note |
|---|---|---|
| POS | KiotViet / Sapo / Misa / Excel / sổ giấy / khác | |
| Kế toán | Misa / Fast / Excel / thuê ngoài / khác | |
| Hóa đơn điện tử | Có / Không / Đang tính | |
| Website | Có (URL) / Không | |
| Fanpage Facebook | Có / Không | |
| Zalo OA | Có verified / Có chưa verify / Không | |
| TikTok Business | Có / Không | |
| Email business | Google Workspace / MS 365 / không / khác | |
| CRM | Có (tên) / Không | |
| ERP | Có (tên) / Không | |

## Phần 4: Pain points (CRITICAL FOR PATTERN MINING)

**Yêu cầu ghi structured, KHÔNG paraphrase free text dài:**

### 4.1. Top 3 pain points (rank theo độ đau)

| Rank | Pain category | Cụ thể | Tần suất xảy ra | Cost (estimated) |
|---|---|---|---|---|
| #1 | (chọn từ list bên dưới) | (1 câu) | daily / weekly / monthly | __tr/tháng or qualitative |
| #2 | | | | |
| #3 | | | | |

**Pain category list (chọn 1, không free-form):**
- `data-fragmentation` — dữ liệu bán/kho/kế toán không khớp
- `manual-processes` — Excel/sổ giấy chiếm thời gian
- `web-presence` — không có/có web yếu
- `customer-engagement` — khó giữ KH, không có CRM
- `marketing-distribution` — không biết quảng cáo / chạy không hiệu quả
- `pos-cashflow` — quản lý doanh thu/công nợ
- `inventory-management` — kho lệch, hết hàng / dư hàng
- `staff-management` — quản lý nhân viên, ca, lương
- `compliance-tax` — hóa đơn, thuế, báo cáo
- `traceability` — truy xuất nguồn gốc (xuất khẩu)
- `multi-channel-sync` — sàn TMĐT + cửa hàng không đồng bộ
- `seasonal-cashflow` — dòng tiền theo mùa vụ
- `language-export` — ngôn ngữ thiếu cho xuất khẩu
- `reporting` — không có báo cáo cho lãnh đạo
- `other` — (1 dòng mô tả)

### 4.2. Tried solutions
- Đã thử giải pháp gì? `___`
- Tại sao không thành công? `___`
- Vendor đã làm việc trước đó? `___`

## Phần 5: Budget & decision

| Field | Value |
|---|---|
| budget_band_per_year | <30tr / 30-100tr / 100-300tr / 300tr+ |
| budget_band_monthly | <2tr / 2-10tr / 10-30tr / 30tr+ |
| budget_source | own-cash / loan / grant / mixed |
| decision_maker | self / spouse / partner / board / consultant — ai final? |
| timeline_to_decide | <1 month / 1-3 months / 3-6 months / undefined |
| competing_quotes | yes (mấy quote) / no |

## Phần 6: Gợi ý service mix (filled by sales)

Dựa trên 4 + 5, gợi ý 1–3 service:

| Priority | Service | SOW template | Estimated price |
|---|---|---|---|
| #1 | (chọn từ: WEB / POS / MARKETING / ZALO / VERTICAL) | sow-*.md | __tr |
| #2 | | | |
| #3 | | | |

## Phần 7: Next step

| Field | Value |
|---|---|
| next_step | proposal / second-meeting / on-site-visit / drop |
| follow_up_date | YYYY-MM-DD |
| reminder_set | calendar / Notion / Zalo |
| likelihood_to_close | low (10-30%) / med (30-60%) / high (60-90%) |

## Phần 8: Internal tagging

| Field | Value |
|---|---|
| referral_source | warm-intro (ai?) / cold / event / FB ad / SEO / other |
| pattern_tag | (auto-suggest từ pain category #1) |
| follow_up_owner | tên co-founder / sales |
| meeting_quality_score | 1-5 (1: lãng phí time, 5: high-value lead) |

---

## Output flow

1. Sales fill form trong cuộc gặp (giấy/iPad — KHÔNG bấm laptop trước mặt khách miền Tây)
2. Sau cuộc gặp: copy vào Notion `customers/{slug}/00-discovery.md`
3. Tag vào Airtable database `discovery_log` (cho dashboard tổng)
4. Pain tag CSV append (cho pattern mining query)
5. Nếu next_step = proposal → tạo `01-sow.md` từ template

---

## Checklist cho sales sau mỗi cuộc gặp (TRƯỚC khi rời khách)

- [ ] Đã hỏi đủ Phần 1-5
- [ ] Khách đã đồng ý next step + ngày follow-up
- [ ] Xin được **3 referral name** ("anh chị có biết DN nào cùng nỗi đau này?")
- [ ] Add Zalo của khách (không chỉ phone)
- [ ] Gửi follow-up message Zalo trong 24h kèm summary cuộc gặp
