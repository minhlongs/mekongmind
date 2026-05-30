#!/usr/bin/env bash
# One-time setup for the /idea autopilot.
#
#   1. Install claudekit (npm) — used for git checkpoints and hooks.
#   2. Wire claudekit hooks into .claude/settings.json (typecheck, lint,
#      forbid writes to apps/ + secrets, enforce-checkpoint on big edits).
#   3. If Ollama is running locally, pull a DeepSeek-class model and
#      pre-set the universal endpoint vars in ~/.mekong-env.
#   4. Print a smoke-test command.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> /idea autopilot — init"
echo "    repo:  ${REPO_ROOT}"
echo

# ----------------------------------------------------------------------
# 1. claudekit
# ----------------------------------------------------------------------
if ! command -v claudekit >/dev/null 2>&1; then
  echo "==> Installing claudekit (npm, global, with --silent)"
  npm install -g claudekit --silent || {
    echo "    npm global install failed — falling back to local --no-save"
    npm install --no-save claudekit --silent
  }
fi
echo "==> claudekit version: $(npx --yes claudekit --version 2>/dev/null || echo '(local)')"

# ----------------------------------------------------------------------
# 2. Hooks
# ----------------------------------------------------------------------
SETTINGS=".claude/settings.json"
mkdir -p .claude
if [[ ! -f "${SETTINGS}" ]]; then
  echo "==> Creating ${SETTINGS}"
  cat > "${SETTINGS}" <<'JSON'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "npx --yes claudekit-hooks run typecheck-changed" },
          { "type": "command", "command": "npx --yes claudekit-hooks run lint-changed" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "npx --yes claudekit-hooks run check-bash-safelist" }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "npx --yes claudekit-hooks run forbid-paths apps/ mekong/daemon/ .env" }
        ]
      }
    ]
  }
}
JSON
else
  echo "==> ${SETTINGS} already exists — leaving as-is. Add claudekit hooks manually if needed."
fi

# ----------------------------------------------------------------------
# 3. Local DeepSeek via Ollama (if available)
# ----------------------------------------------------------------------
if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "==> Ollama detected on localhost:11434"
  if ! curl -sf http://localhost:11434/api/tags | grep -q deepseek; then
    echo "    pulling deepseek-v3 (this may take a while)…"
    ollama pull deepseek-v3 || ollama pull deepseek-coder-v2:16b || true
  fi
  ENV_FILE="${HOME}/.mekong-env"
  if ! grep -q "LLM_BASE_URL" "${ENV_FILE}" 2>/dev/null; then
    {
      echo "# /idea autopilot — universal endpoint (DeepSeek via Ollama)"
      echo "export LLM_BASE_URL=http://localhost:11434/v1"
      echo "export LLM_API_KEY=ollama"
      echo "export LLM_MODEL=deepseek-v3"
    } >> "${ENV_FILE}"
    echo "    wrote ${ENV_FILE} — source it from your shell init."
  fi
else
  echo "==> Ollama not detected. To use cloud DeepSeek, set:"
  echo "       export LLM_BASE_URL=https://api.deepseek.com/v1"
  echo "       export LLM_API_KEY=\$DEEPSEEK_API_KEY"
  echo "       export LLM_MODEL=deepseek-chat"
fi

# ----------------------------------------------------------------------
# 4. Smoke test prompt
# ----------------------------------------------------------------------
cat <<'EOF'

==> Done.

Smoke test (no writes):
   mekong idea run "add a /hello command that prints hello world" \
     --max-iter 4 --dry-run -y

First real run:
   mekong idea run "<your idea here>" --max-iter 12 -y

List runs:    mekong idea list
Inspect:      mekong idea show <run-id>
EOF
