# Vercel Deployment Setup Guide

## Branch Configuration

This project uses the following branch structure:

| Branch | Environment | URL | Purpose |
|--------|-------------|-----|---------|
| `main` | **Production** | https://rik-ride.in/ | Live site for users |
| `uat` | **Preview/Staging** | auto-generated preview URL | Testing before production |
| `feature/*` | **Development** | local only | Active development work |

## Vercel Project Settings

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `WEBSTUDIOCSE/Rik-Ride`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### 2. Configure Production Branch

In your Vercel project settings:

1. Go to **Settings** → **Git**
2. Set **Production Branch**: `main`
3. Save changes

### 3. Configure Preview Deployments

In **Settings** → **Git**:

1. Enable **Automatic Deployments from Git**
2. Configure branches:
   - ✅ **Deploy only the Production Branch** → `main`
   - ✅ **Deploy all branches** (this will create previews for `uat` and feature branches)

**OR** (Recommended for this workflow):

1. Enable **Production Branch**: `main`
2. Enable **Preview Branches**: Add `uat` explicitly
3. Disable feature branch auto-deploy (optional, to save build minutes)

### 4. Configure Custom Domain

In **Settings** → **Domains**:

1. Add domain: `rik-ride.in`
2. Add domain: `www.rik-ride.in` (redirect to primary)
3. Vercel will provide DNS settings - update your domain registrar

### 5. Environment Variables

In **Settings** → **Environment Variables**, add:

| Variable | Environment | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production, Preview | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production, Preview | Your Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production, Preview | Your Firebase project ID |
| ... (add all Firebase config) | Production, Preview | ... |

Add any other secrets like API keys, database URLs, etc.

### 6. Build Settings (if needed)

If you need custom build settings:

**Settings** → **General**:
- Node.js Version: `20.x` (or your preferred version)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Deployment Workflow

### Development to Production Flow

```
┌─────────────────┐
│ feature/xyz     │ ← You work here
│ (local)         │
└────────┬────────┘
         │
         │ ./scripts/mac/merge-to-uat.sh
         ▼
┌─────────────────┐
│ uat             │ ← Vercel auto-deploys preview
│ (preview)       │
└────────┬────────┘
         │
         │ Test & verify
         │ ./scripts/mac/deploy-to-production.sh
         ▼
┌─────────────────┐
│ main            │ ← Vercel auto-deploys to https://rik-ride.in/
│ (production)    │
└─────────────────┘
```

### Using the Scripts

1. **Start new feature**:
   ```bash
   ./scripts/mac/new-feature.sh feature/my-feature
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "Add my feature"
   ```

3. **Deploy to UAT (Preview)**:
   ```bash
   ./scripts/mac/merge-to-uat.sh
   ```
   - Vercel will auto-deploy `uat` branch
   - Check preview URL in Vercel dashboard
   - Test thoroughly

4. **Deploy to Production**:
   ```bash
   ./scripts/mac/deploy-to-production.sh
   ```
   - Type `yes` to confirm
   - Vercel will auto-deploy `main` branch
   - Live at https://rik-ride.in/

## Vercel Dashboard Access

- **Preview Deployments**: Check `uat` branch deployments in dashboard
- **Production Deployments**: Check `main` branch deployments
- **Logs**: View build logs and runtime logs
- **Analytics**: Monitor performance and usage

## Troubleshooting

### Preview not deploying

1. Check Vercel project settings → Git
2. Ensure `uat` branch is enabled for deployments
3. Check build logs in Vercel dashboard

### Production not updating

1. Verify `main` is set as production branch
2. Check if deployment succeeded in Vercel dashboard
3. Clear Vercel cache if needed

### Build failures

1. Check environment variables are set
2. Review build logs in Vercel
3. Test build locally: `npm run build`

## Important Notes

- Always work on feature branches, never directly on `main` or `uat`
- Use scripts for merging to avoid manual errors
- Test in UAT/preview before deploying to production
- Monitor Vercel dashboard for deployment status

## Current Branch Status

You are currently on: `feature/initial-setup`

Next steps:
1. Commit the Vercel config files
2. Merge to UAT: `./scripts/mac/merge-to-uat.sh`
3. Configure Vercel project with settings above
4. Deploy to production: `./scripts/mac/deploy-to-production.sh`
