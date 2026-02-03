# Quick Setup: Deployment Scripts for New Project

Copy this entire message to your project's Copilot to replicate the deployment setup.

---

## Request for Copilot

Please create a complete deployment script setup for this project with the following:

### 1. Create Mac deployment scripts in `scripts/mac/`:

- **new-feature.sh** - Creates a new feature branch from UAT
- **merge-to-uat.sh** - Merges current feature to UAT for testing
- **deploy-to-production.sh** - Deploys UAT to production (main branch)
- **push-to-uat.sh** - Quick push to UAT
- **push-to-main.sh** - Quick push to main
- **README.md** - Documentation

### 2. Create quick reference file:

- **scripts/imp.txt** - Copy-paste commands for daily use

### 3. Branch workflow:

```
feature/xyz → uat (testing) → main (production)
```

### 4. Key requirements:

- All scripts should be bash scripts with proper error handling
- Include confirmation prompts for production deployment
- Auto-detect and handle uncommitted changes
- Provide clear success/error messages with emojis
- Make all scripts executable with `chmod +x`

### 5. Customizations needed:

- Replace `YOUR_PRODUCTION_URL_HERE` with: **[YOUR_ACTUAL_URL]**
- Use these Git credentials for production (if needed):
  - Name: **[YOUR_NAME]**
  - Email: **[YOUR_EMAIL]**

### 6. Additional setup:

- Create UAT branch if it doesn't exist
- Add instructions for Vercel/deployment platform configuration
- Include troubleshooting section in README

### 7. Reference implementation:

You can refer to this structure (from Elite Mindset Forge project):

**File structure:**
```
scripts/
├── mac/
│   ├── new-feature.sh
│   ├── merge-to-uat.sh
│   ├── deploy-to-production.sh
│   ├── push-to-uat.sh
│   ├── push-to-main.sh
│   └── README.md
└── imp.txt
```

**Workflow commands users should be able to copy-paste:**
```bash
# 1. Start feature
./scripts/mac/new-feature.sh

# 2. Make changes and commit
git add .
git commit -m "Feature description"

# 3. Deploy to UAT
./scripts/mac/merge-to-uat.sh

# 4. Deploy to production
./scripts/mac/deploy-to-production.sh
```

### 8. Testing:

After creating the scripts:
1. Make them executable: `chmod +x scripts/mac/*.sh`
2. Create a test feature branch
3. Test the full workflow from feature → UAT → production

---

Please create all these files and make them ready to use!
