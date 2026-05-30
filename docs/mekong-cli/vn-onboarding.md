# Hướng Dẫn Onboarding — Mekong AI cho Doanh Nghiệp Việt

> 5 phút từ cài đặt đến hóa đơn đầu tiên. Không cần biết lập trình.

## Yêu Cầu

- macOS / Linux / Windows (WSL2)
- Python 3.11+
- ~/.mekong/ ghi được (sẽ tự tạo)

## Bước 1 — Cài Đặt

```bash
git clone https://github.com/mekong-ai/mekong-cli ~/mekong-cli
cd ~/mekong-cli
python3 -m pip install -r requirements.txt
source scripts/shell-init.sh   # thêm `mekong` vào PATH
```

Hoặc 1 lệnh (khi public install script ready):

```bash
curl -fsSL https://mekongmind.com/install.sh | bash
```

## Bước 2 — Chạy Wizard Tiếng Việt

```bash
python3 -m src.cli.vn_setup
```

Wizard hỏi 4 câu:

1. **Loại hình kinh doanh**: shop online / freelancer / cafe / gia sư / dịch vụ / hộ KD / OPC
2. **Tỉnh/Thành**: HCM / HN / ĐN / CT / HP / khác
3. **Ngân hàng chính**: VCB / TCB / ACB / MB / VTB / BIDV / VPB / khác
4. **Ngành cụ thể** (tự do nhập): thời trang, F&B, IT, v.v.

Output:

- Lưu `~/.mekong/vn_config.json`
- Gợi ý 3-5 command packs phù hợp ngành của bạn

## Bước 3 — Lệnh Đầu Tiên (Hóa Đơn)

```bash
python3 -m src.commands.ke_toan --help    # xem help
```

Tạo hóa đơn mẫu:

```python
from src.commands.ke_toan import create_invoice

inv = create_invoice(
    amount=5_000_000,
    vat_rate=10,
    buyer="Nguyễn Văn A",
    seller="Shop Của Bạn",
    seller_tax_code="0123456789",
)
print(inv.to_summary())   # hiển thị
print(inv.to_xml())       # xuất XML TT78/2021
print(inv.to_journal_entry())  # bút toán VAS
```

## Bước 4 — Tính Thuế TNCN

```python
from src.commands.thue_dnvn import calculate_tncn

result = calculate_tncn(income=30_000_000, dependents=0)
print(f"Thuế phải nộp: {result.tax_amount:,} đ")
# → 2,150,000 đ (lương 30M, không người phụ thuộc)
```

## Bước 5 — Gửi Tin Zalo (Tùy Chọn)

Cần đăng ký Zalo Official Account trước. Sau khi có token:

```bash
export ZALO_OA_ACCESS_TOKEN="your_token_here"
export ZALO_APP_ID="your_app_id"
python3 -m src.commands.zalo_oa caption "áo dài Tết 2026" --tone vui_ve
```

## Đăng Ký Gói Trả Phí (Sau 14 Ngày Trial)

- **Khởi Đầu**: 199.000₫/tháng — 200 credits — đủ cho OPC ~50 lệnh
- **Tăng Trưởng**: 499.000₫/tháng — 800 credits — SME nhỏ
- **Chuyên Nghiệp**: 1.200.000₫/tháng — 3000 credits — SME 10-50 người

Mua qua Polar.sh (USD billing, VND display). Webhook tự động cộng credits.

## Hỗ Trợ

- **Zalo OA**: https://zalo.me/mekongmind
- **Email**: hello@mekongmind.com
- **Facebook**: https://facebook.com/mekongmind
- **GitHub Issues**: https://github.com/mekong-ai/mekong-cli/issues

## Cảnh Báo Pháp Lý

Tư vấn AI **không thay thế** kế toán có chứng chỉ hành nghề / luật sư.
Luôn xác nhận với chuyên gia trước khi nộp hồ sơ chính thức cho cơ quan thuế,
Sở KH&ĐT, hoặc cơ quan BHXH.
