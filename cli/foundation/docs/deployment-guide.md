# Deployment Guide

How releases are cut and distributed.

## Distribution channels

| Channel        | Status   | Maintainer action            |
| -------------- | -------- | ---------------------------- |
| GitLab Release | active   | Tag `vX.Y.Z` on `main`; release notes auto-generated from the tag annotation by GitLab. |
| PyPI           | manual   | `python -m build && twine upload dist/*` from a release-prep branch. Automated publish-on-tag job lives in `.gitlab-ci.yml` (deferred to next session). |
| Homebrew tap   | planned  | Maintained at `gitlab.com/agency.os/homebrew-mekong`.       |

## Release prerequisites

- All tests green on `main`.
- `CHANGELOG.md` `[Unreleased]` section has at least one entry.
- `pyproject.toml [project] version` and
  `src/mekong_foundation/__init__.py:__version__` agree.

## Release procedure

```bash
# 1. Bump version
$EDITOR pyproject.toml src/mekong_foundation/__init__.py

# 2. Move [Unreleased] to a dated section
$EDITOR CHANGELOG.md

# 3. Commit (signed, sign-off, conventional)
git commit -s -S -m "chore(release): 0.1.1"

# 4. Tag (signed)
git tag -s -m "v0.1.1" v0.1.1

# 5. Push
git push origin main
git push origin v0.1.1
```

## Verification after release

```bash
# Tag exists on GitLab
curl -s "https://gitlab.com/api/v4/projects/agency.os%2Fmekong-foundation/repository/tags/v0.1.1" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["commit"]["short_id"])'

# Release published (after creating it via the UI or `glab release create`)
curl -s "https://gitlab.com/api/v4/projects/agency.os%2Fmekong-foundation/releases/v0.1.1" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("name"))'

# (When PyPI is wired)
pip install --upgrade mekong-foundation==0.1.1
mekong-foundation version
```

## Rollback

A release is rolled back by tagging a higher patch version that reverts the
offending change. Tags themselves are never moved or deleted.

```bash
git revert <bad-sha>
git commit -s -S -m "fix(release): revert <feature>"
# bump to next patch
git tag -s -m "v0.1.2" v0.1.2
```

## Disaster recovery

- **Primary home:** `gitlab.com/agency.os/mekong-foundation`.
- **Active mirror:** `github.com/longtho638-jpg/mekong-foundation` — kept in
  sync by manual `git push github main` until the GitLab → GitHub push-mirror
  is wired (see `plans/260429-0040-gitlab-migration/plan.md`).
- **Codeberg mirror:** planned, see `plans/260428-2336-github-trust-bootstrap/`
  scripts for the bootstrap procedure.
- **Recovery time objective:** 1 hour from incident detection to a public
  read-only mirror being reachable.
- **Recovery point objective:** the latest pushed tag — no hot-replication
  needed for a low-traffic source repo.
