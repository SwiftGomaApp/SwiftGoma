import 'package:delivery/core/config/env.dart';
import 'package:delivery/core/network/jwt_utils.dart';
import 'package:delivery/core/network/mobile_headers.dart';
import 'package:delivery/core/network/token_storage.dart';
import 'package:dio/dio.dart';

/// Owns access-token refresh so both `dio_client.dart`'s interceptor and an
/// app-resume listener can share it: concurrent refresh attempts are
/// deduped into a single request, and the stored session is only cleared
/// when the server explicitly rejects the refresh token (401/403) — a
/// network hiccup during refresh must not log the user out.
class TokenRefresher {
  TokenRefresher({required TokenStorage tokenStorage})
    : _tokenStorage = tokenStorage,
      _refreshDio = Dio(
        BaseOptions(baseUrl: Env.apiBaseUrl, headers: mobileHeaders),
      );

  final TokenStorage _tokenStorage;
  final Dio _refreshDio;
  Future<bool>? _refreshing;

  static const defaultBuffer = Duration(minutes: 2);

  Future<bool> refresh() =>
      _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);

  /// Refreshes now if the stored access token expires within [buffer].
  Future<void> refreshIfExpiringSoon({Duration buffer = defaultBuffer}) async {
    final token = await _tokenStorage.readAccessToken();
    if (token != null && isJwtExpiringSoon(token, buffer: buffer)) {
      await refresh();
    }
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) return false;
    try {
      final response = await _refreshDio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data as Map<String, dynamic>;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) {
        await _tokenStorage.clearTokens();
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
