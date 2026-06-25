# SwiftGoma — Deliverer App

> Flutter mobile app for deliverers to manage delivery assignments, broadcast live GPS location, and confirm deliveries in Goma, DRC.

[![SwiftGoma](https://img.shields.io/badge/SwiftGoma-Deliverer-orange)](https://github.com/SwiftGomaApp/SwiftGoma)

---

## Stack

- **Framework:** Flutter + Dart
- **State management:** Riverpod
- **Navigation:** GoRouter
- **HTTP:** Dio
- **Maps:** Mapbox (route display, location broadcast)
- **Real-time:** Socket.io client (live GPS broadcast)
- **Push notifications:** Expo / OneSignal
- **Auth:** Cookie-based JWT (synced with SwiftGoma API)

---

## Features

- **Delivery queue** — view assigned deliveries with buyer address and order details
- **Live GPS broadcast** — real-time location sent to buyer during delivery via Socket.io
- **Status updates** — mark orders as picked up, in transit, delivered
- **Order details** — view items, buyer contact, delivery address, payment method
- **Availability toggle** — go online/offline to receive new assignments
- **Push notifications** — instant alert when seller assigns a new delivery
- **Auth** — login with credentials created by seller

---

## Project Structure

```
lib/
├── core/
│   ├── config/          # App config, API base URL, constants
│   ├── errors/          # Exception handling
│   ├── network/         # Dio client, interceptors, Socket.io
│   └── utils/           # Helpers, location utils
├── features/
│   ├── auth/            # Login (credentials provided by seller)
│   ├── deliveries/      # Delivery list, detail, status update
│   ├── tracking/        # Live GPS broadcast, map view
│   └── profile/         # Deliverer profile, availability
└── shared/
    ├── widgets/         # Shared UI components
    └── theme/           # Colors, typography, theme
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
cd SwiftGoma/deliverer
flutter pub get
```

### Environment

Create `lib/core/config/env.dart`:

```dart
class Env {
  static const apiUrl = 'http://localhost:3001';
  static const mapboxToken = 'your_mapbox_token';
  static const socketUrl = 'http://localhost:3001';
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

## Delivery Flow

```
Receive push notification — new delivery assigned
              │
              ▼
Open order details — view items + buyer address
              │
              ▼
Pick up from seller → Start delivery
              │
              ▼
GPS broadcast starts → Buyer sees live location on map
              │
              ▼
Arrive at buyer address → Mark as DELIVERED
              │
              ▼
Buyer confirms reception (48h window) → Order COMPLETED
```

---

## Socket.io Events

| Event               | Direction       | Description               |
| ------------------- | --------------- | ------------------------- |
| `delivery:join`     | Client → Server | Join order tracking room  |
| `delivery:location` | Client → Server | Broadcast GPS coordinates |
| `delivery:status`   | Client → Server | Update delivery status    |

---

## Account Setup

Deliverer accounts are created by sellers — deliverers do not sign up themselves.

1. Seller creates deliverer account via dashboard → `POST /api/v1/sellers/deliverers`
2. Seller shares phone number + auto-generated password with deliverer
3. Deliverer logs in with those credentials
4. Deliverer is linked exclusively to that seller's shops

---

## Related

- [SwiftGoma API](../server) — Express backend
- [Seller Dashboard](../seller) — Next.js seller web app
- [Buyer App](../buyer) — Flutter buyer app

---

© 2026 SwiftGoma — All rights reserved.
