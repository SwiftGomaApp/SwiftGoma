# SwiftGoma — Seller App

> Flutter mobile app for sellers to manage their shops, products, orders, and deliverers on SwiftGoma.

[![SwiftGoma](https://img.shields.io/badge/SwiftGoma-Seller-orange)](https://github.com/SwiftGomaApp/SwiftGoma)

---

## Stack

- **Framework:** Flutter + Dart
- **State management:** Riverpod
- **Navigation:** GoRouter
- **HTTP:** Dio
- **Local storage:** SQLite (offline cache)
- **Maps:** Mapbox (shop location picker)
- **Push notifications:** Expo / OneSignal
- **Payments:** PawaPay mobile money (subscription flow)
- **Auth:** Bearer token (JWT) — access + refresh, stored in secure device storage (Keychain / Keystore), synced with SwiftGoma API

---

## Features

- **Onboarding** — seller profile setup, KYC document upload, shop creation
- **Subscription** — plan selection (Starter / Business / Enterprise), Mobile Money payment via PawaPay
- **Products** — create, edit, archive products with images and variants, plan limits enforced
- **Categories** — browse approved categories, suggest new ones
- **Orders** — view, confirm, prepare, ship orders, assign deliverers
- **Deliverers** — create and manage deliverer accounts linked to shops
- **Security** — TOTP 2FA, passkeys, Google OAuth, active sessions management
- **Notifications** — push notifications for new orders and status changes
- **Legal pages** — buyer policy, seller policy, delivery, refund, privacy, cookies

---

## Project Structure

```
lib/
├── core/
│   ├── config/          # App config, API base URL, constants
│   ├── errors/          # Exception handling
│   ├── network/         # Dio client, auth interceptor (attaches Bearer token, handles refresh)
│   └── utils/           # Helpers, formatters
├── features/
│   ├── auth/            # Login, register, OTP, Google OAuth, TOTP, passkeys, token storage
│   ├── onboarding/       # Seller profile, KYC upload, shop creation
│   ├── subscription/       # Plan selection, PawaPay payment flow
│   ├── products/             # Product CRUD, variants, images, categories
│   ├── orders/                 # Order list, detail, status updates, deliverer assignment
│   ├── deliverers/                # Deliverer account creation and management
│   ├── shop/                        # Shop settings, location picker
│   └── settings/                      # Security (2FA, passkeys, sessions), profile
└── shared/
    ├── widgets/         # Shared UI components
    └── theme/            # Colors, typography, theme
```

---

## Getting Started

### Prerequisites

- Flutter 3.x+
- Dart 3.x+
- SwiftGoma API running

### Installation

```bash
git clone https://github.com/SwiftGomaApp/SwiftGoma.git
cd SwiftGoma/frontend/seller
flutter pub get
```

### Environment

Create `lib/core/config/env.dart`:

```dart
class Env {
  static const apiUrl = 'http://localhost:3001';
  static const mapboxToken = 'your_mapbox_token';
}
```

### Run

```bash
# Android
flutter run

# iOS
flutter run -d ios

# Release build
flutter build apk --release
flutter build ipa --release
```

---

## Onboarding Flow

```
Sign up (phone/email + password)
        │
        ▼
   OTP verification
        │
        ▼
   Seller profile + KYC document upload
        │
        ▼
   Create first shop
        │
        ▼
   Select subscription plan → Pay via Mobile Money
        │
        ▼
   Dashboard unlocked — add products, receive orders
```

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

- [SwiftGoma API](../../backend) — Express backend
- [Buyer App](../buyer) — Flutter mobile app for buyers
- [Deliverer App](../deliverer) — Flutter mobile app for deliverers
- [Admin Dashboard](../admin) — Next.js admin/support web app

---

© 2026 SwiftGoma — All rights reserved.
