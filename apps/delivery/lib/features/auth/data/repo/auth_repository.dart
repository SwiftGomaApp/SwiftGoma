import 'package:delivery/core/network/token_storage.dart';
import 'package:delivery/features/auth/data/auth_api.dart';
import 'package:delivery/features/auth/data/models/auth_user.dart';
import 'package:delivery/features/auth/data/models/login_result.dart';

/// Thrown when a login succeeds against the backend but the account's role
/// isn't [AuthRepository.allowedRole] — this app is rider-only.
class RoleNotAllowedException implements Exception {
  const RoleNotAllowedException(this.role);

  final String role;

  String get message =>
      "Ce compte n'a pas accès à l'application livreur.";
}

class AuthRepository {
  AuthRepository({required AuthApi authApi, required TokenStorage tokenStorage})
    : _authApi = authApi,
      _tokenStorage = tokenStorage;

  final AuthApi _authApi;
  final TokenStorage _tokenStorage;

  static const allowedRole = 'RIDER';

  Future<AuthUser> loginWithPassword({
    required String email,
    required String password,
  }) async {
    final result = await _authApi.loginWithPassword(
      email: email,
      password: password,
    );
    return _completeLogin(result);
  }

  /// Returns the current user if a stored session is still valid for this
  /// app's [allowedRole], or null otherwise (no session, expired session, or
  /// an account whose role no longer qualifies) — clearing any stale tokens
  /// in the latter cases. Call this on app start before routing.
  Future<AuthUser?> getCurrentUser() async {
    if (!await _tokenStorage.hasStoredSession()) return null;
    try {
      final user = await _authApi.getMe();
      if (user.role != allowedRole) {
        await _tokenStorage.clearTokens();
        return null;
      }
      return user;
    } catch (_) {
      await _tokenStorage.clearTokens();
      return null;
    }
  }

  Future<void> requestLoginOtp({required String email}) {
    return _authApi.requestLoginOtp(email: email);
  }

  Future<AuthUser> verifyLoginOtp({
    required String email,
    required String code,
  }) async {
    final result = await _authApi.verifyLoginOtp(email: email, code: code);
    return _completeLogin(result);
  }

  Future<AuthUser> verifyTotp({
    required String pendingToken,
    required String code,
  }) async {
    final result = await _authApi.verifyTotp(
      pendingToken: pendingToken,
      code: code,
    );
    return _completeLogin(result);
  }

  /// Rejects accounts that aren't [allowedRole] before ever persisting their
  /// tokens — this app is rider-only.
  Future<AuthUser> _completeLogin(LoginResult result) async {
    if (result.user.role != allowedRole) {
      throw RoleNotAllowedException(result.user.role);
    }
    await _saveSession(result);
    return result.user;
  }

  Future<AuthUser> verifyEmail({required String email, required String code}) {
    return _authApi.verifyEmail(email: email, code: code);
  }

  Future<void> forgotPassword({required String email}) {
    return _authApi.forgotPassword(email: email);
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) {
    return _authApi.resetPassword(
      email: email,
      code: code,
      newPassword: newPassword,
    );
  }

  Future<void> logout() {
    return _tokenStorage.clearTokens();
  }

  Future<void> _saveSession(LoginResult result) {
    return _tokenStorage.saveTokens(
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    );
  }
}
