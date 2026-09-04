import 'package:delivery/features/notifications/data/models/notification_preference.dart';
import 'package:delivery/features/notifications/data/notification_api.dart';

class NotificationRepository {
  NotificationRepository({required NotificationApi notificationApi})
    : _notificationApi = notificationApi;

  final NotificationApi _notificationApi;

  Future<List<NotificationPreference>> getPreferences() {
    return _notificationApi.getPreferences();
  }

  Future<NotificationPreference> updatePreference({
    required String type,
    bool? inApp,
    bool? push,
    bool? sms,
  }) {
    return _notificationApi.updatePreference(
      type: type,
      inApp: inApp,
      push: push,
      sms: sms,
    );
  }
}
