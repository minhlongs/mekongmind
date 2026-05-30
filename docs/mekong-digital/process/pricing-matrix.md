# Pricing Matrix (Internal Reference)

**Last updated:** 2026-04-27
**Owner:** Both founders
**Review cadence:** Quarterly (data-driven adjustment from CSV)
**Currency:** VNĐ unless specified

> Đây là internal pricing — KHÔNG share trực tiếp với khách. Sales đưa ra range trong proposal, đàm phán flexible 10–15%.

---

## 1. Service catalog với 3 tier

### 1.1. WEB (Astro/Next + Tailwind)

| Tier | Setup | Maintenance/mo | Phù hợp |
|---|---|---|---|
| Starter | 5–12tr | 2tr | <5 trang, template-based |
| Standard | 15–25tr | 5tr | 6–10 trang, custom UI |
| Premium | 30–50tr | 15tr | 10+ trang, animation, multi-lang |

**Cost-to-deliver:** ~30–40% setup price (dev time), ~20% maintenance margin
**Margin target:** 50–60% setup, 40–50% maintenance

### 1.2. POS (Reseller KiotViet/Sapo/Misa eShop)

| Tier | Setup | Reseller margin | SAS subscription (khách trả) |
|---|---|---|---|
| Basic | 3tr | 25% Y1 / 15% Y2+ | 200k–500k/mo |
| Standard | 6tr | 25% Y1 / 15% Y2+ | 250k–800k/mo |
| Premium | 12–15tr | 25% Y1 / 15% Y2+ | 300k–1tr/mo |

**Reseller margin trend:** decreasing (-30%/year). Track monthly.

### 1.3. MARKETING (Retainer)

| Tier | Monthly | Setup one-off | Channels |
|---|---|---|---|
| Starter | 10tr | 0–3tr | 2 channels |
| Standard | 18tr | 3–5tr | 4 channels + Ads |
| Premium | 30tr | 5–10tr | All + SEO + influencer |

**6mo discount:** 5% | **12mo discount:** 10%
**Margin target:** 40–50% (high agency variance)

### 1.4. ZALO_OA + Chatbot

| Tier | Setup | Maintenance/mo |
|---|---|---|
| Basic | 5tr | 1tr |
| Standard | 12tr | 2.5tr |
| Premium | 20tr | 5tr |

**ZNS phí (khách trả Zalo):** 500k tối thiểu nạp, ~700đ/tin nhắn

### 1.5. VERTICAL (custom — OCOP/HTX/Tourism/Other)

| Sub-vertical | Tier | Range | Maintenance/mo |
|---|---|---|---|
| OCOP Traceability | MVP | 50–80tr | 3–5tr |
| | Standard | 100–150tr | 5–10tr |
| | Premium | 200–350tr | 10–20tr |
| HTX Nhật Ký | MVP | 80–120tr | 3–5tr |
| | Standard | 150–250tr | 8–15tr |
| | Premium | 300–500tr | 20–35tr |
| Tourism PMS | MVP | 60–100tr | 3–5tr |
| | Standard | 130–220tr | 8–15tr |
| | Premium | 250–450tr | 15–30tr |

---

## 2. Discovery & Strategic Consulting

| Service | Price | Duration |
|---|---|---|
| Discovery workshop (lead-in to vertical project) | 5–15tr | 2–4 buổi |
| Strategy retainer (CTO-as-a-service) | 15–30tr/mo | Ongoing |
| Audit IT/digital current state | 20–50tr | 2–3 weeks |
| Training session (digital skill cho staff) | 5–20tr/buổi | 2h on-site |

**Discovery fee deductible** từ project nếu khách approve project sau (max 50% deduct).

---

## 3. Hourly rates (cho change request, scope creep)

| Role | Rate/giờ | Apply when |
|---|---|---|
| Junior Dev | 300k | Out-of-scope tasks |
| Senior Dev | 800k | Same |
| Designer | 500k | Same |
| PM | 600k | Meeting external, change scope mgmt |
| Founder | 1.5tr | Strategic consulting only |

---

## 4. Bundle discounts (cross-sell)

| Bundle | Saving |
|---|---|
| WEB + ZALO_OA | -5% combined |
| POS + KẾ TOÁN MISA reseller | -10% setup POS |
| WEB + MARKETING 6mo prepaid | -10% Marketing |
| Full stack (WEB + POS + ZALO + MARKETING) | -15% combined |
| VERTICAL + 12mo MAINTENANCE prepaid | -15% maintenance |

---

## 5. Annual contract incentive

| Commit | Discount on monthly |
|---|---|
| 6 months | 5% |
| 12 months | 10% |
| 24 months | 15% |
| 36 months | 18% |

Prepaid (full upfront) bonus: thêm 3% off.

---

## 6. Volume / multi-property

DN có nhiều cơ sở/property/cửa hàng (chuỗi):

| # locations | Per-location pricing |
|---|---|
| 1 | base price |
| 2-5 | -15%/extra location |
| 6-15 | -25%/extra |
| 16+ | custom contract |

---

## 7. Late payment / liquidated damages

- Trễ thanh toán retainer >7 ngày: ngừng service, không hoàn lại tiền tháng đó
- Trễ thanh toán milestone >14 ngày: dự án pause, charge restart fee 2tr
- Cancel sau ký hợp đồng deposit: deposit không hoàn lại
- Cancel mid-project: pay 100% work completed + 30% remaining

---

## 8. Free / pro-bono policy

Hạn mức pro-bono mỗi quý: ≤3 dự án, mỗi dự án ≤30tr value.
Ưu tiên:
1. HTX nông sản nhỏ tại ĐBSCL
2. Trường học, NPO địa phương
3. Lighthouse customer (Y1 only) cho case study

Pro-bono PHẢI có hợp đồng + retro doc đầy đủ — không "favor friend".

---

## 9. Internal cost reference (để tính margin)

### Direct delivery cost
- Junior dev hour: 60–80k (lương ÷ 168h)
- Senior dev hour: 150–200k
- Designer hour: 80–120k
- PM hour: 100–150k

### Overhead (allocate per project)
- Office + tools: ~5tr/người/tháng
- Marketing self: ~5–10tr/tháng
- Insurance + admin: ~3tr/người/tháng

### Margin formula
```
Project margin = price - (delivery_hours * blended_rate) - (overhead * project_duration / team_capacity)
Target margin %: ≥30% per project
```

Nếu margin <20% → red flag, review pricing tier hoặc decline tương lai.

---

## 10. Pricing review trigger

Quarterly review pricing nếu:
- 3+ projects margin <25% trong quý
- Reseller margin (KiotViet/Sapo/Misa) drop >5%
- Inflation lương dev >10% YoY
- Đối thủ HCM mở VPĐD CT giảm giá rõ rệt
- 5+ deals lost vì price (track in Pain Tag CSV `lost_reason=price`)
