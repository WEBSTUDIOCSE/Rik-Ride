#!/usr/bin/env bash
set -euo pipefail

# 🚀 Quick push main branch to remote
# Usage: ./push-to-main.sh

BASE_REMOTE=${BASE_REMOTE:-origin}
PROD_BRANCH=${PROD_BRANCH:-main}

current_branch=$(git rev-parse --abbrev-ref HEAD || echo "")

echo "🚀 === Push to Main ==="

if [ "${current_branch}" != "${PROD_BRANCH}" ]; then
  echo "📝 Switching to ${PROD_BRANCH}..."
  git checkout ${PROD_BRANCH}
fi

git pull ${BASE_REMOTE} ${PROD_BRANCH}

echo "🚀 Pushing ${PROD_BRANCH} to ${BASE_REMOTE}..."
git push ${BASE_REMOTE} ${PROD_BRANCH}

echo "✅ === Complete! ==="
