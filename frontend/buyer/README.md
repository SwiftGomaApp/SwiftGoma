# SwiftGoma — Buyer App

> Flutter mobile app for buyers to browse local shops, order products, pay with mobile money, and track deliveries in real-time.

[![SwiftGoma](https://img.shields.io/badge/SwiftGoma-Buyer-orange)](https://github.com/SwiftGomaApp/SwiftGoma)

---

## Stack

- **Framework:** Flutter + Dart
- **State management:** Riverpod
- **Navigation:** GoRouter
- **HTTP:** Dio
- **Local storage:** SQLite (favorites, offline cache)
- **Maps:** Mapbox (live delivery tracking)
- **Push notifications:** Expo / OneSignal
- **Auth:** Bearer token (JWT) — access + refresh, stored in secure device storage (Keychain / Keystore), synced with SwiftGoma API

---

## Features

- **Browse** — discover local shops and products in Goma by category
- **Search** — search products across all shops with filters
- **Orders** — place orders, pay with Orange Money, Airtel Money, or M-Pesa
- **Live tracking** — real-time GPS map showing deliverer location during delivery
- **Order history** — view past orders, statuses, and invoices
- **Favorites** — save products and shops locally (offline)
- **Notifications** — push notifications for order status changes
- **Profile** — manage addresses, preferences, notification settings
- **Auth** — email/phone OTP, Google OAuth, passkeys, TOTP 2FA

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
│   ├── auth/            # Login, register, OTP, Google OAuth, token storage
│   ├── home/             # Product discovery, featured, categories
│   ├── shop/              # Shop detail page
│   ├── product/           # Product detail, variants
│   ├── cart/               # Cart management
│   ├── orders/             # Place order, order history, tracking
│   ├── profile/             # User profile, addresses
│   └── notifications/       # Push notification handling
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
cd SwiftGoma/frontend/buyer
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

## Order Flow

```
Browse products
      │
      ▼
Add to cart → Select delivery address
      │
      ▼
Choose payment: Mobile Money or Cash on Delivery
      │
      ▼
Confirm order → Receive confirmation email + PDF
      │
      ▼
Track delivery on live map
      │
      ▼
Confirm reception → Invoice generated
```

---

## Payment Methods

| Provider         | Code                |
| ---------------- | ------------------- |
| Orange Money     | `ORANGE_COD`        |
| Airtel Money     | `AIRTEL_COD`        |
| M-Pesa (Vodacom) | `VODACOM_MPESA_COD` |
| Cash on delivery | `CASH_ON_DELIVERY`  |

---

## Related

- [SwiftGoma API](../../backend) — Express backend
- [Seller App](../seller) — Flutter mobile app for sellers
- [Deliverer App](../deliverer) — Flutter mobile app for deliverers
- [Admin Dashboard](../admin) — Next.js admin/support web app

---

© 2026 SwiftGoma — All rights reserved.
