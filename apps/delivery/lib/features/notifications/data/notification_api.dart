import 'package:delivery/features/notifications/data/models/notification_preference.dart';
import 'package:dio/dio.dart';

class NotificationApi {
  NotificationApi(this._dio);

  final Dio _dio;

  Future<List<NotificationPreference>> getPreferences() async {
    final response = await _dio.get('/notifications/preferences');
    final data = response.data as List<dynamic>;
    return data
        .map(
          (e) => NotificationPreference.fromJson(e as Map<String, dynamic>),
        )
        .toList();
  }

  Future<NotificationPreference> updatePreference({
    required String type,
    bool? inApp,
    bool? push,
    bool? sms,
  }) async {
    final response = await _dio.put(
      '/notifications/preferences',
      data: {'type': type, 'inApp': ?inApp, 'push': ?push, 'sms': ?sms},
    );
    return NotificationPreference.fromJson(
      response.data as Map<String, dynamic>,
    );
  }
}
