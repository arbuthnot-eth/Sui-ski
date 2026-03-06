#!/usr/bin/env bash
set -euo pipefail

COMMIT_MSG="${*:-update breadth of sui components we use}"

if git status --short | grep -q '^'; then
  echo "\n➕ Staging changes..."
  git add -A
  if git diff --cached --quiet; then
    echo "No staged changes found after add; exiting."
    exit 0
  fi
  echo "\n✅ Committing with message: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
else
  echo "No changes detected. Skipping commit/push."
fi

echo "\n⬆️  Pushing to current remote..."
git push

echo "\n🚀 Deploying via bun..."
npx wrangler deploy
