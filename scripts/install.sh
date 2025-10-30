#!/usr/bin/env bash
set -euo pipefail

# Simple installer: download a GitHub repo tarball and extract into a target directory.
# Defaults assume this template repo and branch 'master'.

usage() {
  cat <<'EOF'
Usage: install.sh --repo <owner/repo> [--branch <branch>] [--dir <target-dir>] [--no-install]

Options:
  --repo       GitHub owner/repo to install from (e.g., user/elysia-ghpages-template)
  --branch     Branch name to fetch (default: master)
  --dir        Target directory (default: current directory)
  --no-install Skip running bun install (default: run if bun is available)

Examples:
  ./install.sh --repo user/elysia-ghpages-template --dir my-project
  ./install.sh --repo user/elysia-ghpages-template --branch main
EOF
}

REPO=""
BRANCH="master"
TARGET_DIR="."
RUN_INSTALL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="$2"; shift 2;;
    --branch)
      BRANCH="$2"; shift 2;;
    --dir)
      TARGET_DIR="$2"; shift 2;;
    --no-install)
      RUN_INSTALL=0; shift 1;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown argument: $1" >&2; usage; exit 1;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "--repo <owner/repo> is required" >&2
  usage
  exit 1
fi

TARBALL_URL="https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading ${REPO}@${BRANCH}..."
curl -fsSL "$TARBALL_URL" | tar -xz -C "$TMPDIR"

# Find extracted folder (repoName-branch)
EXTRACTED_DIR="$(find "$TMPDIR" -maxdepth 1 -type d -name "*-$(printf %q "$BRANCH")" -print -quit)"
if [[ -z "$EXTRACTED_DIR" ]]; then
  # Fallback: pick the first directory
  EXTRACTED_DIR="$(find "$TMPDIR" -maxdepth 1 -mindepth 1 -type d | head -n1)"
fi

mkdir -p "$TARGET_DIR"

echo "Copying files to ${TARGET_DIR}..."
shopt -s dotglob nullglob
cp -R "$EXTRACTED_DIR"/* "$TARGET_DIR"/

if [[ $RUN_INSTALL -eq 1 ]]; then
  if command -v bun >/dev/null 2>&1; then
    echo "Running bun install..."
    ( cd "$TARGET_DIR" && bun install )
  else
    echo "bun not found; skipping dependency install."
  fi
fi

echo "Done. Next steps:\n  cd ${TARGET_DIR}\n  bun run export   # to generate ./pages for GitHub Pages\n  # or run dev server:\n  bun run dev"


