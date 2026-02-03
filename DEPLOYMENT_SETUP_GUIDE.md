# Git Deployment Scripts Setup Guide

This guide will help you set up automated deployment scripts for your project with UAT (testing) and Production environments.

## Overview

This setup provides:
- ✅ Automated deployment scripts for Mac and Windows
- ✅ UAT (User Acceptance Testing) environment for safe testing
- ✅ Production deployment with author verification
- ✅ Feature branch workflow
- ✅ Easy copy-paste commands

## Prerequisites

- Git repository with main/master branch
- Vercel (or similar) for automatic deployments
- Basic Git knowledge

## Project Structure

```
your-project/
├── scripts/
│   ├── mac/                    # Mac/Linux scripts
│   │   ├── new-feature.sh
│   │   ├── merge-to-uat.sh
│   │   ├── deploy-to-production.sh
│   │   ├── push-to-uat.sh
│   │   ├── push-to-main.sh
│   │   └── README.md
│   ├── new-feature.ps1         # Windows scripts
│   ├── merge-to-uat.ps1
│   ├── deploy-to-production.ps1
│   ├── push-to-uat.ps1
│   ├── push-to-main.ps1
│   └── imp.txt                 # Quick reference commands
```

## Branch Strategy

```
feature/your-feature  →  uat (testing)  →  main (production)
         ↓                    ↓                  ↓
     development         preview deploy      prod deploy
```

## Files to Create

### 1. Mac Scripts

#### File: `scripts/mac/new-feature.sh`
```bash
#!/bin/bash
set -e

echo "🌿 === Create New Feature Branch ==="

# Get current branch
current_branch=$(git branch --show-current)

# Switch to uat and update
echo "📝 Switching to uat branch and updating..."
git checkout uat
git pull origin uat

# Get feature name
echo ""
echo "📋 Feature branch naming:"
echo "  - Features: feature/description (e.g., feature/add-payment)"
echo "  - Bug fixes: fix/description (e.g., fix/login-bug)"
echo "  - Hotfixes: hotfix/description (e.g., hotfix/security-patch)"
echo ""

if [ -z "$1" ]; then
  read -p "Enter branch name: " feature_name
else
  feature_name="$1"
fi

if [ -z "$feature_name" ]; then
  echo "❌ Error: Branch name cannot be empty"
  exit 1
fi

# Create and switch to new branch
echo ""
echo "🌿 Creating branch: $feature_name"
git checkout -b "$feature_name"

echo ""
echo "✅ === Complete! ==="
echo "✅ Created and switched to branch: $feature_name"
echo ""
echo "📝 Next steps:"
echo "1. Make your changes"
echo "2. git add ."
echo "3. git commit -m 'Your message'"
echo "4. ./scripts/mac/merge-to-uat.sh"
```

#### File: `scripts/mac/merge-to-uat.sh`
```bash
#!/bin/bash
set -e

echo "🔀 === Merge Feature to UAT ==="

# Get current branch
feature_branch=$(git branch --show-current)

# Check if on a feature branch
if [ "$feature_branch" = "main" ] || [ "$feature_branch" = "uat" ]; then
    echo "❌ Error: You're on $feature_branch branch. Switch to a feature branch first."
    exit 1
fi

echo "📝 Current branch: $feature_branch"

# Ensure all changes are committed
status=$(git status --porcelain)
if [ -n "$status" ]; then
    echo ""
    echo "⚠️  Uncommitted changes detected:"
    git status --short
    
    read -p "Do you want to commit them now? (y/n): " response
    
    if [ "$response" = "y" ]; then
        read -p "Enter commit message: " message
        git add .
        git commit -m "$message"
    else
        echo "❌ Please commit your changes first"
        exit 1
    fi
fi

# Push feature branch
echo ""
echo "🚀 Pushing $feature_branch to remote..."
git push origin "$feature_branch"

# Switch to uat
echo ""
echo "📝 Switching to uat branch..."
git checkout uat

# Update uat
echo "🔄 Updating uat branch..."
git pull origin uat

# Merge feature into uat
echo ""
echo "🔀 Merging $feature_branch into uat..."
git merge "$feature_branch" --no-ff -m "Merge $feature_branch into uat"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Merge conflict detected!"
    echo "📝 Please resolve conflicts manually:"
    echo "1. Open conflicted files in VS Code"
    echo "2. Resolve conflicts"
    echo "3. git add ."
    echo "4. git commit -m 'Resolve merge conflicts'"
    echo "5. Run this script again"
    exit 1
fi

# Push to uat
echo ""
echo "🚀 Pushing to uat..."
git push origin uat

echo ""
echo "✅ === Complete! ==="
echo "✅ Feature merged to uat successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Test in UAT environment"
echo "2. If tests pass, run: ./scripts/mac/deploy-to-production.sh"
echo "3. If issues found, switch back to feature branch and fix"
echo ""
echo "📍 Current branch: uat"
```

#### File: `scripts/mac/deploy-to-production.sh`
```bash
#!/bin/bash
set -e

echo "🚀 === Deploy UAT to Production ==="

# Confirmation
echo ""
echo "⚠️  This will deploy UAT changes to PRODUCTION!"
read -p "Have you tested everything in UAT? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Switch to main
echo ""
echo "📝 Switching to main branch..."
git checkout main

# Update main
echo "🔄 Updating main branch..."
git pull origin main

# Merge uat into main
echo ""
echo "🔀 Merging uat into main..."
git merge uat --no-ff -m "Merge uat into main for production release"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Merge conflict detected!"
    echo "📝 Please resolve conflicts and try again"
    exit 1
fi

# OPTIONAL: Change author for production commits
# Uncomment and modify if you need specific author for production
# Save current Git config
# original_name=$(git config user.name)
# original_email=$(git config user.email)

# Change to production author
# git config user.name "YOUR_PRODUCTION_USERNAME"
# git config user.email "production@email.com"
# git commit --amend --reset-author --no-edit

# Push to production
echo "🚀 Deploying to production..."
git push origin main

# OPTIONAL: Restore original Git config
# git config user.name "$original_name"
# git config user.email "$original_email"

echo ""
echo "✅ === Complete! ==="
echo "✅ Successfully deployed to PRODUCTION! 🚀"
echo ""
echo "🌐 Production URL: YOUR_PRODUCTION_URL_HERE"
echo "⚙️  Deployment platform will complete the deployment"
```

#### File: `scripts/mac/push-to-uat.sh`
```bash
#!/bin/bash
set -e

echo "🚀 === Push to UAT Branch ==="

# Check current branch
current_branch=$(git branch --show-current)

if [ "$current_branch" = "uat" ]; then
    echo "✅ Already on uat branch"
else
    echo "📝 Switching to uat branch..."
    git checkout uat
fi

# Push to uat
echo "🚀 Pushing to uat branch..."
git push origin uat

echo ""
echo "✅ === Complete! ==="
echo "✅ Pushed to uat branch successfully"
```

#### File: `scripts/mac/push-to-main.sh`
```bash
#!/bin/bash
set -e

echo "🚀 === Push to Main Branch ==="

# Check current branch
current_branch=$(git branch --show-current)

if [ "$current_branch" = "main" ]; then
    echo "✅ Already on main branch"
else
    echo "📝 Switching to main branch..."
    git checkout main
fi

# Push to main
echo "🚀 Pushing to main branch..."
git push origin main

echo ""
echo "✅ === Complete! ==="
echo "✅ Pushed to main branch successfully"
```

#### File: `scripts/mac/README.md`
```markdown
# Mac Deployment Scripts

These are Mac-compatible bash scripts for deploying your project.

## Setup (One-time)

Make scripts executable:
```bash
chmod +x scripts/mac/*.sh
```

## Usage

### 1. Start a New Feature
```bash
./scripts/mac/new-feature.sh
```

### 2. Make Your Changes
```bash
git add .
git commit -m "Your feature description"
```

### 3. Deploy to UAT (Testing)
```bash
./scripts/mac/merge-to-uat.sh
```

### 4. Deploy to Production
```bash
./scripts/mac/deploy-to-production.sh
```

## Quick Deploy (Current Changes)

```bash
# Add and commit changes
git add .
git commit -m "Your changes"

# Deploy to UAT for testing
./scripts/mac/merge-to-uat.sh

# After testing, deploy to production
./scripts/mac/deploy-to-production.sh
```
```

### 2. Quick Reference File

#### File: `scripts/imp.txt`
```plaintext
# ========================================
# MAC USERS - Quick Copy-Paste Commands
# ========================================

# --- ONE-TIME SETUP ---
chmod +x scripts/mac/*.sh

# --- WORKFLOW COMMANDS (Copy-Paste These) ---

# 1️⃣ START NEW FEATURE
./scripts/mac/new-feature.sh

# 2️⃣ MAKE CHANGES & COMMIT
git add .
git commit -m "Your feature description"

# 3️⃣ DEPLOY TO UAT (Testing Environment)
./scripts/mac/merge-to-uat.sh

# 4️⃣ DEPLOY TO PRODUCTION (After UAT Testing)
./scripts/mac/deploy-to-production.sh

# --- QUICK PUSH COMMANDS ---

# Push to UAT directly (if already on uat branch)
./scripts/mac/push-to-uat.sh

# Push to Main directly (if already on main branch)
./scripts/mac/push-to-main.sh

# ========================================
# MANUAL GIT COMMANDS (If Scripts Fail)
# ========================================

# Commit changes
git add .
git commit -m "Your message"

# Push to UAT
git checkout uat
git push origin uat

# Push to Production
git checkout main
git merge uat
git push origin main

# ========================================
# COMMON TASKS
# ========================================

# Check current branch
git branch --show-current

# View commit history
git log --oneline -5

# Check git status
git status

# Discard all local changes
git reset --hard HEAD

# Pull latest changes
git pull origin $(git branch --show-current)
```

## Implementation Instructions for Copilot

When setting this up in a new project, follow these steps:

### Step 1: Create the directory structure
```bash
mkdir -p scripts/mac
```

### Step 2: Create all the Mac script files
Create each file listed above in the `scripts/mac/` directory.

### Step 3: Create the quick reference file
Create `scripts/imp.txt` with the content above.

### Step 4: Make scripts executable
```bash
chmod +x scripts/mac/*.sh
```

### Step 5: Customize for your project
1. Replace `YOUR_PRODUCTION_URL_HERE` with actual production URL
2. Modify author settings in `deploy-to-production.sh` if needed
3. Update branch names if using different naming (e.g., `master` instead of `main`)

### Step 6: Create UAT branch
```bash
git checkout -b uat
git push -u origin uat
git checkout main
```

### Step 7: Configure Vercel/Deployment Platform
1. Connect your Git repository
2. Set up automatic deployments for:
   - `uat` branch → Preview/UAT environment
   - `main` branch → Production environment

### Step 8: Test the workflow
```bash
# Create a test feature
./scripts/mac/new-feature.sh
# Enter: feature/test-deployment

# Make a small change (e.g., add a comment in a file)
echo "// Test deployment" >> README.md

# Commit and deploy to UAT
git add .
git commit -m "Test deployment scripts"
./scripts/mac/merge-to-uat.sh

# After verifying in UAT, deploy to production
./scripts/mac/deploy-to-production.sh
```

## Windows Scripts (Optional)

If you need Windows PowerShell versions, create similar scripts with `.ps1` extension using PowerShell syntax. The logic remains the same.

## Benefits

✅ **Consistent workflow** - Same process for all team members  
✅ **Reduced errors** - Scripts handle branching and merging  
✅ **Safe testing** - UAT environment before production  
✅ **Easy rollback** - Clear branch history  
✅ **Quick commands** - Copy-paste from imp.txt  

## Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/mac/*.sh
```

### Scripts not found
Make sure you're in the project root directory when running scripts.

### Merge conflicts
The scripts will detect conflicts and provide instructions. Resolve manually and re-run.

### Git author issues
Configure Git properly:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Support

For questions or issues:
1. Check `scripts/imp.txt` for quick reference
2. Review `scripts/mac/README.md` for detailed usage
3. Consult this guide for implementation details

---

**Happy deploying! 🚀**
