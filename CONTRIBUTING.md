# Contributing to Swiftgoma

## Branching strategy

- **`main`** — production-ready. Protected: requires a PR, 1 approval, passing status checks, no force pushes or bypassing.
- **`dev`** — integration branch. Protected: requires a PR, status checks (once CI exists), no force pushes. Approvals aren't required yet, to avoid blocking a small team.
- **`feature/*`, `fix/*`, `chore/*`** — branch off `dev`, PR back into `dev`.

Flow: `feature/<name>` → PR into `dev` → once `dev` is stable and tested → one PR from `dev` into `main` to release.

## Branch naming

Name branches using this pattern:

```
feature/<short-description>   # new functionality
fix/<short-description>       # bug fixes
chore/<short-description>     # tooling, config, dependency updates, docs
```

Examples:

```
feature/buyer-qr-checkout
fix/rider-invite-link-expiry
chore/update-flutter-deps
```

## Commits

Keep commits scoped and descriptive. Prefer small, focused commits over large mixed ones. A good format:

```
<type>: <short summary>

<optional longer description>
```

Where `<type>` is one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## Pull Requests

1. Branch off the latest `dev` (not `main`) for day-to-day work.
2. Keep the PR scoped to one feature/fix — smaller PRs are reviewed faster.
3. Fill in the PR template: what changed, how to test it, and screenshots for any UI change (Buyer/Seller/Delivery/Admin).
4. Request review from at least one other contributor when possible.
5. Address review feedback with follow-up commits (avoid force-pushing over review history until approved).
6. Once approved and checks pass, squash-merge into `dev`.
7. Releases to `main` happen via a dedicated PR from `dev` into `main`, reviewed and approved before merging.

## Code style

- **Server (Node/Express):** run the linter before pushing.
- **Flutter apps:** run `flutter analyze` and `flutter test` before pushing.
- **Admin (Next.js):** run the linter and confirm the app builds (`npm run build`) before pushing.

## Reporting issues

Use the issue templates for bug reports and feature requests, and label them by app (`buyer`, `seller`, `delivery`, `admin`, `server`) so they're easy to filter.