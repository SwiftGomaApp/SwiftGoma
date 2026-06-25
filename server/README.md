# SwiftGoma — API Server

> REST API + real-time backend for SwiftGoma — the local marketplace for Goma, DRC.

[![SwiftGoma](https://img.shields.io/badge/SwiftGoma-API-orange)](https://github.com/SwiftGomaApp/SwiftGoma)

---

## Stack

- **Runtime:** Node.js + Express 5 (CommonJS)
- **Database:** PostgreSQL + Prisma ORM
- **Cache / Sessions:** Redis
- **Real-time:** Socket.io
- **Payments:** PawaPay (Orange Money, Airtel Money, M-Pesa)
- **Storage:** Cloudinary (images, PDFs)
- **Email:** Nodemailer (SMTP)
- **SMS / OTP:** Africa's Talking
- **Monitoring:** Sentry

---

## Features

- **Auth** — JWT (cookie-only), passkeys (WebAuthn), Google OAuth, TOTP 2FA, OTP via SMS/email, multi-device sessions
- **Sellers** — profile, KYC, shops, plan-gated subscriptions with PawaPay mobile money
- **Products** — categories (seller suggest / admin approve), variants, images, featured listings, all plan-gated
- **Orders** — full status flow, COD + Mobile Money, PawaPay webhook, stock management
- **Live tracking** — real-time GPS broadcast via Socket.io during delivery
- **Deliverers** — seller-managed, plan-gated via `maxDeliverers`
- **Invoicing** — sequential PDF invoices on subscription + order completion, uploaded to Cloudinary + emailed
- **Wallet** — seller balance (pending / available / blocked) — coming soon
- **Notifications** — in-app, email, push (OneSignal), SMS
- **Status page** — health checks, incident management, public Socket.io namespace

---

## Project Structure

```
src/
├── config/
│   ├── db.config.js         # Prisma client
│   ├── redis.config.js      # Redis client
│   ├── socket.config.js     # Socket.io setup + room helpers
│   ├── coudinary.config.js  # Cloudinary (root + v2)
│   └── env.config.js        # Environment variables
├── features/
│   ├── auth/                # JWT, passkeys, Google OAuth, TOTP, sessions, OTP
│   ├── users/               # Profile, addresses, preferences, push tokens, cleanup cron
│   ├── seller/              # Profile, KYC, shops, plans, subscriptions, deliverers, webhooks
│   ├── orders/              # Order flow, payments, live tracking, PDF, auto-complete cron
│   ├── invoice/             # PDF generation, sequential numbering, Cloudinary upload
│   ├── notifications/       # In-app, email, push, SMS dispatcher
│   └── status/              # Health checks, incidents, public Socket.io
├── services/
│   └── email.service.js     # Nodemailer transactional email
├── shared/
│   ├── errors/              # AppError, error handler, catchAsync
│   ├── middleware/          # Auth, rate limiter, security, upload (Cloudinary/multer)
│   └── utils/               # JWT, cookie, slug utilities
├── scripts/
│   └── seed-plans.js        # Seed subscription plans
└── server.js                # App entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- PawaPay sandbox or live account
- Cloudinary account
- Africa's Talking account

### Installation

```bash
git clone https://github.com/SwiftGomaApp/SwiftGoma.git
cd SwiftGoma/server
npm install
```

### Environment

```bash
cp .env.example .env
```

Fill in all values — see `.env.example` for the full list.

### Database

```bash
# Run migrations
npx prisma migrate dev

# Seed subscription plans
node src/scripts/seed-plans.js
```

### Run

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## API Reference

| Resource | Base Path | Auth |
|---|---|---|
| Auth | `/api/v1/auth` | Public / Mixed |
| TOTP | `/api/v1/auth/totp` | Authenticated |
| Passkeys | `/api/v1/auth/passkeys` | Mixed |
| Google OAuth | `/api/v1/auth/google` | Public |
| Sessions | `/api/v1/auth/sessions` | Authenticated |
| Users | `/api/v1/users` | Authenticated |
| Sellers | `/api/v1/sellers` | Mixed |
| Orders | `/api/v1/orders` | Authenticated |
| Invoices | `/api/v1/invoices` | Authenticated |
| Notifications | `/api/v1/notifications` | Authenticated |
| Webhooks | `/api/v1/webhooks` | Public (PawaPay) |
| Status | `/api/v1/status` | Public |

---

## Subscription Plans

| | Starter | Business | Enterprise |
|---|---|---|---|
| Price | $10/mo | $15/mo | $25/mo |
| Products | 15 | 50 | Unlimited |
| Images/product | 4 | 8 | 10 |
| Deliverers | 1 | 3 | Unlimited |
| Shops | 1 | 1 | 3 |
| Featured products | — | 3 | Unlimited |

---

## Order Flow

```
Buyer places order
        │
        ├── Mobile Money → PawaPay deposit → webhook → CONFIRMED
        └── Cash on delivery → seller confirms manually → CONFIRMED
                                        │
                                   PREPARING
                                        │
                            Seller assigns deliverer
                                        │
                                    SHIPPED
                                        │
                            Live GPS via Socket.io
                                        │
                                   DELIVERED
                                        │
                     Buyer confirms or 48h auto-complete
                                        │
                                   COMPLETED
                                        │
                              Invoice PDF generated
```

---

## Socket.io

| Event | Room | Description |
|---|---|---|
| `delivery:join` | `order:{id}` | Buyer joins tracking room |
| `delivery:location` | `order:{id}` | Live GPS coordinates |
| `delivery:status` | `order:{id}` | Delivery status update |
| `status:updated` | `/public` | Platform health update |

---

## Payment Corridors (DRC)

| Provider | Code |
|---|---|
| Orange Money | `ORANGE` |
| Airtel Money | `AIRTEL` |
| M-Pesa (Vodacom) | `MPESA` |

---

## Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| `startHealthCheckCron` | Every 5 min | Platform component health checks |
| `startAccountCleanupCron` | Daily | Delete soft-deleted accounts |
| `startSubscriptionCron` | Daily | Auto-renew, expiry warnings, deactivation |
| `startOrderCron` | Hourly | Auto-complete DELIVERED orders after 48h |

> All crons are commented out in `server.js` — uncomment for production.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `COOKIE_SECRET` | Cookie signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PAWAPAY_API_TOKEN` | PawaPay API token |
| `PAWAPAY_SANDBOX` | `true` for sandbox, `false` for live |
| `SMTP_HOST` | SMTP host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username |
| `AT_SENDER_ID` | SMS sender ID |
| `CLIENT_URL` | Frontend URL (for email links) |
| `SENTRY_DSN` | Sentry DSN |

---

## Related

- [Seller Dashboard](../seller) — Next.js seller web app
- [Buyer App](../buyer) — Flutter buyer mobile app
- [Deliverer App](../deliverer) — Flutter deliverer mobile app

---

© 2026 SwiftGoma / JASKAB COMPANY — All rights reserved.