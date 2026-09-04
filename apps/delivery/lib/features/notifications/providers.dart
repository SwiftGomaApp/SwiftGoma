import 'package:delivery/app/locator.dart';
import 'package:delivery/features/notifications/data/models/notification_preference.dart';
import 'package:delivery/features/notifications/data/notification_api.dart';
import 'package:delivery/features/notifications/data/repo/notification_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationApiProvider = Provider<NotificationApi>((ref) {
  return NotificationApi(ref.watch(dioProvider));
});

final notificationRepositoryProvider = Provider<NotificationRepository>((
  ref,
) {
  return NotificationRepository(
    notificationApi: ref.watch(notificationApiProvider),
  );
});

/// Notification types that actually ever reach a rider, verified against the
/// server's `createNotification`/`broadcastNotification` call sites:
/// - ORDER_STATUS: `notifyRider(...)` in order.service.js
/// - ORDER_MESSAGE: order chat includes the rider role as a recipient
/// - SYSTEM: `broadcastNotification` fans out to every user
///
/// Excluded: PAYMENT and SUPPORT are never sent to a rider today (PAYMENT
/// only targets buyers or seller wallet/subscription/expense flows; SUPPORT
/// only targets ADMIN for KYC review) — PROMO/SELLER_ONBOARDING are
/// buyer/seller-only, and ACCOUNT_SECURITY is forced on, not toggleable.
const notificationPreferenceTypes = ['ORDER_STATUS', 'ORDER_MESSAGE', 'SYSTEM'];

/// Preferences keyed by type, defaulting to inApp/push = true, sms = false
/// for any type the backend hasn't stored a row for yet (matches its own
/// create defaults).
class NotificationPreferencesNotifier
    extends AsyncNotifier<Map<String, NotificationPreference>> {
  @override
  Future<Map<String, NotificationPreference>> build() async {
    final fetched = await ref
        .read(notificationRepositoryProvider)
        .getPreferences();
    final byType = {for (final p in fetched) p.type: p};
    return {
      for (final type in notificationPreferenceTypes)
        type:
            byType[type] ??
            NotificationPreference(
              type: type,
              inApp: true,
              push: true,
              sms: false,
            ),
    };
  }

  Future<void> setInApp(String type, bool value) =>
      _update(type, inApp: value);

  Future<void> setPush(String type, bool value) => _update(type, push: value);

  Future<void> setSms(String type, bool value) => _update(type, sms: value);

  Future<void> _update(String type, {bool? inApp, bool? push, bool? sms}) async {
    final current = state.value;
    if (current == null) return;

    final previous = current[type]!;
    state = AsyncData({
      ...current,
      type: previous.copyWith(inApp: inApp, push: push, sms: sms),
    });

    try {
      final updated = await ref
          .read(notificationRepositoryProvider)
          .updatePreference(type: type, inApp: inApp, push: push, sms: sms);
      state = AsyncData({...current, type: updated});
    } catch (_) {
      state = AsyncData({...current, type: previous});
    }
  }
}

final notificationPreferencesProvider =
    AsyncNotifierProvider<
      NotificationPreferencesNotifier,
      Map<String, NotificationPreference>
    >(NotificationPreferencesNotifier.new);
