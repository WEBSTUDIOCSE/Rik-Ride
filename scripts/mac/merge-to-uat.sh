#!/usr/bin/env bash
set -euo pipefail

# 🔀 Merge current feature branch into uat and push
# Usage: ./merge-to-uat.sh

BASE_REMOTE=${BASE_REMOTE:-origin}
UAT_BRANCH=${UAT_BRANCH:-uat}

echo "🔀 === Merge Feature to UAT ==="

feature_branch=$(git rev-parse --abbrev-ref HEAD || echo "")

if [ "${feature_branch}" = "main" ] || [ "${feature_branch}" = "${UAT_BRANCH}" ]; then
  echo "❌ Error: You're on ${feature_branch}. Switch to a feature branch first."
  exit 1
fi

echo "📝 Current branch: ${feature_branch}"

# Ensure no uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes detected:"
  git status --short
  read -r -p "Commit them now? (y/n): " resp
  if [ "${resp}" = "y" ]; then
    read -r -p "Commit message: " msg
    git add .
    git commit -m "${msg}"
  else
    echo "❌ Please commit your changes first"
    exit 1
  fi
fi

# Push feature branch
echo "🚀 Pushing ${feature_branch} to ${BASE_REMOTE}..."
git push ${BASE_REMOTE} ${feature_branch}

# Checkout and update uat
echo "📝 Switching to ${UAT_BRANCH}..."
git checkout ${UAT_BRANCH}

echo "🔄 Pulling latest ${UAT_BRANCH}..."
git pull ${BASE_REMOTE} ${UAT_BRANCH}

echo "🔀 Merging ${feature_branch} into ${UAT_BRANCH}..."
if ! git merge "${feature_branch}" --no-ff -m "Merge ${feature_branch} into ${UAT_BRANCH}"; then
  echo "❌ Merge conflict detected! Resolve manually and re-run script."
  exit 1
fi

# Push uat
echo "🚀 Pushing ${UAT_BRANCH} to ${BASE_REMOTE}..."
git push ${BASE_REMOTE} ${UAT_BRANCH}

echo "✅ === Complete! ==="

echo "Preview (UAT) branch is ${UAT_BRANCH}. Vercel should deploy to preview for this branch."
