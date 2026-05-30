#!/bin/bash
# sync-agy-commands.sh - Sync .opencode/commands/*.md frontmatter into .gemini/commands/*.toml
# Maintains parity between OpenCode and Antigravity CLI command definitions.
# Idempotent. Safe to re-run.

set -uo pipefail
MEKONG_ROOT="${MEKONG_ROOT:-$HOME/mekong-cli}"
OPENCODE_DIR="${OPENCODE_DIR:-$MEKONG_ROOT/.opencode/commands}"
GEMINI_DIR="${GEMINI_DIR:-$MEKONG_ROOT/.gemini/commands}"

[ -d "$OPENCODE_DIR" ] || { echo "❌ Missing $OPENCODE_DIR"; exit 1; }
[ -d "$GEMINI_DIR" ] || { echo "❌ Missing $GEMINI_DIR"; exit 1; }

CREATED=0
UPDATED=0
SKIPPED=0

for md_file in "$OPENCODE_DIR"/*.md; do
  [ -f "$md_file" ] || continue
  name="$(basename "$md_file" .md)"
  toml_file="$GEMINI_DIR/$name.toml"

  # Extract YAML frontmatter
  desc=$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description:[[:space:]]*/, ""); gsub(/^"|"$/, ""); print; exit}' "$md_file")
  arg_hint=$(awk '/^---$/{c++; next} c==1 && /^argument-hint:/{sub(/^argument-hint:[[:space:]]*/, ""); print; exit}' "$md_file")
  output=$(awk '
    /^## Output[[:space:]]*$/ { in_output=1; next }
    in_output && /^## / { exit }
    in_output && NF {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      if (text) text=text " " $0
      else text=$0
    }
    END { print text }
  ' "$md_file")
  command=$(awk '
    /^## Execution[[:space:]]*$/ { in_execution=1; next }
    in_execution && /^## / { exit }
    in_execution && /^```/ { in_code = !in_code; next }
    in_execution && in_code && /^[[:space:]]*mekong[[:space:]]+/ {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      print
      exit
    }
  ' "$md_file")

  [ -z "$desc" ] && desc="Mekong command: $name"
  [ -z "$command" ] && command="mekong $name {{args}}"
  command=$(echo "$command" | sed 's/"\$INPUT"/{{args}}/g; s/\$INPUT/{{args}}/g; s/"\$ARGUMENTS"/{{args}}/g; s/\$ARGUMENTS/{{args}}/g')
  desc_escaped=$(echo "$desc" | sed 's/"/\\"/g')
  arg_hint_escaped=$(echo "$arg_hint" | sed 's/"/\\"/g')
  output_escaped=$(echo "$output" | sed 's/"/\\"/g')
  command_escaped=$(echo "$command" | sed 's/"/\\"/g')

  # Generate canonical TOML
  new_content="description = \"$desc_escaped\"
"
  if [ -n "$arg_hint" ]; then
    new_content="${new_content}argument-hint = \"$arg_hint_escaped\"
"
  fi
  if [ -n "$output" ]; then
    new_content="${new_content}output = \"$output_escaped\"
"
  fi
  new_content="${new_content}[steps]
[steps.run]
command = \"$command_escaped\"
"

  if [ ! -f "$toml_file" ]; then
    echo "$new_content" > "$toml_file"
    CREATED=$((CREATED + 1))
  else
    existing=$(cat "$toml_file")
    if [ "$existing" != "$new_content" ]; then
      echo "$new_content" > "$toml_file"
      UPDATED=$((UPDATED + 1))
    else
      SKIPPED=$((SKIPPED + 1))
    fi
  fi
done

echo "✅ Sync complete: $CREATED created, $UPDATED updated, $SKIPPED unchanged"
echo "   Source: $OPENCODE_DIR"
echo "   Target: $GEMINI_DIR"
