import 'package:delivery/features/auth/data/models/auth_user.dart';
import 'package:delivery/features/auth/data/models/login_result.dart';
import 'package:dio/dio.dart';

class TotpRequiredException implements Exception {
  const TotpRequiredException(this.pendingToken);

  final String pendingToken;
}

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<LoginResult> loginWithPassword({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login/password',
      data: {'email': email, 'password': password},
    );
    return _parseLoginResult(response.data as Map<String, dynamic>);
  }

  Future<AuthUser> getMe() async {
    final response = await _dio.get('/auth/me');
    return AuthUser.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> requestLoginOtp({required String email}) async {
    await _dio.post('/auth/login/request-otp', data: {'email': email});
  }

  Future<LoginResult> verifyLoginOtp({
    required String email,
    required String code,
  }) async {
    final response = await _dio.post(
      '/auth/login/verify-otp',
      data: {'email': email, 'code': code},
    );
    return _parseLoginResult(response.data as Map<String, dynamic>);
  }

  Future<LoginResult> verifyTotp({
    required String pendingToken,
    required String code,
  }) async {
    final response = await _dio.post(
      '/auth/login/totp',
      data: {'pendingToken': pendingToken, 'code': code},
    );
    return _parseLoginResult(response.data as Map<String, dynamic>);
  }

  Future<AuthUser> verifyEmail({
    required String email,
    required String code,
  }) async {
    final response = await _dio.post(
      '/auth/verify-email',
      data: {'email': email, 'code': code},
    );
    return AuthUser.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> forgotPassword({required String email}) async {
    await _dio.post('/auth/password/forgot', data: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    await _dio.post(
      '/auth/password/reset',
      data: {'email': email, 'code': code, 'newPassword': newPassword},
    );
  }

  LoginResult _parseLoginResult(Map<String, dynamic> data) {
    if (data['requiresTotp'] == true) {
      throw TotpRequiredException(data['pendingToken'] as String);
    }
    return LoginResult.fromJson(data);
  }
}
