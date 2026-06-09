#!/bin/bash
set -euo pipefail

cat <<'EOF'
This script rewrites git history to remove the .env file from all commits using git-filter-repo.
WARNING: This will rewrite repository history and force-push. All collaborators must re-clone afterwards.
EOF

read -p "Proceed to create a mirror, remove .env from history, and force-push? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted by user."
  exit 1
fi

# Ensure we have remote URL
REMOTE_URL=$(git config --get remote.origin.url || true)
if [[ -z "$REMOTE_URL" ]]; then
  echo "Unable to determine remote.origin.url. Run this script from a clone of the repository that has an 'origin' remote set." >&2
  exit 1
fi

# Use a temporary directory
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Cloning a bare mirror into $TMPDIR/repo.git ..."
git clone --mirror "$REMOTE_URL" "$TMPDIR/repo.git"
cd "$TMPDIR/repo.git"

# Preferred: git-filter-repo
if command -v git-filter-repo >/dev/null 2>&1; then
  echo "Running git-filter-repo to remove .env from history..."
  git filter-repo --invert-paths --path .env
  echo "Pushing rewritten history to origin (force)..."
  git push --force
  echo "Finished. Please inform all collaborators to re-clone the repository."
  exit 0
fi

# Fallback: BFG Repo-Cleaner (if installed)
if command -v bfg >/dev/null 2>&1 || [[ -f "/usr/local/bin/bfg" ]]; then
  echo "git-filter-repo not found, attempting BFG fallback. Ensure 'bfg' and a JRE are installed."
  cd "$TMPDIR"
  git clone --mirror "$REMOTE_URL" repo-bfg.git
  java -jar $(which bfg || echo /usr/local/bin/bfg) --delete-files .env repo-bfg.git
  cd repo-bfg.git
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  git push --force
  echo "Finished BFG cleanup. Please inform all collaborators to re-clone the repository."
  exit 0
fi

echo "Neither git-filter-repo nor bfg was found. See README_CLEANUP.md for manual instructions." >&2
exit 2
