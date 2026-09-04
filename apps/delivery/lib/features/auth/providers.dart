import 'dart:async';

import 'package:delivery/app/locator.dart';
import 'package:delivery/features/auth/data/auth_api.dart';
import 'package:delivery/features/auth/data/models/auth_user.dart';
import 'package:delivery/features/auth/data/repo/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    authApi: ref.watch(authApiProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

/// The signed-in user for the current session, or null if signed out.
/// [build] checks the stored session once (used on app start); a successful
/// login pushes the fresh user in directly via [CurrentUserNotifier.setUser]
/// instead of re-fetching it.
class CurrentUserNotifier extends AsyncNotifier<AuthUser?> {
  @override
  FutureOr<AuthUser?> build() {
    return ref.read(authRepositoryProvider).getCurrentUser();
  }

  void setUser(AuthUser user) {
    state = AsyncData(user);
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }
}

final currentUserProvider =
    AsyncNotifierProvider<CurrentUserNotifier, AuthUser?>(
      CurrentUserNotifier.new,
    );
