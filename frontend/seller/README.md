# SwiftGoma — Seller Dashboard

> Web dashboard for sellers to manage their shops, products, orders, and deliverers on SwiftGoma.

---

## Stack

- **Framework:** Next.js 15 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State / Data fetching:** TanStack Query
- **Auth:** Cookie-based JWT (synced with SwiftGoma API)
- **Payments:** PawaPay mobile money (subscription flow)
- **Maps:** Mapbox (shop location picker)

---

## Features

- **Onboarding** — seller profile setup, KYC document upload, shop creation
- **Subscription** — plan selection (Starter / Business / Enterprise), Mobile Money payment via PawaPay
- **Products** — create, edit, archive products with images and variants, plan limits enforced
- **Categories** — browse approved categories, suggest new ones
- **Orders** — view, confirm, prepare, ship orders, assign deliverers
- **Deliverers** — create and manage deliverer accounts linked to shops
- **Security** — TOTP 2FA, passkeys, Google OAuth, active sessions management
- **Legal pages** — buyer policy, seller policy, delivery, refund, privacy, cookies

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign in, sign up, OTP verification
│   ├── (dashboard)/     # Protected seller pages
│   │   ├── products/    # Product management
│   │   ├── orders/      # Order management
│   │   ├── deliverers/  # Deliverer management
│   │   ├── settings/    # Security, profile, subscription
│   │   └── shop/        # Shop settings
│   └── legal/           # Legal pages
├── components/          # Shared UI components
├── lib/                 # API client, utilities
└── types/               # TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- SwiftGoma API running locally or deployed

### Installation

```bash
git clone https://github.com/SwiftGomaApp/SwiftGoma.git
cd seller
npm install
```

### Environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## Pages

| Path                     | Description                       |
| ------------------------ | --------------------------------- |
| `/auth/sign-in`          | Login with email/phone + password |
| `/auth/sign-up`          | Create seller account             |
| `/auth/verify`           | OTP verification                  |
| `/dashboard`             | Overview and stats                |
| `/dashboard/products`    | Product listing and management    |
| `/dashboard/orders`      | Order management                  |
| `/dashboard/deliverers`  | Deliverer management              |
| `/dashboard/shop`        | Shop settings                     |
| `/settings/security`     | 2FA, passkeys, sessions           |
| `/settings/subscription` | Plan and billing                  |
| `/legal/*`               | Legal pages                       |

---

## Subscription Plans

|                | Starter | Business | Enterprise |
| -------------- | ------- | -------- | ---------- |
| Price          | $10/mo  | $15/mo   | $25/mo     |
| Products       | 15      | 50       | Unlimited  |
| Images/product | 4       | 8        | 10         |
| Deliverers     | 1       | 3        | Unlimited  |
| Shops          | 1       | 1        | 3          |

---

## Related

- [SwiftGoma API](../server) — Express backend
- [Buyer App](../buyer) — Flutter mobile app for buyers
- [Deliverer App](../deliverer) — Flutter mobile app for deliverers

---

© 2026 SwiftGoma — All rights reserved.
