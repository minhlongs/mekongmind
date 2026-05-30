#!/usr/bin/env python3
"""Daily cron entry point to manage organization trials and suspensions.

Steps:
1. Identify and suspend orgs past trial + 7d grace.
2. Identify orgs in grace period and send email warnings to admins.
3. Purge expired magic link tokens.
4. Clean up polar webhook events older than 90 days.

Supports --dry-run.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.services import org_service, magic_link_service, resend_client


def _parse_iso_utc(ts: str) -> datetime:
    """Parse ISO timestamp, replacing 'Z' with +00:00 for timezone-aware comparison."""
    clean = ts.replace("Z", "+00:00")
    return datetime.fromisoformat(clean)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def main() -> None:
    parser = argparse.ArgumentParser(description="Check Mekong org trial and billing status.")
    parser.add_argument("--dry-run", action="store_true", help="Perform checks without writing changes or sending emails.")
    args = parser.parse_args()

    now = _now_utc()
    today_str = now.strftime("%Y-%m-%d")

    print(f"[{now.isoformat()}] Running mekong trial check. Dry run: {args.dry_run}")

    # -------------------------------------------------------------------------
    # Step 1: Suspend expired orgs
    # -------------------------------------------------------------------------
    if args.dry_run:
        # Mock what would be suspended
        cutoff = (now - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"
        conn = org_service._open_conn()
        try:
            rows = conn.execute(
                """
                SELECT org_id FROM orgs 
                WHERE status NOT IN ('active', 'suspended')
                  AND trial_expires_at < ?
                  AND polar_org_subscription_id IS NULL
                """,
                (cutoff,),
            ).fetchall()
            would_suspend = [r["org_id"] for r in rows]
            print(f"[Step 1] Dry-run: Would suspend {len(would_suspend)} orgs: {would_suspend}")
        finally:
            conn.close()
    else:
        suspended = org_service.suspend_expired_orgs()
        print(f"[Step 1] Suspended {len(suspended)} orgs: {suspended}")

    # -------------------------------------------------------------------------
    # Step 2: Send warning emails for orgs in grace period
    # -------------------------------------------------------------------------
    # Orgs in grace: status NOT IN ('active', 'suspended'), polar_sub is NULL,
    # and trial_expires_at is in the past (so now > trial_expires_at).
    # Since they haven't been suspended yet, they must be in the 7-day grace.
    conn = org_service._open_conn()
    try:
        rows = conn.execute(
            """
            SELECT org_id, display_name, trial_expires_at FROM orgs
            WHERE status NOT IN ('active', 'suspended')
              AND polar_org_subscription_id IS NULL
              AND trial_expires_at < ?
            """,
            (now.strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",),
        ).fetchall()
    finally:
        conn.close()

    # Load already-sent warnings for today
    sent_log_dir = Path.home() / ".mekong"
    sent_log_path = sent_log_dir / "trial-warning-sent.jsonl"
    sent_today: set[str] = set()

    if sent_log_path.exists():
        try:
            with open(sent_log_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        if record.get("date") == today_str:
                            sent_today.add(record.get("org_id"))
                    except json.JSONDecodeError:
                        pass
        except Exception as exc:
            print(f"Warning: Failed to read sent warnings log: {exc}")

    base_url = os.environ.get("MEKONG_PUBLIC_BASE_URL", "https://api.mekong.dev")
    warn_count = 0

    for r in rows:
        org_id = r["org_id"]
        display_name = r["display_name"]
        trial_expires_at = r["trial_expires_at"]

        if org_id in sent_today:
            print(f"[Step 2] Skip: Warning already sent today for org '{org_id}'")
            continue

        dt_expires = _parse_iso_utc(trial_expires_at)
        dt_cutoff = dt_expires + timedelta(days=7)
        seconds_left = (dt_cutoff - now).total_seconds()
        days_left = int(math.ceil(seconds_left / 86400))

        if days_left <= 0:
            # Should be suspended already, skip warning
            continue

        # Get admins
        conn = org_service._open_conn()
        try:
            admin_rows = conn.execute(
                "SELECT email FROM org_members WHERE org_id = ? AND scope = 'org_admin'",
                (org_id,),
            ).fetchall()
        finally:
            conn.close()

        admins = [ar["email"] for ar in admin_rows]
        if not admins:
            print(f"[Step 2] Warn: Org '{org_id}' has no admins. Skipping email.")
            continue

        checkout_url = f"{base_url}/v1/billing/checkout/org?org_id={org_id}"
        subject = f"Tổ chức {display_name} sắp bị tạm dừng — {days_left} ngày còn lại"
        html = f"""<html>
<body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #dc2626;">Mekong Hub</h2>
  <p>Xin chào,</p>
  <p>Thời gian dùng thử phí nền tảng của tổ chức <strong>{display_name}</strong> đã hết hạn.</p>
  <p>Tổ chức của bạn sắp bị tạm dừng hoạt động. Bạn còn <strong>{days_left} ngày</strong> để hoàn tất thanh toán trước khi dịch vụ bị gián đoạn:</p>
  <p style="margin: 24px 0;">
    <a href="{checkout_url}"
       style="background-color: #dc2626; color: white; padding: 12px 24px;
              text-decoration: none; border-radius: 6px; display: inline-block;">
      Thanh toán ngay
    </a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">
    Hoặc copy URL thanh toán: <code style="word-break: break-all;">{checkout_url}</code>
  </p>
  <p style="color: #6b7280; font-size: 13px;">
    Nếu bạn đã thực hiện thanh toán, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 12px;">Mekong Hub — Nền tảng cho doanh nghiệp một người Việt Nam</p>
</body>
</html>""".strip()

        print(f"[Step 2] Sending warning to admins of '{org_id}' ({days_left} days left). Emails: {admins}")
        warn_count += 1

        if not args.dry_run:
            for email in admins:
                try:
                    resend_client.send_email(email, subject, html)
                except Exception as exc:
                    print(f"Error: Failed to send email warning to {email} for org {org_id}: {exc}")

            # Record that we sent warnings for this org today
            try:
                sent_log_dir.mkdir(parents=True, exist_ok=True)
                if not sent_log_path.exists():
                    sent_log_path.touch(mode=0o600)
                with open(sent_log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps({"date": today_str, "org_id": org_id}) + "\n")
            except Exception as exc:
                print(f"Warning: Failed to record sent warning in log: {exc}")

    print(f"[Step 2] Sent grace warnings for {warn_count} orgs.")

    # -------------------------------------------------------------------------
    # Step 3: Purge expired magic links
    # -------------------------------------------------------------------------
    if args.dry_run:
        # Mock purge count
        conn = magic_link_service._open_conn()
        try:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM magic_link_tokens WHERE expires_at < ?",
                ((now - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",),
            ).fetchone()
            would_purge = row["cnt"] if row else 0
            print(f"[Step 3] Dry-run: Would purge {would_purge} expired magic link tokens.")
        finally:
            conn.close()
    else:
        purged_links = magic_link_service.purge_expired(grace_hours=24)
        print(f"[Step 3] Purged {purged_links} expired magic link tokens.")

    # -------------------------------------------------------------------------
    # Step 4: Clean up polar webhook events older than 90 days
    # -------------------------------------------------------------------------
    cutoff_90d = (now - timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"
    if args.dry_run:
        conn = org_service._open_conn()
        try:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM polar_webhook_events WHERE received_at < ?",
                (cutoff_90d,),
            ).fetchone()
            would_clean_webhooks = row["cnt"] if row else 0
            print(f"[Step 4] Dry-run: Would delete {would_clean_webhooks} webhook events older than 90 days.")
        finally:
            conn.close()
    else:
        conn = org_service._open_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            res = conn.execute(
                "DELETE FROM polar_webhook_events WHERE received_at < ?",
                (cutoff_90d,),
            )
            deleted_webhooks = res.rowcount
            conn.commit()
            print(f"[Step 4] Deleted {deleted_webhooks} old polar webhook events.")
        except Exception as exc:
            conn.rollback()
            print(f"[Step 4] Error cleaning old webhook events: {exc}")
        finally:
            conn.close()

    print(f"[{_now_utc().isoformat()}] Completed mekong trial check.")


if __name__ == "__main__":
    main()
