#!/usr/bin/env python3
"""
CTO Brain v5 — TRAIN workers like a real CTO trains engineers.

Old approach (v1-v4): send short commands every 90s → micromanaging → useless busywork.
New approach (v5): send ONE comprehensive prompt with FULL context. Let worker self-direct.

Worker is CC CLI (Claude Code) — it CAN read codebase, plan, implement, test, commit.
CTO just needs to give it the RIGHT mission, then GET OUT OF THE WAY.
"""
import json
import sys
import os
import subprocess
import time
from pathlib import Path

project = sys.argv[1] if len(sys.argv) > 1 else "unknown"
proj_dir = sys.argv[2] if len(sys.argv) > 2 else "."
deploy = sys.argv[3] if len(sys.argv) > 3 else ""
pane_ctx = sys.argv[4] if len(sys.argv) > 4 else "0"

root = Path(os.path.expanduser("~/mekong-cli"))
full_dir = root / proj_dir if proj_dir != "." else root
ctx = int(pane_ctx) if pane_ctx.isdigit() else 0
hour = (time.gmtime().tm_hour + 7) % 24


def run(cmd, cwd=None):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=5, cwd=cwd).stdout.strip()
    except:
        return ""


# ===== GATHER REAL PROJECT CONTEXT =====

# Git state
if proj_dir == ".":
    dirty = run(["git", "status", "--short", "--", "*.json", "*.ts", "*.md", "scripts/"], cwd=str(root))
else:
    dirty = run(["git", "status", "--short", "--", proj_dir + "/"], cwd=str(root))
dirty_count = len([l for l in dirty.split("\n") if l.strip()]) if dirty else 0

# Recent commits
if proj_dir == ".":
    commits_raw = run(["git", "log", "--oneline", "-5", "--", "*.json", "*.ts", "scripts/"], cwd=str(root))
else:
    commits_raw = run(["git", "log", "--oneline", "-5", "--", proj_dir + "/"], cwd=str(root))
recent = "\n".join(commits_raw.split("\n")[:5]) if commits_raw else "no commits yet"

# READ ACTUAL PROJECT FILES — like a real CTO would
readme = ""
claude_md = ""
plans_summary = ""
src_structure = ""

# README
for f in ["README.md"]:
    p = full_dir / f
    if p.exists():
        try:
            readme = "\n".join(p.read_text().split("\n")[:30])
        except:
            pass
        break

# CLAUDE.md — project-specific rules
for f in ["CLAUDE.md", ".claude/CLAUDE.md"]:
    p = full_dir / f
    if p.exists():
        try:
            claude_md = "\n".join(p.read_text().split("\n")[:30])
        except:
            pass
        break

# Active plans
plans_dir = full_dir / "plans"
if plans_dir.is_dir():
    plan_files = sorted(plans_dir.glob("*.md"))[-3:]
    for pf in plan_files:
        try:
            head = "\n".join(pf.read_text().split("\n")[:5])
            plans_summary += f"\n[{pf.name}]: {head}"
        except:
            pass

# Source structure (what files exist)
src_dir = full_dir / "src"
if src_dir.is_dir():
    try:
        files = run(["find", str(src_dir), "-name", "*.ts", "-o", "-name", "*.tsx", "-o", "-name", "*.py"], cwd=str(full_dir))
        if files:
            src_structure = f"Source files: {len(files.split(chr(10)))} files. Key: {', '.join(Path(f).name for f in files.split(chr(10))[:10])}"
    except:
        pass

# ===== COMPACT IF NEEDED =====
if ctx >= 85:
    print("/compact")
    sys.exit(0)

# ===== COMMIT IF DIRTY =====
if dirty_count > 0:
    print(f'/worker-commit "Commit {dirty_count} files in {proj_dir}. Recent: {recent[:80]}" --fast')
    sys.exit(0)

# ===== BUILD THE MISSION =====
# This is a FULL mission brief — not a 1-line command.
# Worker will read README, understand codebase, and execute autonomously.

# Sales mission (mekong-cli only, 13-17h)
if project == "mekong-cli" and 13 <= hour < 17:
    mission = (
        "You are the Sales CTO for OpenClaw RaaS. "
        "Product: AI CTO as a Service ($49-499/mo). "
        "Landing: https://mekong-raas.pages.dev. "
        "Task: Research 10 potential customers (AI startups, dev agencies) and write cold outreach. "
        "Output to ~/.mekong/output/sales/. "
        "Read the raas-landing and raas-gateway code to understand the product first."
    )
    print(f'/cook "{mission}" --fast')
    sys.exit(0)

# ===== BUILD FULL MISSION BRIEF =====
# Feed ALL context to Qwen 32B to get a SPECIFIC, informed task
project_context = f"""Project: {project} ({proj_dir})
Recent commits: {recent[:200]}
{f'README: {readme[:500]}' if readme else ''}
{f'CLAUDE.md: {claude_md[:500]}' if claude_md else ''}
{f'Plans: {plans_summary[:400]}' if plans_summary else 'No active plans.'}
{src_structure[:300] if src_structure else ''}
Hour: {hour}h Saigon. Context window: {ctx}%.
"""

# Ask Qwen 32B for a SPECIFIC task based on actual project state
specific_task = ""
try:
    prompt = (
        f"You are CTO. Based on this project state, give ONE specific actionable task.\n\n"
        f"{project_context}\n\n"
        f"Rules:\n"
        f"- Be SPECIFIC: name exact files, functions, features\n"
        f"- Prioritize: fix bugs > fix tests > build features > refactor\n"
        f"- If no obvious bugs, pick the most impactful next feature from README/plans\n"
        f"- Reply in 1-2 sentences ONLY. Start with a verb (Fix, Build, Add, Implement).\n"
    )
    import urllib.request
    payload = json.dumps({
        "model": "qwen3:32b", "prompt": prompt, "stream": False,
        "options": {"num_predict": 500, "temperature": 0.1},
    }).encode()
    req = urllib.request.Request("http://localhost:11434/api/generate", data=payload,
                                headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    raw = (data.get("response", "") + data.get("thinking", "")).strip()
    # Extract the actual task (skip thinking tags if any)
    for line in raw.split("\n"):
        line = line.strip()
        if line and not line.startswith("<") and not line.startswith("```"):
            specific_task = line[:200]
            break
except:
    pass

if specific_task:
    mission = (
        f"You are lead engineer for {project}. "
        f"CTO says: {specific_task} "
        f"Working dir: {proj_dir}. Build: {deploy}. "
        f"Read README.md first. Implement, test, commit. Don't ask questions."
    )
else:
    # Fallback if Qwen fails
    mission = (
        f"You are lead engineer for {project} ({proj_dir}). "
        f"Recent: {recent[:100]}. Build: {deploy}. "
        f"Read README.md and CLAUDE.md. Find most impactful thing to work on. "
        f"Prioritize: fix bugs > fix tests > build features. "
        f"Implement, test, commit. Don't ask questions."
    )

print(f'/cook "{mission}" --fast')
