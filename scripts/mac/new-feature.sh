#!/usr/bin/env bash
set -euo pipefail

# 🌿 Create a new feature branch from uat
# Usage: ./new-feature.sh feature/name

BASE_REMOTE=${BASE_REMOTE:-origin}
UAT_BRANCH=${UAT_BRANCH:-uat}

echo "🌿 === Create New Feature Branch ==="

current_branch=$(git rev-parse --abbrev-ref HEAD || echo "")

# Ensure uat exists locally
if ! git show-ref --quiet refs/heads/${UAT_BRANCH}; then
  echo "🛈 uat branch not found locally. Creating from remote/${UAT_BRANCH} if available..."
  if git ls-remote --exit-code ${BASE_REMOTE} refs/heads/${UAT_BRANCH} >/dev/null 2>&1; then
    git fetch ${BASE_REMOTE} ${UAT_BRANCH}:${UAT_BRANCH}
  else
    git checkout -b ${UAT_BRANCH}
    git push -u ${BASE_REMOTE} ${UAT_BRANCH}
  fi
fi

# Update uat
git checkout ${UAT_BRANCH}
git pull ${BASE_REMOTE} ${UAT_BRANCH}

# Get feature name
if [ $# -ge 1 ]; then
  feature_name="$1"
else
  read -r -p "Enter new branch name (e.g. feature/my-feature): " feature_name
fi

if [ -z "${feature_name}" ]; then
  echo "❌ Error: Branch name cannot be empty"
  exit 1
fi

# Create and switch to new branch
git checkout -b "${feature_name}"

echo "✅ Created and switched to branch: ${feature_name}"

echo "📝 Next steps:"
echo "1. Make changes"
echo "2. git add . && git commit -m 'Your message'"
echo "3. ./scripts/mac/merge-to-uat.sh"
