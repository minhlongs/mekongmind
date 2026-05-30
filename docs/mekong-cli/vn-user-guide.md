# Mekong AI — User Guide (Tiếng Việt)

> Hướng dẫn đầy đủ cho doanh nghiệp 1 người Việt Nam.
> Áp dụng cho: Hộ kinh doanh, OPC (Công ty 1 thành viên), Freelancer, Shop online.

## Mục Lục

1. [Tổng Quan Kiến Trúc](#tổng-quan-kiến-trúc)
2. [Phòng Kế Toán](#phòng-kế-toán-ke-toan)
3. [Phòng Thuế](#phòng-thuế-thue-dnvn)
4. [Phòng Marketing — Zalo OA](#phòng-marketing--zalo-oa)
5. [Phòng Tài Chính — VietQR](#phòng-tài-chính--vietqr)
6. [Phòng Vận Hành — BHXH](#phòng-vận-hành--bhxh)
7. [Phòng Pháp Lý](#phòng-pháp-lý)
8. [Tích Hợp MISA / Phần Mềm Khác](#tích-hợp-misa--phần-mềm-khác)
9. [Monitoring & Pilot Metrics](#monitoring--pilot-metrics)
10. [FAQ](#faq)

---

## Tổng Quan Kiến Trúc

```
┌────────────────────────────────────────────────────────┐
│                    Người dùng VN                       │
│      (chủ shop / freelancer / cafe owner)              │
└──────────────────────┬─────────────────────────────────┘
                       │ tiếng Việt tự nhiên
                       ▼
              ┌────────────────────┐
              │   mekong CLI       │
              │   (Python 3.11+)   │
              └────────┬───────────┘
                       │
       ┌───────────────┼─────────────────────────┐
       ▼               ▼                         ▼
  ┌──────────┐   ┌──────────┐            ┌──────────────┐
  │ ke-toan  │   │ thue-    │   ......   │  zalo-oa     │
  │ (VAS)    │   │ dnvn     │            │  vietqr      │
  └────┬─────┘   └────┬─────┘            └──────┬───────┘
       │              │                          │
       ▼              ▼                          ▼
   XML TT78    Bậc lũy tiến                Zalo API
   Bút toán    TNCN/TNDN/GTGT              VietQR scheme
```

### Tenant Isolation

Mỗi user có `tenant_id` riêng. KV namespace: `tenant_{tenant_id}`. Dữ liệu KHÔNG share giữa users.

---

## Phòng Kế Toán (`ke-toan`)

### 1. Tạo Hóa Đơn Điện Tử

```python
from src.commands.ke_toan import create_invoice

inv = create_invoice(
    amount=5_000_000,         # 5 triệu trước VAT
    vat_rate=10,              # 10% VAT
    buyer="Nguyễn Văn A",
    seller="Cửa Hàng ABC",
    seller_tax_code="0123456789",
    description="Hàng tiêu dùng",
)
```

### 2. Xuất Hóa Đơn

| Format | Code | Mục đích |
|--------|------|----------|
| Summary text | `inv.to_summary()` | Hiển thị cho khách |
| XML TT78/2021 | `inv.to_xml()` | Upload Cổng thông tin Thuế |
| Bút toán VAS | `inv.to_journal_entry()` | Sổ kế toán |

### 3. Multi-Item Invoice

```python
from src.commands.ke_toan import Invoice, InvoiceItem
from decimal import Decimal
from datetime import date

inv = Invoice(
    seller_name="Bakery Sài Gòn",
    seller_tax_code="0312345678",
    buyer_name="Khách hàng",
    invoice_date=date(2026, 5, 17),
    items=[
        InvoiceItem("Croissant", Decimal("3"), Decimal("45000"), vat_rate=8),
        InvoiceItem("Cà phê", Decimal("2"), Decimal("35000"), vat_rate=10),
    ],
)
print(inv.to_summary())
```

### 4. VAT Rates Hỗ Trợ

| Rate | Khi dùng |
|------|---------|
| 0% | Xuất khẩu, dịch vụ nước ngoài |
| 5% | Y tế, giáo dục, nước sạch, thực phẩm thiết yếu |
| 8% | Giảm thuế theo NĐ 15/2022 (khôi phục kinh tế) |
| 10% | Thông thường (hầu hết hàng hóa/dịch vụ) |

### 5. Bút Toán VAS (Tài Khoản Sử Dụng)

| TK | Tên | Vai trò |
|----|-----|---------|
| 131 | Phải thu khách hàng | Nợ khi bán chịu |
| 511 | Doanh thu bán hàng | Có khi ghi doanh thu |
| 3331 | Thuế GTGT đầu ra | Có khi thu VAT |
| 111 | Tiền mặt | Khi thu tiền mặt |
| 112 | Tiền gửi ngân hàng | Khi thu chuyển khoản |

---

## Phòng Thuế (`thue-dnvn`)

### 1. Thuế TNCN (Cá Nhân) — Biểu Lũy Tiến 7 Bậc

```python
from src.commands.thue_dnvn import calculate_tncn

result = calculate_tncn(income=30_000_000, dependents=2)
print(f"Thu nhập chịu thuế: {result.taxable_income:,} đ")
print(f"Thuế phải nộp:      {result.tax_amount:,} đ")
print(f"Thu nhập sau thuế:  {result.net_income:,} đ")
```

**Biểu Lũy Tiến (cập nhật mới nhất):**

| Bậc | Thu nhập chịu thuế / tháng | Thuế suất |
|-----|---------------------------|-----------|
| 1 | Đến 5 triệu | 5% |
| 2 | Trên 5tr đến 10tr | 10% |
| 3 | Trên 10tr đến 18tr | 15% |
| 4 | Trên 18tr đến 32tr | 20% |
| 5 | Trên 32tr đến 52tr | 25% |
| 6 | Trên 52tr đến 80tr | 30% |
| 7 | Trên 80tr | 35% |

**Giảm trừ:**
- Bản thân: 11 triệu/tháng
- Người phụ thuộc: 4.4 triệu/người/tháng

### 2. Thuế TNDN (Doanh Nghiệp)

```python
from src.commands.thue_dnvn import calculate_tndn

result = calculate_tndn(annual_revenue=2_500_000_000)  # 2.5 tỷ
print(f"Thuế suất:    {result.rate*100:.0f}%")   # 17% (SME)
print(f"Thuế TNDN:    {result.tax_amount:,} đ")
```

| Điều kiện | Thuế suất |
|-----------|-----------|
| Doanh thu ≤ 3 tỷ/năm (SME) | 17% |
| Doanh thu > 3 tỷ/năm | 20% |
| Một số ngành ưu đãi | 10% hoặc 15% (cần xác nhận) |

### 3. Thuế GTGT (VAT)

```python
from src.commands.thue_dnvn import calculate_gtgt

g = calculate_gtgt(amount=10_000_000, rate=10)
# {"before_tax": 10000000, "vat": 1000000, "total": 11000000, "rate_pct": 10}
```

---

## Phòng Marketing — Zalo OA

### 1. Setup Zalo Official Account

1. Đăng ký tại https://oa.zalo.me
2. Verify business (cần giấy phép KD)
3. Lấy `access_token` + `app_id`
4. Set env:

```bash
export ZALO_OA_ACCESS_TOKEN="..."
export ZALO_APP_ID="..."
```

### 2. Gửi Tin Nhắn Cá Nhân

```bash
python3 -m src.commands.zalo_oa send <user_id> "Cảm ơn đã đặt hàng!"
```

### 3. Broadcast (Cần OA Verified)

```bash
python3 -m src.commands.zalo_oa broadcast "Khuyến mãi cuối tuần — giảm 30%"
```

### 4. Lấy Followers

```bash
python3 -m src.commands.zalo_oa followers --count 100
```

### 5. Tạo Caption Tự Động (Offline)

```bash
python3 -m src.commands.zalo_oa caption "áo dài Tết 2026" --tone vui_ve
```

3 tone: `than_thien` / `chuyen_nghiep` / `vui_ve`.

### 6. Đăng Bài Viết

```bash
python3 -m src.commands.zalo_oa post "Tiêu đề" "Nội dung dài" --cover "https://..."
```

---

## Phòng Tài Chính — VietQR

VietQR là chuẩn QR thanh toán hỗ trợ 40+ ngân hàng VN.

### Tạo QR Thanh Toán

```python
from integrations.vietqr import generate_qr

qr_data = generate_qr(
    bank_code="TCB",          # VCB, TCB, ACB, MB, BIDV, VTB...
    account="19012345678",
    amount=250_000,
    description="HD2026-001",
)
# qr_data["qr_string"]  → VietQR-compatible string (encode thành QR image)
# qr_data["account_name"] → resolved owner (nếu có lookup API)
```

### List Ngân Hàng Hỗ Trợ

8 ngân hàng phổ biến đã trong wizard. Đầy đủ 40+ ngân hàng xem
https://vietqr.io/api/banks.

---

## Phòng Vận Hành — BHXH

### Tính BHXH Cho Nhân Viên

```python
from src.commands.bhxh import calculate_bhxh

result = calculate_bhxh(salary=15_000_000, num_employees=1)
print(f"NLĐ đóng (10.5%):    {result.employee_contribution:,} đ")
print(f"NSDLĐ đóng (22%):    {result.employer_contribution:,} đ")
print(f"Tổng phải nộp:        {result.total:,} đ")
```

**Tỷ lệ chuẩn (Luật BHXH 2014):**

| Bên đóng | BHXH | BHYT | BHTN | Tổng |
|----------|------|------|------|------|
| Người lao động | 8% | 1.5% | 1% | **10.5%** |
| Người sử dụng LĐ | 17.5% | 3% | 1% | **21.5-22%** |

### Mức Lương Tham Chiếu

- Mức lương tối thiểu vùng (2026): ~5tr (Vùng I), thay đổi theo NĐ chính phủ
- Mức lương đóng BHXH tối đa: 20 × mức lương cơ sở

---

## Phòng Pháp Lý

### Các Loại Hình DN Được Hỗ Trợ

| Loại | Vốn pháp định | Ưu/Nhược điểm |
|------|---------------|---------------|
| Hộ kinh doanh | Không có | Đơn giản, nhưng không có pháp nhân |
| OPC (Công ty 1 TV) | Không có | Pháp nhân, trách nhiệm hữu hạn |
| TNHH 2+ TV | Không có | 2-50 thành viên |
| Cổ phần | 10 tr+ | Phát hành cổ phiếu, IPO |

### Hợp Đồng Mẫu

```bash
python3 -m src.commands.phap_ly_vn hop-dong "dịch vụ tư vấn IT"
```

Sinh hợp đồng dịch vụ mẫu với điều khoản:
- Phạm vi công việc
- Thanh toán + thuế GTGT 10%
- Bảo mật (theo NĐ 13/2023 PDPA)
- Giải quyết tranh chấp

### Tuân Thủ PDPA (NĐ 13/2023)

Mọi dữ liệu cá nhân khách hàng (CCCD, SĐT, email) phải:
1. Được sự đồng ý rõ ràng
2. Lưu trữ có mã hóa
3. Không transfer ra nước ngoài không có cam kết bảo vệ
4. Cho phép xóa khi user yêu cầu

---

## Tích Hợp MISA / Phần Mềm Khác

### Export Bút Toán Sang MISA CSV

```python
from integrations.misa_csv import to_misa_csv
from src.commands.ke_toan import create_invoice

inv = create_invoice(amount=5_000_000, vat_rate=10, buyer="A")
csv_str = to_misa_csv([inv.to_journal_entry()])
# Save and import vào MISA SME / AMIS
```

### Format MISA SME 2027

Cột bắt buộc:
- `Ngày HT` (date hạch toán)
- `Số CT` (số chứng từ)
- `Diễn giải`
- `TK Nợ`, `TK Có`
- `Số tiền`

---

## Monitoring & Pilot Metrics

### Theo Dõi Sử Dụng 10 Pilot Users

```bash
python3 scripts/pilot-metrics.py --days 7 --source both
python3 scripts/pilot-metrics.py --user opc_001        # drill-down
python3 scripts/pilot-metrics.py --csv report.csv       # export
```

Source order: PostHog (nếu set credentials) + local JSONL fallback
`~/.mekong/usage_events.jsonl`.

### KPIs Đo Trong Pilot

| Metric | Target | Cách đo |
|--------|--------|---------|
| Active users | 10/10 | PostHog distinct_id |
| Commands/user/week | ≥ 5 | Aggregate events |
| Error rate | < 10% | Failed/total events |
| TTFT (Time to First Token) | < 1s | Gateway logs |
| NPS | ≥ 7/10 | Weekly Zalo poll |
| Conversion to paid | ≥ 50% | Polar.sh dashboard |

---

## FAQ

### Q1: Tôi có cần biết lập trình không?

**Không.** Bạn chỉ cần biết gõ tiếng Việt. Mekong AI hiểu câu lệnh tự nhiên:
"tạo hoá đơn 5 triệu cho Nguyễn Văn A".

### Q2: Dữ liệu có riêng tư không?

**Có.** Mỗi user có namespace riêng (tenant isolation). Mekong AI có thể chạy
local trên máy bạn (MLX/Ollama) — dữ liệu KHÔNG rời máy.

### Q3: Có thể dùng offline không?

Một phần có. `ke-toan`, `thue-dnvn`, `phap-ly-vn` chạy offline. Zalo OA / VietQR
cần internet.

### Q4: Tư vấn AI có thay thế kế toán không?

**Không.** Mekong AI là trợ lý, không phải người hành nghề có chứng chỉ. Luôn
xác nhận với chuyên gia trước khi nộp hồ sơ chính thức.

### Q5: Thanh toán bằng VND được không?

Hiện tại qua Polar.sh bằng USD (đã quy đổi VND, hiển thị 199.000₫). Roadmap Q3/2026
hỗ trợ VietQR/chuyển khoản trực tiếp.

### Q6: Backup dữ liệu thế nào?

Config + invoices lưu local trong `~/.mekong/`. Tự backup bằng:

```bash
tar czf mekong-backup-$(date +%Y%m%d).tar.gz ~/.mekong/
```

### Q7: Pilot có miễn phí không?

Trong 8 tuần đầu pilot (10 users đầu tiên): hoàn toàn miễn phí. Sau pilot:
discount 50% tháng đầu nếu convert.

---

## Hỗ Trợ & Liên Hệ

- **Zalo OA** (primary): https://zalo.me/mekongmind
- **Email**: hello@mekongmind.com
- **Facebook Page**: https://facebook.com/mekongmind
- **GitHub Issues**: https://github.com/mekong-ai/mekong-cli/issues

**Disclaimer cuối:** Tư vấn AI không thay thế kế toán/luật sư có chứng chỉ hành
nghề. Mọi quyết định pháp lý quan trọng cần xác nhận với chuyên gia trước khi
nộp hồ sơ chính thức cho cơ quan nhà nước.
