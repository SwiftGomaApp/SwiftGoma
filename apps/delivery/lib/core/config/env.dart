class Env {
  Env._();

  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'SwiftGoma Delivery',
  );
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://test.api.swiftgoma.com/api/v1',
  );
  static const String mapboxAccessToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
  );
  static const String fcmSenderId = String.fromEnvironment('FCM_SENDER_ID');
  static const String sentryDsn = String.fromEnvironment('SENTRY_DSN');
}
