#!/usr/bin/env bash
set -euo pipefail

# 🚀 Quick push current branch to uat (or switch and push uat)
# Usage: ./push-to-uat.sh

BASE_REMOTE=${BASE_REMOTE:-origin}
UAT_BRANCH=${UAT_BRANCH:-uat}

current_branch=$(git rev-parse --abbrev-ref HEAD || echo "")

echo "🚀 === Push to UAT ==="

if [ "${current_branch}" != "${UAT_BRANCH}" ]; then
  echo "📝 Switching to ${UAT_BRANCH}..."
  git checkout ${UAT_BRANCH}
fi

# Ensure up-to-date
git pull ${BASE_REMOTE} ${UAT_BRANCH}

echo "🚀 Pushing ${UAT_BRANCH} to ${BASE_REMOTE}..."
git push ${BASE_REMOTE} ${UAT_BRANCH}

echo "✅ === Complete! ==="
