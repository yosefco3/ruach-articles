# 🔒 Branch Protection & Production Safety

## Branch Strategy

```
main (production) ← Server pulls ONLY from this branch
  ↑
  merge only after full testing on development
  ↑
development ← All development work happens here
```

## Rules

1. **Server pulls from `main` ONLY** - never from development
2. **All development on `development` branch** - never commit directly to main
3. **Merge to main only when ready** - after testing on development
4. **Never commit secrets** - `.env.local`, API keys, passwords

## Quick Commands

```bash
# Start development
git checkout development
git pull origin development

# When ready to deploy
git checkout main
git merge development
git push origin main

# Emergency rollback
git checkout main
git revert HEAD
git push origin main
```

## Protected Files (never push to main)

- `.env.local` - local environment secrets
- `uploads/` - local file uploads
- `docker-compose.yml` - local Docker config

These are in `.gitignore` and must NEVER be tracked.