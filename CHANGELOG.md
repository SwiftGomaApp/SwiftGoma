# Changelog

All notable changes to SwiftGoma are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In progress
- Wallet — seller balance, payouts, refunds
- Reviews — buyer rates product + seller after delivery
- Analytics — seller dashboard stats

---

## [0.1.0] — 2026-06-25

### Added
- Auth system — JWT (cookie-only), passkeys (WebAuthn), Google OAuth, TOTP 2FA, OTP via SMS/email, multi-device sessions
- User management — profile, addresses, preferences, push tokens
- Seller onboarding — profile, KYC document upload, shop creation
- Subscription plans — Starter / Business / Enterprise with PawaPay mobile money
- Auto-renew cron with 3-day expiry warning
- Seller invoicing — sequential PDF invoices uploaded to Cloudinary + emailed
- Categories — hierarchical, seller suggest / admin approve flow
- Products — CRUD, images (Cloudinary), variants, featured listings, all plan-gated
- Deliverer management — seller creates accounts, plan-gated via maxDeliverers
- Orders — full status flow (PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED → COMPLETED)
- Mobile Money orders via PawaPay + webhook auto-confirmation
- Cash on delivery order flow
- Order confirmation PDF generated on payment + emailed to buyer
- Live GPS delivery tracking via Socket.io
- Order auto-complete cron (48h after delivery)
- Official invoice PDF generated on order completion
- In-app notifications — Socket.io
- Email notifications — Nodemailer
- Push notifications — OneSignal
- SMS notifications — Africa's Talking
- Status page — health checks, incident management, public Socket.io namespace
- Sentry error monitoring

---

## Versioning Guide

- `MAJOR` — breaking API changes
- `MINOR` — new features, backward compatible
- `PATCH` — bug fixes

[Unreleased]: https://github.com/SwiftGomaApp/SwiftGoma/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/SwiftGomaApp/SwiftGoma/releases/tag/v0.1.0