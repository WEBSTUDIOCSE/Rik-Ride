# Mac Deployment Scripts for Rik-Ride

These scripts automate common branch and deployment tasks.

Branches used by these scripts:
- UAT/preview branch: `uat`
- Production branch: `main`
- Remote name: `origin` (override with BASE_REMOTE env var)

Production URL: https://rik-ride.in/

Setup
-----
Make scripts executable:

```bash
chmod +x scripts/mac/*.sh
```

Usage
-----
1. Start a new feature branch from UAT:

```bash
./scripts/mac/new-feature.sh feature/my-feature
```

2. Merge current feature into UAT and push (for testing/preview):

```bash
./scripts/mac/merge-to-uat.sh
```

3. Deploy UAT to production (merges uat -> main and pushes):

```bash
./scripts/mac/deploy-to-production.sh
```

4. Quick push UAT or main branches:

```bash
./scripts/mac/push-to-uat.sh
./scripts/mac/push-to-main.sh
```

Notes
-----
- `deploy-to-production.sh` requires typing `yes` at the confirmation prompt.
- Scripts auto-detect uncommitted changes and prompt to commit.
- All scripts preserve `console.error` statements; they are intended for production error logging.

Customization
-------------
You can override defaults with environment variables:
- BASE_REMOTE (default: origin)
- UAT_BRANCH  (default: uat)
- PROD_BRANCH (default: main)
- PROD_URL    (default: https://rik-ride.in/)

Troubleshooting
---------------
If a merge conflict occurs, resolve it manually:

1. Open conflicting files in your editor
2. Fix conflicts
3. git add .
4. git commit -m "Resolve merge conflicts"
5. Re-run the script

If you see permission errors, ensure scripts are executable and you are running them from project root.

Contact
-------
For help, add an issue in the repo or contact the repo maintainer.
