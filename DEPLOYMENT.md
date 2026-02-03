# 🚀 Rik-Ride Deployment Guide

## Quick Reference

### Daily Workflow Commands
```bash
# 1️⃣ Start new feature
./scripts/mac/new-feature.sh feature/your-feature-name

# 2️⃣ Make changes and commit
git add .
git commit -m "Your feature description"

# 3️⃣ Deploy to UAT (Preview/Testing)
./scripts/mac/merge-to-uat.sh

# 4️⃣ Deploy to Production (after UAT testing)
./scripts/mac/deploy-to-production.sh
```

---

## Branch Structure

| Branch | Environment | URL | Purpose |
|--------|-------------|-----|---------|
| `main` | **Production** | https://rik-ride.in/ | Live site |
| `uat` | **Preview/Staging** | Auto Vercel preview URL | Testing |
| `feature/*` | **Development** | Local only | Active development |

**Workflow:**
```
feature/xyz → uat (test) → main (production)
```

---

## Vercel Configuration

### Initial Setup (One-time)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import: `WEBSTUDIOCSE/Rik-Ride`
   - Framework: Next.js (auto-detected)

2. **Configure Branches**
   - Settings → Git → Production Branch: `main`
   - Enable deployments for: `uat` branch

3. **Add Domain**
   - Settings → Domains → Add: `rik-ride.in`

4. **Environment Variables**
   - Settings → Environment Variables
   - Add Firebase config (apply to Production & Preview):
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - Add Google Maps API key:
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Deployment Scripts

All scripts are in `scripts/mac/` (executable):

### `new-feature.sh`
Creates a new feature branch from `uat`.
```bash
./scripts/mac/new-feature.sh feature/payment-integration
```

### `merge-to-uat.sh`
Merges current feature to `uat` and pushes (triggers Vercel preview deploy).
```bash
./scripts/mac/merge-to-uat.sh
```

### `deploy-to-production.sh`
Merges `uat` to `main` and pushes (triggers production deploy).
Requires typing `yes` to confirm.
```bash
./scripts/mac/deploy-to-production.sh
```

### Quick Push Scripts
```bash
./scripts/mac/push-to-uat.sh   # Push uat to remote
./scripts/mac/push-to-main.sh  # Push main to remote
```

---

## Important Rules

✅ **Always work on feature branches**  
✅ **Never commit directly to `main` or `uat`**  
✅ **Use scripts for all merges**  
✅ **Test in UAT before production**  
✅ **Type `yes` to confirm production deploys**

---

## Troubleshooting

### Scripts won't run
```bash
chmod +x scripts/mac/*.sh
```

### Vercel not deploying
1. Check Settings → Git → Branch settings
2. Review build logs in Vercel dashboard
3. Verify environment variables are set

### Merge conflicts
1. Resolve conflicts in VS Code
2. `git add .`
3. `git commit -m "Resolve conflicts"`
4. Re-run the script

---

## File Structure

```
/Users/nandini/Dev/rik-ride/
├── vercel.json              # Vercel deployment config
├── .vercelignore            # Files excluded from deploy
└── scripts/
    ├── imp.txt              # Quick command reference
    └── mac/
        ├── *.sh             # All deployment scripts
        └── README.md        # Script documentation
```

---

## Terminal Shortcuts (Mac)

- **Control + `** - Open VS Code integrated terminal
- **Command + Space** → type "Terminal" - Open macOS Terminal
- **In VS Code**: View → Terminal

---

**Production URL:** https://rik-ride.in/  
**Repository:** WEBSTUDIOCSE/Rik-Ride
