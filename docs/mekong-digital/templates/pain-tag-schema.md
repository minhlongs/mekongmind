# Pain Tag CSV Schema (Pattern Mining Foundation)

**Purpose:** Mỗi customer interaction → 1 dòng structured. Q4 chạy SQL/pivot để tìm pattern lặp ≥5 lần → product candidate.

**Storage:** `docs/customers/_pain-tags.csv` (gitignored — chứa data khách) HOẶC Airtable / Supabase Postgres / Google Sheets (recommend Airtable cho UX).

**Filled by:** Sales co-founder ngay sau discovery call HOẶC PM khi closing project.

---

## Schema (CSV columns)

```csv
customer_id,date,industry,industry_sub,company_size,revenue_range,location,
pain_category_1,pain_specific_1,pain_frequency_1,pain_cost_1,
pain_category_2,pain_specific_2,pain_frequency_2,pain_cost_2,
pain_category_3,pain_specific_3,pain_frequency_3,pain_cost_3,
budget_band,decision_timeline,referral_source,
service_proposed,service_signed,deal_size,
status,closed_at,
likely_repeatable,product_candidate_notes,assigned_pm,quality_score
```

## Field definitions

### customer_id
Format: `{industry-3}-{company-slug}-{YYMMDD}`
VD: `agr-htx-tan-phu-260427`, `f&b-cafe-binh-thuy-260427`

### date
Discovery call date, YYYY-MM-DD.

### industry (controlled vocab)
`food | retail | tourism | services | agri | manufacture | logistics | construction | health | education | other`

### industry_sub
Free text 1-2 words. VD: "homestay", "gạo xuất khẩu", "tạp hóa".

### company_size
Bucket: `1-5 | 6-10 | 11-30 | 31-50 | 51-100 | 100+`

### revenue_range (per month)
Bucket: `<500tr | 500tr-2t | 2-10t | 10t+`

### location
Format: `tỉnh|thành phố`. VD: `cần thơ|ninh kiều`, `an giang|long xuyên`.

### pain_category_{1,2,3}
**Controlled vocabulary (CRITICAL):**
- `data-fragmentation`
- `manual-processes`
- `web-presence`
- `customer-engagement`
- `marketing-distribution`
- `pos-cashflow`
- `inventory-management`
- `staff-management`
- `compliance-tax`
- `traceability`
- `multi-channel-sync`
- `seasonal-cashflow`
- `language-export`
- `reporting`
- `other`

KHÔNG dùng category mới nếu chưa thêm vào schema. Nếu cần thêm → discuss tuần Q-review, update schema, backfill.

### pain_specific_{1,2,3}
Free text, ≤80 char. 1 câu mô tả cụ thể.
VD: `data-fragmentation` + specific: "POS KiotViet không sync với Misa kế toán, end-month đối chiếu mất 2 ngày"

### pain_frequency_{1,2,3}
`daily | weekly | monthly | seasonal | one-off`

### pain_cost_{1,2,3}
Quantitative nếu được: `5tr/tháng` hoặc `40h/tháng`. Qualitative fallback: `low | med | high`.

### budget_band (per year)
`<30tr | 30-100tr | 100-300tr | 300tr+ | undefined`

### decision_timeline
`<1m | 1-3m | 3-6m | 6m+ | undefined`

### referral_source
`warm-intro | cold-call | event-vcci | event-bni | fb-ad | seo | partner | other`

### service_proposed
List comma-separated service types:
`WEB,POS,MARKETING,ZALO,VERTICAL` (multi possible)

### service_signed
Subset of proposed actually closed. Empty nếu chưa close.

### deal_size
VNĐ closed value (one-off + estimated 12mo retainer). Empty nếu chưa close.

### status
`discovery | proposal-sent | negotiating | won | lost | dropped | on-hold`

### closed_at
Date YYYY-MM-DD when status = won|lost|dropped.

### likely_repeatable
`yes | maybe | no | unknown` — gut feel sales: pain này có thể lặp ở DN khác cùng ngành không?

### product_candidate_notes
Free text. Phần nào của solution có thể productize? VD: "QR generator + landing page builder reusable".

### assigned_pm
Tên PM/founder phụ trách.

### quality_score
1-5: chất lượng lead/customer. 1 = lãng phí time, 5 = strategic customer.

---

## Sample row

```csv
customer_id,date,industry,industry_sub,company_size,revenue_range,location,pain_category_1,pain_specific_1,pain_frequency_1,pain_cost_1,pain_category_2,pain_specific_2,pain_frequency_2,pain_cost_2,pain_category_3,pain_specific_3,pain_frequency_3,pain_cost_3,budget_band,decision_timeline,referral_source,service_proposed,service_signed,deal_size,status,closed_at,likely_repeatable,product_candidate_notes,assigned_pm,quality_score
agr-htx-tan-phu-260427,2026-04-27,agri,htx-rice,30,500tr-2t,đồng tháp|tam nông,traceability,"EU yêu cầu nguồn gốc lúa, hiện ghi tay không đáp",seasonal,high,manual-processes,"50 xã viên ghi nhật ký giấy, mất khi mưa",daily,med,reporting,"không có report cho cấp tỉnh",monthly,med,100-300tr,3-6m,warm-intro,VERTICAL,,,"discovery",,yes,"HTX nhật ký số + traceability QR — khả năng cao 100+ HTX có cùng nhu cầu",khanh,4
```

---

## Mining queries (run quarterly)

### Q1: Pain pattern lặp
```sql
SELECT pain_category_1, industry, COUNT(*) as n,
       AVG(deal_size) as avg_deal,
       SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won_count
FROM pain_tags
WHERE date >= '2026-01-01'
GROUP BY pain_category_1, industry
HAVING n >= 5
ORDER BY n DESC, avg_deal DESC;
```

### Q2: Likelihood to productize
```sql
SELECT industry, pain_category_1, COUNT(*) as n,
       SUM(CASE WHEN likely_repeatable='yes' THEN 1 ELSE 0 END) as repeatable_count
FROM pain_tags
WHERE status='won'
GROUP BY industry, pain_category_1
HAVING repeatable_count >= 3
ORDER BY repeatable_count DESC;
```

### Q3: Conversion funnel
```sql
SELECT
  COUNT(*) as total_discovery,
  SUM(CASE WHEN status IN ('proposal-sent','negotiating','won') THEN 1 ELSE 0 END) as proposed,
  SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won,
  SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as conversion_rate
FROM pain_tags;
```

### Q4: Referral source ROI
```sql
SELECT referral_source,
       COUNT(*) as leads,
       SUM(CASE WHEN status='won' THEN deal_size ELSE 0 END) as revenue,
       AVG(quality_score) as avg_quality
FROM pain_tags
GROUP BY referral_source
ORDER BY revenue DESC;
```

---

## Migration to product

Khi 1 pattern hit `≥5 customer cùng pain_category + industry + likely_repeatable=yes`:

1. PM viết 1-page product spec from `product_candidate_notes` aggregated
2. Tech lead đánh giá: build từ existing service code? OR greenfield?
3. Quý sau: reserve 20% dev capacity → MVP
4. Alpha test với 3 customer hiện hữu (free 6 months)
5. Migrate sang `apps/{vertical}-saas/` repo
