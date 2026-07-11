# SwiftGoma

> The local marketplace for Goma, DRC — buy and sell in your city, pay with mobile money.

SwiftGoma connects buyers, sellers, and deliverers in Goma and surrounding areas. Sellers list products, buyers order and pay via mobile money (Orange, Airtel, M-Pesa), and deliverers handle last-mile delivery with real-time GPS tracking. An internal admin dashboard handles platform administration and support.

---

## Products

| Product             | Tech                       | Description                                                   |
| ------------------- | -------------------------- | ------------------------------------------------------------- |
| **API**             | Node.js / Express 5        | Core backend — auth, orders, payments, notifications          |
| **Buyer App**       | Flutter (mobile)           | Mobile app for buyers to browse, order, track                 |
| **Seller App**      | Flutter (mobile)           | Mobile app for sellers to manage products, orders, deliverers |
| **Deliverer App**   | Flutter (mobile)           | Mobile app for deliverers to manage and track deliveries      |
| **Admin Dashboard** | Next.js / TypeScript (web) | Internal web app for platform admin and support               |

---

## Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   Buyer App      │  │   Seller App     │  │ Deliverer App   │  │ Admin Dashboard   │
│   (Flutter)       │  │   (Flutter)       │  │   (Flutter)       │  │   (Next.js)        │
│   Bearer token     │  │   Bearer token     │  │   Bearer token     │  │   HttpOnly cookie  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └─────────┬─────────┘
         │                     │                     │                      │
         └─────────────────────┴─────────────────────┴──────────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │      SwiftGoma API       │
                        │   (Express 5 + Prisma)   │
                        │  Bearer or cookie auth   │
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                       │
       ┌──────▼──────┐      ┌───────▼──────┐      ┌────────▼───────┐
       │ PostgreSQL  │      │    Redis      │      │   Socket.io    │
       │  (Prisma)   │      │  (sessions,   │      │ (live tracking,│
       └─────────────┘      │   cache)      │      │ notifications) │
                             └──────────────┘      └────────────────┘
```

---

## Key Features

**For Buyers**

- Browse products from local shops in Goma
- Pay securely with Orange Money, Airtel Money, or M-Pesa
- Real-time order tracking with live GPS
- 48h buyer protection window

**For Sellers**

- Create and manage multiple shops, from the SwiftGoma mobile app
- Plan-gated product limits (Starter / Business / Enterprise)
- Manage deliverers, track orders, receive payments
- Automated invoicing and PDF receipts
- Seller wallet with pending / available / blocked balance

**For Deliverers**

- Linked to a specific seller's shops
- Receive delivery assignments via push notification
- Broadcast live GPS location to buyer during delivery
- Mark orders as delivered

**For Admin / Support**

- Platform-wide seller, buyer, and order oversight
- KYC review and approval
- Category approval
- Dispute and support ticket handling

---

## Tech Stack

### Backend (API)

- Node.js + Express 5 (CommonJS)
- PostgreSQL + Prisma ORM
- Redis (sessions, caching)
- Socket.io (real-time)
- PawaPay (mobile money — Orange, Airtel, M-Pesa)
- Cloudinary (images, PDF storage)
- Nodemailer + SMTP (transactional email)
- Africa's Talking (SMS / OTP)
- Sentry (error monitoring)
- Auth: Bearer JWT for mobile apps, HttpOnly cookies for admin web — single shared middleware

### Mobile Apps (Buyer, Seller, Deliverer)

- Flutter + Riverpod
- GoRouter
- Mapbox (live tracking map)
- Dio + SQLite
- Expo / OneSignal push notifications
- Auth: Bearer token (access + refresh), stored in secure device storage (Keychain / Keystore)

### Admin Dashboard

- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Auth: HttpOnly session cookie

---

## Subscription Plans

|                   | Starter | Business     | Enterprise         |
| ----------------- | ------- | ------------ | ------------------ |
| **Price**         | $10/mo  | $15/mo       | $25/mo             |
| Products          | 15      | 50           | Unlimited          |
| Images/product    | 4       | 8            | 10                 |
| Deliverers        | 1       | 3            | Unlimited          |
| Shops             | 1       | 1            | 3                  |
| Featured products | —       | 3            | Unlimited          |
| Analytics         | Basic   | Advanced     | Full + CSV export  |
| Support           | Email   | Email + Chat | Dedicated (4h SLA) |

> SwiftGoma charges **zero commission** on sales. Revenue is subscription-only.

---

## Order Flow

```
Buyer places order
        │
        ▼
   Mobile Money ──────────────────────────────────────────┐
   (PawaPay webhook)                                       │
        │                                                  │
        ▼                                                  ▼
  PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED → COMPLETED
                 ▲                     │
           COD: seller            Deliverer assigned
           confirms manually      GPS tracking active
```

- Auto-complete 48h after delivery if buyer doesn't confirm
- Funds released to seller wallet on COMPLETED
- Refunds go back to buyer's mobile money number

---

## Payment Corridors (DRC)

| Provider         | Corridor            |
| ---------------- | ------------------- |
| Orange Money     | `ORANGE_COD`        |
| Airtel Money     | `AIRTEL_COD`        |
| M-Pesa (Vodacom) | `VODACOM_MPESA_COD` |

---

## Repository Structure

```
swiftgoma/
├── backend/           # Express API
└── frontend/
    ├── buyer/         # Flutter buyer mobile app
    ├── seller/        # Flutter seller mobile app
    ├── deliverer/     # Flutter deliverer mobile app
    └── admin/          # Next.js admin/support web app
```

---

## Legal

- [Politique Acheteur](/legal/buyer-policy)
- [Politique Vendeur](/legal/seller)
- [Politique de Livraison](/legal/delivery)
- [Politique de Remboursement](/legal/refund)
- [Politique de Confidentialité](/legal/privacy)
- [Politique de Cookies](/legal/cookies)

---

## About

SwiftGoma is built for the Goma market — a city of over 1 million people in North Kivu, DRC, with a fast-growing mobile money ecosystem. The platform is designed to work in low-connectivity environments with offline-first mobile apps and resilient payment retry logic.

**Company:** SWIFTGOMA
**Location:** Goma, Nord-Kivu, République Démocratique du Congo
**Contact:** info@swiftgoma.com

---

© 2026 SwiftGoma — All rights reserved.
