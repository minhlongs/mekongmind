#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="${HOME:-/Users/macbook}"
cd "$HOME/mekong-cli"

# Source env vars
[ -f "$HOME/.zshenv" ] && source "$HOME/.zshenv" 2>/dev/null
[ -f "$HOME/.mekong/.env" ] && set -a && source "$HOME/.mekong/.env" 2>/dev/null && set +a

# Ollama v0.20.2 = MLX native on Apple Silicon
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=qwen2.5-coder:7b
export LLM_API_KEY=ollama
export OLLAMA_BASE_URL=http://localhost:11434

exec .venv/bin/uvicorn src.gateway:app --host 0.0.0.0 --port 8000
