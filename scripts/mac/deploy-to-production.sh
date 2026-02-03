#!/usr/bin/env bash
set -euo pipefail

# 🚀 Merge uat into main and push to production
# Usage: ./deploy-to-production.sh

BASE_REMOTE=${BASE_REMOTE:-origin}
UAT_BRANCH=${UAT_BRANCH:-uat}
PROD_BRANCH=${PROD_BRANCH:-main}
PROD_URL=${PROD_URL:-https://rik-ride.in/}

echo "🚀 === Deploy UAT to Production ==="

echo "⚠️  This will merge ${UAT_BRANCH} into ${PROD_BRANCH} and push to remote (${BASE_REMOTE})."
read -r -p "Have you tested everything in UAT and want to proceed? Type 'yes' to continue: " confirm

if [ "${confirm}" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

# Ensure all changes committed on current branch
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

# Switch to main and update
echo "📝 Switching to ${PROD_BRANCH}..."
git checkout ${PROD_BRANCH}

echo "🔄 Pulling latest ${PROD_BRANCH}..."
git pull ${BASE_REMOTE} ${PROD_BRANCH}

# Merge uat into main
echo "🔀 Merging ${UAT_BRANCH} into ${PROD_BRANCH}..."
if ! git merge ${UAT_BRANCH} --no-ff -m "Release: Merge ${UAT_BRANCH} into ${PROD_BRANCH}"; then
  echo "❌ Merge conflict detected! Resolve conflicts and try again."
  exit 1
fi

# Push to main
echo "🚀 Pushing ${PROD_BRANCH} to ${BASE_REMOTE}..."
git push ${BASE_REMOTE} ${PROD_BRANCH}

echo "✅ === Complete! ==="
echo "✅ Successfully deployed to PRODUCTION! 🚀"
echo "🌐 Production URL: ${PROD_URL}"

echo "Note: Vercel (or your deployment platform) will pick up the push to ${PROD_BRANCH} and deploy to production." 
