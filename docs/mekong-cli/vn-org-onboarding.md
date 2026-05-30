# Mekong Hub: Sổ Tay Vận Hành & Kích Hoạt Tổ Chức (VN Org Onboarding Playbook)

Tài liệu này hướng dẫn nhà sáng lập (Founder) cách quản lý chu kỳ dùng thử (Free Trial), thời gian gia hạn (Grace Period), tạm dừng (Suspension) và kích hoạt lại (Reactivation) đối với các tổ chức đăng ký tự phục vụ (Self-Signup Org) trên Mekong Hub.

---

## 1. Chu Kỳ Trạng Thái Tổ Chức (Org Status Lifecycle)

Hệ thống quản lý trạng thái tự động theo mô hình máy trạng thái dưới đây:

```
[ Đăng ký mới ] ───► Trạng thái: 'unverified'
                           │
                           │ (Dùng thử 14 ngày miễn phí phí nền tảng)
                           ▼
                 [ Hết hạn dùng thử ] (Nhận cảnh báo hàng ngày trong 7 ngày)
                           │
                           ▼ (Hết 7 ngày gia hạn mà chưa thanh toán)
                 Trạng thái: 'suspended' (Bị khóa API)
                           │
      ┌────────────────────┴────────────────────┐
      ▼ (Thanh toán qua Polar.sh)               ▼ (Kích hoạt thủ công)
 Trạng thái: 'active'                      Trạng thái: 'active'
```

### Các trạng thái hợp lệ (`orgs.status`):
*   `unverified`: Trạng thái mặc định khi vừa khởi tạo. Tổ chức có 14 ngày dùng thử miễn phí.
*   `active`: Đã thanh toán phí nền tảng thông qua Polar.sh và thời hạn thanh toán (`platform_fee_paid_until`) còn hiệu lực.
*   `suspended`: Bị tạm ngưng hoạt động do quá hạn dùng thử và 7 ngày gia hạn mà chưa trả phí. Tất cả API (trừ API thanh toán và lấy thông tin tổ chức) sẽ bị trả về mã lỗi HTTP 403.
*   `cancelled`: Đã hủy đăng ký gói phí (sau khi nhận webhook hủy từ Polar.sh).

---

## 2. Học Thuyết Học Thuyết Tổ Chức Mặc Định (`default`)

*   Tổ chức mang ID `default` là tổ chức của nhà sáng lập (Founder Org).
*   **Học thuyết miễn trừ**: Để duy trì tính tương thích ngược với các phiên bản trước đó (Phase 6-8), tổ chức `default` hoàn toàn được miễn trừ khỏi tất cả các kiểm tra thanh toán.
*   Hàm `assert_org_billing_ok` sẽ ngay lập tức trả về `OK` nếu `org_id == "default"`.
*   Các từ khóa/slugs bị hạn chế đăng ký bao gồm: `default`, `admin`, `api`, `www`.

---

## 3. Thiết Lập Tự Động Hóa Qua Cron (Daily Cron Setup)

Daily cron script `scripts/check-org-trials.py` cần được chạy mỗi ngày một lần vào buổi sáng (ví dụ: 6:00 AM) để quét và cập nhật trạng thái.

### Phương án 1: Sử dụng Crontab (Khuyên dùng trên Linux/macOS Server)

Thêm dòng sau vào crontab (`crontab -e`):

```bash
0 6 * * * /Users/macbook/mekong-cli/.venv/bin/python /Users/macbook/mekong-cli/scripts/check-org-trials.py >> /Users/macbook/.mekong/cron-run.log 2>&1
```

### Phương án 2: Sử dụng launchd (macOS Local Daemon)

Tạo file `~/Library/LaunchAgents/dev.mekong.check-trials.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.mekong.check-trials</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/macbook/mekong-cli/.venv/bin/python</string>
        <string>/Users/macbook/mekong-cli/scripts/check-org-trials.py</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/macbook/.mekong/cron-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/macbook/.mekong/cron-stderr.log</string>
</dict>
</plist>
```

Kích hoạt daemon:
```bash
launchctl bootstrap gui/501 ~/Library/LaunchAgents/dev.mekong.check-trials.plist
```

---

## 4. Tích Hợp Cổng Thanh Toán Polar.sh

Để vận hành tự động hóa cổng thanh toán:

1.  **Tạo Sản Phẩm**: Tạo sản phẩm đăng ký thành viên (Subscription) trên Dashboard của Polar.sh với mức giá cố định (ví dụ: $29/tháng).
2.  **Thiết Lập Env**:
    *   `POLAR_PRODUCT_ID_ORG_PLATFORM_FEE`: ID sản phẩm vừa tạo trên Polar.sh.
    *   `POLAR_WEBHOOK_SECRET`: Khóa bí mật dùng để xác thực webhook gửi từ Polar.sh.
    *   `RESEND_API_KEY`: API key của Resend để gửi email cảnh báo tự động.
3.  **Cấu Hình Webhook URL**: Cấu hình webhook trên Polar.sh hướng về địa chỉ: `https://api.mekong.dev/v1/billing/webhook/org`.

---

## 5. Quy Trình Kích Hoạt Thủ Công (Manual VIP/Offline Reactivation)

Đối với các khách hàng VIP thanh toán chuyển khoản thủ công (không qua cổng Polar.sh):

1.  **Bước 1**: Đăng nhập trực tiếp vào CLI của SQLite chứa database `pilot.db`:
    ```bash
    sqlite3 /Users/macbook/.mekong/pilot.db
    ```
2.  **Bước 2**: Thực hiện câu lệnh SQL cập nhật thủ công thời hạn thanh toán (ví dụ kích hoạt 1 năm đến 31/12/2026):
    ```sql
    UPDATE orgs 
    SET status = 'active',
        platform_fee_paid_until = '2026-12-31T23:59:59.000000Z',
        polar_org_subscription_id = 'manual_offline_vip'
    WHERE org_id = 'ten-to-chuc-vip';
    ```
3.  **Bước 3**: Kiểm tra lại trạng thái:
    ```sql
    SELECT org_id, status, platform_fee_paid_until FROM orgs WHERE org_id = 'ten-to-chuc-vip';
    ```
