#!/usr/bin/env bash
# Personalize a fresh clone of mekong-foundation for a new owner.
#
# Replaces these placeholders across the repo:
#   agency.os               → ${NEW_OWNER}            (GitLab namespace)
#   longtho638-jpg          → ${NEW_OWNER_GH}          (GitHub mirror handle)
#   longtho638@gmail.com    → ${NEW_EMAIL}
#   "Long Tho"              → ${NEW_NAME}
#   mekong-foundation       → ${NEW_PROJECT}
#   mekong_foundation       → ${NEW_PROJECT_PY}        (snake_case package name)
#   Mekong Foundation       → ${NEW_PROJECT_TITLE}     (title-case display)
#   https://mekongmind.com  → ${NEW_HOMEPAGE}
#
# Usage:
#   bash scripts/personalize.sh                       # interactive
#   bash scripts/personalize.sh --dry-run             # show diff, don't write
#   bash scripts/personalize.sh --apply               # apply without re-prompting
#                                                       (reads ~/.mekong-foundation-personalize.env)
#   bash scripts/personalize.sh --env-file PATH       # use PATH instead of the default env file
#                                                       (combine with --apply or as the save target)
#
# Idempotent — re-running with the same answers is a no-op.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$HOME/.mekong-foundation-personalize.env"
DRY_RUN=0
APPLY_FROM_ENV=0

while (( $# )); do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --apply)   APPLY_FROM_ENV=1; shift ;;
    --env-file)
      [[ -n "${2:-}" ]] || { echo "--env-file requires a path" >&2; exit 2; }
      ENV_FILE="$2"; shift 2 ;;
    --env-file=*)
      ENV_FILE="${1#--env-file=}"; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \?//'
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

prompt() {
  # prompt VAR_NAME "Question" "default"
  local var="$1" question="$2" default="$3" reply
  printf '%s [%s]: ' "$question" "$default" >&2
  read -r reply
  printf -v "$var" '%s' "${reply:-$default}"
}

if (( APPLY_FROM_ENV )) && [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "==> Personalize template values (Enter to accept default)"
  prompt NEW_OWNER         "GitLab namespace / username"    "your-handle"
  prompt NEW_OWNER_GH      "GitHub mirror handle (optional)" "$NEW_OWNER"
  prompt NEW_EMAIL         "Contact email"                  "you@example.com"
  prompt NEW_NAME          "Display name"                   "Your Name"
  prompt NEW_PROJECT       "Project slug (kebab-case)"      "your-project"
  prompt NEW_PROJECT_PY    "Python package name (snake_case)" "${NEW_PROJECT//-/_}"
  prompt NEW_PROJECT_TITLE "Display title"                  "Your Project"
  prompt NEW_HOMEPAGE      "Homepage URL"                   "https://example.com"

  cat >"$ENV_FILE" <<EOF
NEW_OWNER="$NEW_OWNER"
NEW_OWNER_GH="$NEW_OWNER_GH"
NEW_EMAIL="$NEW_EMAIL"
NEW_NAME="$NEW_NAME"
NEW_PROJECT="$NEW_PROJECT"
NEW_PROJECT_PY="$NEW_PROJECT_PY"
NEW_PROJECT_TITLE="$NEW_PROJECT_TITLE"
NEW_HOMEPAGE="$NEW_HOMEPAGE"
EOF
  echo "==> Saved answers to $ENV_FILE (re-use with --apply or --env-file $ENV_FILE)"
fi

confirm() {
  local reply
  printf '%s [y/N]: ' "$1" >&2
  read -r reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

if (( ! DRY_RUN )); then
  echo
  echo "About to rewrite the following placeholders inside $ROOT:"
  echo "  agency.os              → $NEW_OWNER"
  echo "  longtho638-jpg         → ${NEW_OWNER_GH:-$NEW_OWNER}"
  echo "  longtho638@gmail.com   → $NEW_EMAIL"
  echo "  Long Tho               → $NEW_NAME"
  echo "  mekong-foundation      → $NEW_PROJECT"
  echo "  mekong_foundation      → $NEW_PROJECT_PY"
  echo "  Mekong Foundation      → $NEW_PROJECT_TITLE"
  echo "  https://mekongmind.com → $NEW_HOMEPAGE"
  echo
  confirm "Proceed?" || { echo "aborted"; exit 1; }
fi

# ---- file selection -------------------------------------------------------
mapfile -t TARGETS < <(
  cd "$ROOT" && {
    git ls-files 2>/dev/null \
      || find . -type f -not -path './.git/*' -not -path './.venv/*' \
                        -not -path '*/__pycache__/*' -not -name '*.pyc'
  } | grep -Ev '^scripts/personalize\.sh$|^plans/_example-feature/' \
    || true
)

# ---- substitution helpers -------------------------------------------------
# LHS of `sed s/.../.../` is a BRE — escape BRE metachars (`.` `*` `^` `$` `[` `]`)
# plus the delimiter `/` and the `&` reference.
escape_sed_lhs() { printf '%s' "$1" | sed -e 's/[][\.*^$\/&]/\\&/g'; }
# RHS only needs `/` and `&` escaped.
escape_sed_rhs() { printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'; }

apply_pair() {
  local from="$1" to="$2" file
  [[ -z "$from" || -z "$to" || "$from" == "$to" ]] && return 0
  local from_e to_e
  from_e="$(escape_sed_lhs "$from")"
  to_e="$(escape_sed_rhs "$to")"
  for file in "${TARGETS[@]}"; do
    [[ -f "$ROOT/$file" ]] || continue
    if (( DRY_RUN )); then
      grep -lF "$from" "$ROOT/$file" >/dev/null 2>&1 && \
        echo "  would patch: $file ($from → $to)"
    else
      sed -i.bak "s/$from_e/$to_e/g" "$ROOT/$file" 2>/dev/null || true
      [[ -f "$ROOT/$file.bak" ]] && rm "$ROOT/$file.bak"
    fi
  done
}

# ---- run ------------------------------------------------------------------
echo
apply_pair "Mekong Foundation"      "$NEW_PROJECT_TITLE"
apply_pair "mekong-foundation"      "$NEW_PROJECT"
apply_pair "mekong_foundation"      "$NEW_PROJECT_PY"
apply_pair "agency.os"              "$NEW_OWNER"
apply_pair "longtho638-jpg"         "${NEW_OWNER_GH:-$NEW_OWNER}"
apply_pair "longtho638@gmail.com"   "$NEW_EMAIL"
apply_pair "Long Tho"               "$NEW_NAME"
apply_pair "https://mekongmind.com" "$NEW_HOMEPAGE"
apply_pair "mekongmind.com"         "${NEW_HOMEPAGE#https://}"

# Rename the package directory
SRC_PKG="$ROOT/src/mekong_foundation"
DST_PKG="$ROOT/src/$NEW_PROJECT_PY"
if [[ -d "$SRC_PKG" && "$SRC_PKG" != "$DST_PKG" ]]; then
  if (( DRY_RUN )); then
    echo "  would rename: src/mekong_foundation → src/$NEW_PROJECT_PY"
  else
    mv "$SRC_PKG" "$DST_PKG"
    echo "  renamed: src/mekong_foundation → src/$NEW_PROJECT_PY"
  fi
fi

if (( DRY_RUN )); then
  echo
  echo "Dry-run complete. Re-run without --dry-run to apply."
else
  echo
  echo "✅ Personalization applied."
  echo "Next steps:"
  echo "  1. git status      — review the diff"
  echo "  2. pip install -e \".[dev]\"  — rebuild editable install (package was renamed)"
  echo "  3. ruff check . && pytest -q"
  echo "  4. git add -A && git commit -s -S -m 'chore: personalize template'"
fi
