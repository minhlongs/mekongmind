#!/usr/bin/env python3
"""model-orchestrator: Intelligent LLM auto-routing engine.
Classifies prompts by complexity, routes to optimal model tier,
cascades on failure, logs to SQLite."""
import argparse, hashlib, json, os, re, sqlite3, subprocess, sys, time, math

INSTALL_DIR = os.environ.get("MODEL_ORCHESTRATOR_DIR") or os.path.join(os.path.expanduser("~"), ".local", "share", "model-orchestrator")
DB_DIR = os.path.expanduser("~/.model-orchestrator")
DB_PATH = os.path.join(DB_DIR, "logs.db")
SECRETS_SCRIPT = os.path.join(os.path.dirname(INSTALL_DIR), "load-keychain-secrets.sh")

TIERS = [
    {"name": "7b",   "max_score": 0.3, "model": "qwen2.5-coder:7b",         "provider": "ollama"},
    {"name": "14b",  "max_score": 0.6, "model": "qwen2.5-coder:14b",        "provider": "ollama"},
    {"name": "35b",  "max_score": 0.8, "model": "qwen3.6:35b-mlx-fast",     "provider": "ollama"},
    {"name": "claude", "max_score": 1.0, "model": "claude-sonnet-4-20250514", "provider": "anthropic"},
]

WEIGHTS = {"prompt_length": 0.40, "unique_token_ratio": 0.15, "tool_presence": 0.20, "code_markers": 0.15, "conversation_depth": 0.10}
TECHNICAL_TERMS = re.compile(r'\b(algorithm|architecture|distributed|consensus|protocol|implement|deploy|optimize|authentication|authorization|encryption|asynchronous|synchronous|middleware|pipeline|deployment|container|orchestration|microservice|monolithic|database|replication|partition|sharding|caching|queue|streaming|websocket|graphql|restful|kubernetes|terraform|ci/cd|observability|telemetry|instrumentation)\b', re.IGNORECASE)
TOOL_PATTERNS = re.compile(r'\b(curl|grep|sed|awk|sort|uniq|wc|find|xargs|jq|docker|kubectl|git|npm|pip|ssh|scp|rsync|chmod|chown|make|cmake|cat|echo|rm|mv|cp|mkdir|touch|ps|kill|nohup|ffmpeg|python|node|deno|bun)\b', re.IGNORECASE)
TOOL_OPERATORS = re.compile(r'[|&;<>$()`\[\]{}]')
CODE_PATTERNS = re.compile(r'```|`[^`]+`|\b(function|def |class |import |from |export|const |let |var |async |await |=>|->|::|<[A-Z]|\breturn\b|\bif\b.*:|\bfor\b.*:|\bwhile\b.*:|\btry\b.*:|\bexcept\b)')
CONVERSATION_PATTERNS = re.compile(r'\b(based on (our|the) (previous|above|last)|as we (discussed|said|mentioned)|following (up on|from)|to clarify|going back to|further to)\b', re.IGNORECASE)

def init_db(db_path=None):
    db_path = db_path or DB_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("""CREATE TABLE IF NOT EXISTS routing_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (datetime('now')),
        prompt_hash TEXT, prompt_preview TEXT,
        score REAL, tier TEXT, model TEXT,
        status TEXT, output_preview TEXT,
        cost_estimate REAL, duration_ms INTEGER,
        cascade_attempts INTEGER DEFAULT 1)""")
    conn.commit(); conn.close()

def log_route(db_path, entry):
    db_path = db_path or DB_PATH
    try:
        conn = sqlite3.connect(db_path)
        conn.execute("INSERT INTO routing_log (prompt_hash,prompt_preview,score,tier,model,status,output_preview,cost_estimate,duration_ms,cascade_attempts) VALUES (?,?,?,?,?,?,?,?,?,?)",
                     (entry.get("prompt_hash"), entry.get("prompt_preview", "")[:200],
                      entry.get("score"), entry.get("tier"), entry.get("model"),
                      entry.get("status", "unknown"), str(entry.get("output_preview", ""))[:200],
                      entry.get("cost_estimate", 0.0), entry.get("duration_ms", 0),
                      entry.get("cascade_attempts", 1)))
        conn.commit(); conn.close()
    except Exception:
        pass

def score_prompt_length(prompt):
    return min(math.log10(max(len(prompt), 1) + 1) / 3.0, 1.0)

def score_unique_token_ratio(prompt):
    tokens = prompt.split()
    if not tokens: return 0.0
    if len(tokens) <= 3: return 0.0
    return len(set(tokens)) / len(tokens)

def score_tool_presence(prompt):
    s = 0.0
    matches = TOOL_PATTERNS.findall(prompt)
    s += min(len(matches) * 0.15, 0.6)
    op_matches = TOOL_OPERATORS.findall(prompt)
    s += min(len(op_matches) * 0.05, 0.4)
    return min(s, 1.0)

def score_code_markers(prompt):
    matches = CODE_PATTERNS.findall(prompt)
    tech_matches = TECHNICAL_TERMS.findall(prompt)
    return min(len(matches) * 0.12 + len(tech_matches) * 0.10, 1.0)

def score_conversation_depth(prompt):
    return 1.0 if CONVERSATION_PATTERNS.search(prompt) else 0.0

def score_prompt(prompt, context=None):
    prompt = prompt or ""
    return (WEIGHTS["prompt_length"] * score_prompt_length(prompt)
            + WEIGHTS["unique_token_ratio"] * score_unique_token_ratio(prompt)
            + WEIGHTS["tool_presence"] * score_tool_presence(prompt)
            + WEIGHTS["code_markers"] * score_code_markers(prompt)
            + WEIGHTS["conversation_depth"] * score_conversation_depth(prompt))

def route(score):
    for tier in TIERS:
        if score <= tier["max_score"]:
            return tier["name"]
    return TIERS[-1]["name"]

def resolve_model(tier_name):
    for t in TIERS:
        if t["name"] == tier_name:
            return t
    return TIERS[0]

def estimate_cost(model_name):
    pricing = {"claude-sonnet-4-20250514": 0.003, "claude-opus-4-6-20250901": 0.015}
    base_cost = pricing.get(model_name, 0.0)
    return base_cost * 0.5

def execute_model(model_info, prompt, timeout=120):
    start = time.time()
    model = model_info["model"]
    provider = model_info["provider"]
    try:
        if provider == "ollama":
            proc = subprocess.run(["ollama", "run", model, prompt],
                                  capture_output=True, text=True, timeout=timeout)
            dur = int((time.time() - start) * 1000)
            if proc.returncode == 0:
                return {"status": "success", "output": proc.stdout, "duration_ms": dur, "error": None}
            return {"status": "failed", "output": "", "duration_ms": dur, "error": proc.stderr.strip() or "exit code " + str(proc.returncode)}
        elif provider == "anthropic":
            dur = int((time.time() - start) * 1000)
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            if api_key:
                return _call_anthropic(model, prompt, api_key, dur)
            secrets = os.environ.get("MODEL_ORCHESTRATOR_DIR", "")
            return {"status": "escalated", "output": "CLAUDE_AUTH_REQUIRED", "duration_ms": dur,
                    "error": "ANTHROPIC_API_KEY not set. Store in Keychain and source load-keychain-secrets.sh"}
    except subprocess.TimeoutExpired:
        return {"status": "failed", "output": "", "duration_ms": timeout * 1000, "error": "timeout"}
    except FileNotFoundError:
        return {"status": "failed", "output": "", "duration_ms": int((time.time()-start)*1000), "error": "ollama binary not found"}

def _call_anthropic(model, prompt, api_key, dur):
    import urllib.request
    try:
        body = json.dumps({
            "model": model, "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        }).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=body,
            headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
            method="POST")
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            content = data.get("content", [{}])[0].get("text", "")
            return {"status": "success", "output": content, "duration_ms": dur, "error": None}
    except Exception as e:
        return {"status": "failed", "output": "", "duration_ms": dur, "error": str(e)}

def cascade(prompt, start_score=None, db_path=None):
    if start_score is None:
        start_score = score_prompt(prompt)
    start_tier = route(start_score)
    tier_names = [t["name"] for t in TIERS]
    start_idx = tier_names.index(start_tier)
    last_result = None
    for i in range(start_idx, len(tier_names)):
        tname = tier_names[i]
        model_info = resolve_model(tname)
        result = execute_model(model_info, prompt)
        entry = {"prompt_hash": hashlib.sha256(prompt.encode()).hexdigest()[:16],
                 "prompt_preview": prompt[:200],
                 "score": start_score, "tier": tname, "model": model_info["model"],
                 "status": result["status"], "output_preview": (result.get("output") or "")[:200],
                 "cost_estimate": estimate_cost(model_info["model"]),
                 "duration_ms": result.get("duration_ms", 0),
                 "cascade_attempts": i - start_idx + 1}
        log_route(db_path, entry)
        if result["status"] == "success":
            return {**result, "tier_used": tname, "cascade_attempts": i - start_idx + 1, "model_used": model_info["model"]}
        last_result = result
    return {**last_result, "tier_used": tier_names[-1], "cascade_attempts": len(tier_names) - start_idx}

def main():
    parser = argparse.ArgumentParser(description="Model Orchestrator — intelligent LLM auto-routing")
    parser.add_argument("prompt", nargs="?", help="Prompt to classify/route/execute")
    parser.add_argument("--score", action="store_true", help="Score only, no execution")
    parser.add_argument("--dry-run", action="store_true", help="Score + route, print plan, no execution")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("--db", help="SQLite path (default: ~/.model-orchestrator/logs.db)")
    args = parser.parse_args()

    db_path = args.db or DB_PATH
    prompt = args.prompt or sys.stdin.read().strip()
    if not prompt:
        print(json.dumps({"error": "No prompt provided", "status": "error"}))
        sys.exit(1)

    score = score_prompt(prompt)
    tier = route(score)
    model_info = resolve_model(tier)

    if args.score:
        result = {"score": round(score, 4), "tier": tier, "model": model_info["model"], "provider": model_info["provider"]}
        print(json.dumps(result) if args.json else f"score={score:.4f} tier={tier} model={model_info['model']}")
        return

    if args.dry_run:
        result = {"score": round(score, 4), "tier": tier, "model": model_info["model"], "provider": model_info["provider"], "cascade_plan": [t["name"] for t in TIERS[TIERS.index(model_info):]]}
        print(json.dumps(result, indent=2) if args.json else f"[dry-run] score={score:.4f} tier={tier} model={model_info['model']} cascade={' → '.join(result['cascade_plan'])}")
        return

    init_db(db_path)
    result = cascade(prompt, start_score=score, db_path=db_path)
    result["score"] = round(score, 4)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        status = result.get("status", "unknown")
        if status == "success":
            print(result.get("output", ""))
        elif status == "escalated":
            print(f"[escalated] {result.get('output', '')}")
            if result.get("error"):
                print(f"[error] {result['error']}", file=sys.stderr)
        else:
            print(f"[{status}] {result.get('error', 'unknown error')}", file=sys.stderr)

if __name__ == "__main__":
    main()
