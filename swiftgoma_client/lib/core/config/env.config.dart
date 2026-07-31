class EnvConfig {
  EnvConfig._();

  static const String envName = String.fromEnvironment(
    'ENV_NAME',
    defaultValue: 'dev',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.dev.swiftgoma.com',
  );

  static const bool enableLogging = bool.fromEnvironment(
    'ENABLE_LOGGING',
    defaultValue: true,
  );

  static bool get isDev => envName == 'dev';
  static bool get isProd => envName == 'prod';
}
