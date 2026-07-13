# Swiftgoma — Server

The Node.js + Express API powering all four Swiftgoma apps (Buyer, Seller, Delivery, Admin Dashboard).

See the [root README](../README.md) for the full product overview, and `docs/Swiftgoma_Overview_v1.docx` for the complete spec.

## Tech Stack

| Layer                | Choice                                                          |
| -------------------- | --------------------------------------------------------------- |
| Runtime / framework  | Node.js + Express                                               |
| Database             | Neon (Postgres)                                                 |
| Sessions             | JWT bearer tokens (mobile apps), cookies (web/admin)            |
| Auth methods         | Email & password, Email & OTP, Google Auth, Passkey, 2FA (TOTP) |
| Real-time            | Socket.io                                                       |
| Payment gateway      | PawaPay API (escrow, wallet payouts)                            |
| Maps & geolocation   | Mapbox                                                          |
| Push notifications   | Firebase Cloud Messaging (FCM)                                  |
| SMS                  | Africa's Talking                                                |
| Email                | SMTP via Hostinger                                              |
| File / image storage | Cloudinary                                                      |
| Job queue & caching  | Redis + BullMQ                                                  |
| Error monitoring     | Sentry                                                          |

## Folder Structure

The server uses a **feature-based structure** — each business domain owns its own routes, controllers, services, and jobs:

```
src/
├── features/
│   ├── auth/          # email/password, OTP, Google, Passkey, 2FA
│   ├── buyers/
│   ├── sellers/        # profile, KYC, subscription plans
│   ├── riders/          # seller-invited, one rider = one seller
│   ├── products/
│   ├── orders/          # order lifecycle & state transitions
│   ├── payments/        # PawaPay, escrow, payout/refund logic — highest scrutiny
│   ├── wallet/           # Swiftgoma Wallet top-up/withdrawal
│   ├── qr/                # generation + scan verification (handoff confirmation)
│   ├── disputes/
│   └── admin/             # Support vs Admin permission logic
├── common/
│   ├── middleware/        # auth guard, rate limiting, error handler
│   ├── utils/
│   └── constants/
├── config/                 # env loading, third-party client setup
├── sockets/                 # Socket.io handlers
├── jobs/                     # BullMQ queue setup (shared infra)
└── app.js / server.js
```

Each feature folder is self-contained — avoid deep imports reaching into another feature's internals; shared logic goes through `common/`. (This is also enforced by `.coderabbit.yaml` review rules.)

## Getting Started

```bash
cd server
npm install
cp .env.example .env   # fill in real values
npm run dev
```

## Environment Variables

See `.env.example` for the full list. At minimum you'll need `DATABASE_URL`, `JWT_SECRET`, and `PAWAPAY_API_KEY` to run the core flows locally.

## Scripts

```bash
npm run dev      # start with hot reload
npm run lint      # lint
npm test           # run tests
npm run build       # production build (if applicable)
```

## Key Concepts

- **Order lifecycle:** placed → seller accepts/rejects → fulfillment begins → handoff (QR scan) → payment settled → complete.
- **Escrow:** Online payments held via PawaPay until the handoff QR is scanned, which auto-triggers the seller payout.
- **Riders:** affiliated with exactly one seller; the server should never treat a rider as a Swiftgoma-managed resource — assignment and invites always flow through the owning seller.
- **0% commission:** the `payments` feature must never deduct a platform cut from order value — only subscription billing and wallet transaction fees are Swiftgoma revenue.
