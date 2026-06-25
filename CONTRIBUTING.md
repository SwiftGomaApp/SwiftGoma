# Git Workflow — SwiftGoma

This document explains how to work with Git on the SwiftGoma monorepo.

---

## Repository Structure

```
SwiftGoma/          ← monorepo root
├── server/         ← Express API
├── seller/         ← Next.js seller dashboard
├── buyer/          ← Flutter buyer app
└── deliverer/      ← Flutter deliverer app
```

All four products live in the same repo. Each has its own folder and its own `README.md`.

---

## Branches

| Branch        | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `main`        | Production — stable, deployed code only                         |
| `dev`         | Development — integration branch, all features merge here first |
| `feature/xxx` | New feature (e.g. `feature/wallet`, `feature/reviews`)          |
| `fix/xxx`     | Bug fix (e.g. `fix/order-stock-restore`)                        |
| `hotfix/xxx`  | Urgent production fix (branches off `main`)                     |

> **Never push directly to `main`.** All changes go through `dev` first.

---

## Branch Naming

```bash
# Feature
feature/wallet
feature/seller-reviews
feature/buyer-onboarding

# Bug fix
fix/pawapay-webhook-retry
fix/product-image-upload

# Hotfix (production)
hotfix/order-cancel-stock
```

---

## Daily Workflow

### 1. Always start from dev

```bash
git checkout dev
git pull origin dev
```

### 2. Create your feature branch

```bash
git checkout -b feature/wallet
```

### 3. Work and commit regularly

```bash
git add .
git commit -m "feat(wallet): add seller balance model and service"
```

### 4. Push your branch

```bash
git push origin feature/wallet
```

### 5. Open a Pull Request → dev

When your feature is ready, open a PR from `feature/wallet` → `dev` on GitHub.

### 6. Merge dev → main for releases

When `dev` is stable and tested:

```bash
git checkout main
git merge dev
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

---

## Commit Message Format

Follow this structure for all commits:

```
type(scope): short description

# Examples:
feat(orders): add auto-complete cron for delivered orders
fix(auth): resolve token refresh race condition
chore(deps): upgrade prisma to 5.22
docs(readme): update API reference table
refactor(seller): extract KYC logic into separate service
```

### Types

| Type       | When to use                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `chore`    | Maintenance, dependency updates      |
| `docs`     | Documentation only                   |
| `refactor` | Code restructure, no behavior change |
| `test`     | Adding or fixing tests               |
| `hotfix`   | Urgent production fix                |

### Scopes (examples)

`auth`, `orders`, `seller`, `products`, `wallet`, `notifications`, `invoice`, `socket`, `cron`, `deps`, `readme`

---

## Working on a Specific App

Since this is a monorepo, always specify which app you're working on in your branch name and commit scope:

```bash
# Working on the seller dashboard
git checkout -b feature/seller-order-filters
git commit -m "feat(seller): add order status filter on dashboard"

# Working on the API
git checkout -b fix/server-webhook-idempotency
git commit -m "fix(server): prevent duplicate webhook processing"

# Working on the buyer app
git checkout -b feature/buyer-favorites
git commit -m "feat(buyer): add offline favorites with SQLite"
```

---

## Hotfix (Production Bug)

When there's an urgent bug in production:

```bash
# Branch off main — NOT dev
git checkout main
git checkout -b hotfix/order-cancel-stock

# Fix the bug, commit
git commit -m "hotfix(orders): restore stock on payment failure"

# Merge back into both main and dev
git checkout main
git merge hotfix/order-cancel-stock
git push origin main

git checkout dev
git merge hotfix/order-cancel-stock
git push origin dev

# Delete the hotfix branch
git branch -d hotfix/order-cancel-stock
git push origin --delete hotfix/order-cancel-stock
```

---

## Tags and Releases

Tag every production release:

```bash
git tag v1.0.0 -m "First production release"
git push origin v1.0.0
```

### Versioning

Follow [Semantic Versioning](https://semver.org):

- `v1.0.0` — major release (breaking changes)
- `v1.1.0` — minor release (new features, backward compatible)
- `v1.1.1` — patch release (bug fixes)

---

## .gitignore Reminders

Make sure these are never committed:

```
.env
.env.local
node_modules/
.dart_tool/
build/
*.log
prisma/migrations/dev/
```

---

## Quick Reference

```bash
# Start a new feature
git checkout dev && git pull origin dev
git checkout -b feature/my-feature

# Save work in progress (without committing)
git stash
git stash pop

# Update your branch with latest dev
git checkout dev && git pull origin dev
git checkout feature/my-feature
git rebase dev

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git checkout .

# See what changed
git status
git diff
git log --oneline --graph
```

---

## GitHub Repository

[https://github.com/SwiftGomaApp/SwiftGoma](https://github.com/SwiftGomaApp/SwiftGoma)
