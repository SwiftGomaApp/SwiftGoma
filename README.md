# Swiftgoma

Swiftgoma is a local marketplace and delivery platform for **Goma, DRC**. It connects three groups in one flow: local buyers who place orders, sellers who confirm and prepare those orders, and riders who handle delivery — making buying and receiving everyday goods in Goma faster, more reliable, and easier to trust, end to end.

> **Status:** v1 — active development

---

## Table of Contents

- [Overview](#overview)
- [Apps](#apps)
- [Core Concepts](#core-concepts)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Revenue Model](#revenue-model)
- [Brand](#brand)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The DRC remains largely a cash economy, and trust — not technology — is the biggest barrier to e-commerce adoption in Goma. Swiftgoma is built around that reality:

- **Cash on Delivery by default**, with Online Payment and a Swiftgoma Wallet as alternatives.
- **QR-based handoff confirmation** — every order has a one-time QR code the buyer shows at handoff (scanned by the rider for delivery, or the seller for pickup). For online payments, that scan is what automatically triggers the escrow payout to the seller.
- **Riders belong to sellers, not to Swiftgoma.** Each rider is invited by and affiliated with exactly one seller; Swiftgoma provides the technology, not the employment relationship.
- **0% commission on orders.** Swiftgoma earns through seller subscriptions and Swiftgoma Wallet transactions instead.

## Apps

Swiftgoma is made up of four applications:

| App | Platform | Used by | Purpose |
|---|---|---|---|
| **Buyer App** | Flutter (mobile) | Local buyers | Browse sellers, place orders, choose payment & fulfillment method, track delivery, confirm receipt via QR. |
| **Seller App** | Flutter (mobile) | Sellers | List products, accept/reject orders, invite & manage their own riders, generate pickup QR handoff, view payouts. |
| **Delivery App** | Flutter (mobile) | Riders | Accept delivery requests from their affiliated seller, navigate to the buyer, scan the buyer's QR to confirm handoff. |
| **Admin Dashboard** | Next.js (web) | Swiftgoma team | Oversee sellers, buyers, orders, disputes, payouts, and platform-wide activity. Support and Admin access levels. |

## Core Concepts

- **Fulfillment methods:** Delivery or Pickup, chosen independently of payment method at checkout.
- **Payment methods:** Cash on Delivery, Online Payment (escrow via PawaPay), Swiftgoma Wallet.
- **Order lifecycle:** Order placed → Seller accepts/rejects → Fulfillment begins → Handoff (QR scan) → Payment settled → Order complete.
- **Escrow:** Online payments are held in a PawaPay wallet until the handoff QR is scanned, which releases the payout to the seller automatically.
- **Disputes:** Reported in-app → Support queue → resolved by Support (within a refund cap) or escalated to Admin for a final decision.

Full product specification — including detailed flows for each role, the order & payment flow, seller onboarding, and dispute resolution — lives in the project's `docs/` folder (see `Swiftgoma_Overview_v1.docx`).

## Tech Stack

| Layer | Choice |
|---|---|
| Backend server | Node.js + Express |
| Mobile apps | Flutter (Buyer, Seller, Delivery) |
| Web | Next.js (Admin Dashboard) |
| Database | Neon (Postgres) |
| Email | SMTP via Hostinger |
| SMS | Africa's Talking |
| File / image storage | Cloudinary |
| Sessions | JWT bearer tokens (mobile apps), cookies (web) |
| Auth methods | Email & password, Email & OTP, Google Auth, Passkey, 2FA (TOTP) |
| Real-time | Socket.io — live order updates, in-app push while connected |
| Payment gateway | PawaPay API — online payments, escrow, wallet payouts |
| Maps & geolocation | Mapbox — live rider tracking, navigation, distance calculation |
| Push notifications | Firebase Cloud Messaging (FCM) |
| QR codes | Generation & camera-based scanning libraries |
| Job queue & caching | Redis + BullMQ |
| Error monitoring | Sentry |

## Repository Structure

```
swiftgoma/
├── apps/
│   ├── buyer/              # Flutter — Buyer App
│   ├── seller/              # Flutter — Seller App
│   ├── delivery/            # Flutter — Delivery (Rider) App
│   └── admin/                # Next.js — Admin Dashboard
├── server/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/         # PawaPay, Mapbox, FCM, Africa's Talking, Cloudinary
│   │   ├── jobs/              # Redis + BullMQ queues
│   │   └── sockets/           # Socket.io handlers
│   └── prisma/ or db/         # Neon Postgres schema & migrations
├── packages/                 # Shared code (types, constants, utils)
├── docs/                     # Product docs (Swiftgoma_Overview_v1.docx, etc.)
└── README.md
```

> Adjust this structure to match the actual layout once the codebase is scaffolded — this is the intended shape based on the current tech stack decisions.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/SwiftGomaApp/SwiftGoma.git
cd SwiftGoma

# Install server dependencies
cd server
npm install

# Install a mobile app's dependencies (example: buyer app)
cd ../apps/buyer
flutter pub get

# Install the admin dashboard's dependencies
cd ../admin
npm install
```

Each app/service will need its own `.env` file — see [Environment Variables](#environment-variables).

## Environment Variables

The API server expects (fill in actual values in a local `.env`, never commit secrets):

```
# Database
DATABASE_URL=

# Auth
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# SMS
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=

# File storage
CLOUDINARY_URL=

# Payments
PAWAPAY_API_KEY=

# Maps
MAPBOX_ACCESS_TOKEN=

# Push notifications
FCM_SERVER_KEY=

# Cache / queue
REDIS_URL=

# Error monitoring
SENTRY_DSN=
```

## Revenue Model

Swiftgoma takes **0% commission on orders**. Revenue comes from:

1. **Subscriptions** — sellers pay for one of three plans: Starter, Business, or Enterprise.
2. **Swiftgoma Wallet** — a third payment method alongside Cash on Delivery and Online Payment; Swiftgoma earns on top-up/withdrawal transactions.

Delivery fees are set entirely by each seller and paid to them directly — Swiftgoma does not set or take a cut of delivery pricing.

## Brand

| Color | Hex | Role |
|---|---|---|
| Flame Orange | `#FF4F00` | Primary |
| Dark Orange | `#FF8C00` | Secondary / bold accent |
| Alloy Orange | `#C46210` | Deep accent |
| Amber | `#FFBF00` | Bright highlight |
| Coral | `#FF7F50` | Soft / vibrant mid-tone |
| Apricot | `#FBCEB1` | Soft background |
| Champagne | `#F7E7CE` | Lightest neutral / background |
| Dark Red | `#BA160C` | Contrast anchor / CTA |

**Typeface:** [Geist](https://vercel.com/font) (by Vercel) — Sans and Mono variants.

## Contributing

This project is currently in early v1 development. If you're contributing:

1. Branch off `main` using `feature/<short-description>` or `fix/<short-description>`.
2. Keep commits scoped and descriptive.
3. Open a pull request against `main` for review before merging.

## License

Proprietary — all rights reserved. License terms to be finalized.
