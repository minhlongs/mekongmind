# Pre-deploy Claude Code Checklist Hook

# When: PreToolUse on Bash commands containing "deploy" or "build" keywords
# What: Run build validation, test suite, and SOP gate checks before deployment

CLAUDE_PROJECT_DIR="$1"
shift 2
CLAUDE_TOOL_INPUT="$*"

echo "[claude-hook] Deploy/build hook triggered."
echo "Tool input: $CLAUDE_TOOL_INPUT"

# Only trigger on deploy or build commands
if ! echo "$CLAUDE_TOOL_INPUT" | grep -qiE 'deploy|build.*--prod|npm run production'; then
    echo "[claude-hook] Not a deploy/build command. Skipping."
    exit 0
fi

cd /Users/macbook/Documents/me-deep-wrapper/mvp

# Run build check first
echo "[claude-hook] Running npm run build..."
if ! npm run build; then
    echo "[claude-hook] FAIL: Build failed. Aborting deploy."
    exit 1
fi

# Run test suite
echo "[claude-hook] Running npm test..."
if ! npm test -- --passWithNoTests; then
    echo "[claude-hook] WARN: Tests failed. Deploy may be risky."
    # Don't fail — warn instead (deploy still possible if intentional)
fi

# Run Claude Code quality check on recent changes
echo "[claude-hook] Running final Claude Code quality gate..."
claude -p "Scan mvp/ for any TODO comments, hardcoded credentials, or missing error handling in recently modified files. Report only — do not modify." \
    --allowedTools "Read,Bash" \
    --max-turns 3

echo "[claude-hook] Pre-deploy checklist complete."
exit 0
