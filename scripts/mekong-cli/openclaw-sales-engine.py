"""OpenClaw Sales Engine — autonomous email outreach + content publish.

Runs inside Gateway. Finds targets → generates personalized email → sends via Resend.
Target: solo founders, solopreneurs, indie hackers.
"""
import requests
import time
import datetime
import os
import json

RESEND_KEY = "re_i9jzJWTY_Fxen49jkecN1RWnhseFWFxS9"
MLX_URL = "http://localhost:11435/v1/chat/completions"
MLX_MODEL = "mlx-community/Qwen2.5-Coder-32B-Instruct-4bit"
CHECKOUT_URL = "https://buy.polar.sh/polar_cl_apvIt00Pf7vw2GGX0PW7tWfNjSiwaTRUl0YzO3YqVhA"
REPORTS_DIR = "/Users/macbook/mekong-cli/content/sales-outreach"

# Solo founder targets — indie hackers, solopreneurs, Product Hunt makers
TARGETS = [
    {"name": "Solo Developer", "email": "longtho638@gmail.com", "context": "building SaaS products alone"},
]

os.makedirs(REPORTS_DIR, exist_ok=True)

def call_llm(prompt):
    try:
        r = requests.post(MLX_URL, json={
            "model": MLX_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
        }, timeout=300)
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return None

def send_email(to_email, to_name, subject, html_body):
    try:
        r = requests.post("https://api.resend.com/emails", json={
            "from": "Mekong IDE <noreply@mekongmind.com>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }, headers={"Authorization": f"Bearer {RESEND_KEY}"})
        return r.json().get("id")
    except:
        return None

def generate_outreach(target):
    prompt = f"""Write a short cold email (max 150 words) to {target["name"]} who is {target["context"]}.

Product: Mekong IDE — workflow automation platform for solo founders.
22 modules, 385 templates, $49/mo. Run your entire company alone.

Tone: casual, founder-to-founder, no hype.
Include CTA link: {CHECKOUT_URL}
Do NOT use the word AI. Say "automation" or "intelligent".
Subject line + email body in HTML format.
"""
    return call_llm(prompt)

def run():
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M")
    print(f"[{ts}] Sales Engine starting — {len(TARGETS)} targets")
    
    for target in TARGETS:
        print(f"  Generating outreach for {target["name"]}...")
        content = generate_outreach(target)
        if not content:
            print(f"  ✗ LLM failed for {target["name"]}")
            continue
        
        # Extract subject and body
        subject = f"Mekong IDE — run your company solo"
        html_body = f"""<div style="font-family:system-ui;max-width:600px;color:#333">
<p>Hi {target["name"]},</p>
{content}
<p style="margin-top:20px"><a href="{CHECKOUT_URL}" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Try Mekong IDE — $49/mo</a></p>
<p style="color:#999;font-size:12px">Mekong IDE — 22 modules, 385 templates, 1 subscription.<br>
<a href="https://www.mekongmind.com">mekongmind.com</a></p>
</div>"""
        
        email_id = send_email(target["email"], target["name"], subject, html_body)
        status = "sent" if email_id else "failed"
        print(f"  ✓ {status}: {target["email"]} (id={email_id})")
        
        # Log
        with open(os.path.join(REPORTS_DIR, f"{ts}-outreach.jsonl"), "a") as f:
            f.write(json.dumps({"ts": ts, "to": target["email"], "status": status, "id": email_id}) + "\n")
        
        time.sleep(5)
    
    print(f"[{ts}] Sales Engine complete")

if __name__ == "__main__":
    run()
