import 'package:dio/dio.dart';

/// Unwraps the [ApiException] that `dio_client.dart`'s error interceptor
/// attaches to a failed request. Requests reject with a [DioException]
/// whose `.error` field holds the mapped [ApiException] — the exception
/// itself is never thrown directly — so `on ApiException catch (e)` never
/// matches. Catch broadly and call this instead, e.g.:
/// ```dart
/// try {
///   ...
/// } catch (e) {
///   final message = apiExceptionOf(e)?.message ?? 'Generic fallback.';
/// }
/// ```
ApiException? apiExceptionOf(Object error) {
  if (error is ApiException) return error;
  if (error is DioException && error.error is ApiException) {
    return error.error as ApiException;
  }
  return null;
}

class ApiException implements Exception {
  const ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.requestId,
    this.details,
  });

  final String message;
  final int? statusCode;
  final String? code;
  final String? requestId;
  final dynamic details;

  static const badRequest = 'BAD_REQUEST';
  static const validationError = 'VALIDATION_ERROR';
  static const unauthorized = 'UNAUTHORIZED';
  static const forbidden = 'FORBIDDEN';
  static const notFound = 'NOT_FOUND';
  static const conflict = 'CONFLICT';
  static const tooManyRequests = 'TOO_MANY_REQUESTS';
  static const ipBlocked = 'IP_BLOCKED';
  static const internalError = 'INTERNAL_ERROR';

  static const emailAlreadyRegistered = 'EMAIL_ALREADY_REGISTERED';
  static const emailNotVerified = 'EMAIL_NOT_VERIFIED';
  static const googleNotLinked = 'GOOGLE_NOT_LINKED';
  static const appleNotLinked = 'APPLE_NOT_LINKED';
  static const noPasswordSet = 'NO_PASSWORD_SET';
  static const otpInvalid = 'OTP_INVALID';
  static const otpExpired = 'OTP_EXPIRED';
  static const resetCodeInvalid = 'RESET_CODE_INVALID';
  static const totpInvalid = 'TOTP_INVALID';
  static const roleNotSelfAssignable = 'ROLE_NOT_SELF_ASSIGNABLE';
  static const accountDeletionPending = 'ACCOUNT_DELETION_PENDING';
  static const smsSendFailed = 'SMS_SEND_FAILED';

  bool get isNetworkError => statusCode == null;
  bool get isUnauthorized => statusCode == 401 || code == unauthorized;
  bool get isForbidden => statusCode == 403 || code == forbidden;
  bool get isNotFound => statusCode == 404 || code == notFound;
  bool get isConflict => statusCode == 409 || code == conflict;
  bool get isValidationError => statusCode == 422 || code == validationError;
  bool get isRateLimited =>
      statusCode == 429 || code == tooManyRequests || code == ipBlocked;

  int? get retryAfterSeconds {
    final value = details is Map ? details['retryAfterSeconds'] : null;
    return value is int ? value : null;
  }

  @override
  String toString() => message;
}
