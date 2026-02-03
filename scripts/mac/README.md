# Deployment Scripts

Quick reference for Mac deployment scripts.

## Setup (One-time)
```bash
chmod +x scripts/mac/*.sh
```

## Daily Workflow

**1. Start feature:**
```bash
./scripts/mac/new-feature.sh feature/my-feature
```

**2. Merge to UAT (preview):**
```bash
./scripts/mac/merge-to-uat.sh
```

**3. Deploy to production:**
```bash
./scripts/mac/deploy-to-production.sh
```

**Quick push:**
```bash
./scripts/mac/push-to-uat.sh
./scripts/mac/push-to-main.sh
```

## Branches
- `main` → Production (https://rik-ride.in/)
- `uat` → Preview/staging
- `feature/*` → Development

📖 **Full guide:** See `/DEPLOYMENT.md`
