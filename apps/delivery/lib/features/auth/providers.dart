import 'dart:async';
import 'dart:io';

import 'package:delivery/app/locator.dart';
import 'package:delivery/core/network/api_exception.dart';
import 'package:delivery/features/auth/data/auth_api.dart';
import 'package:delivery/features/auth/data/models/auth_user.dart';
import 'package:delivery/features/auth/data/repo/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    authApi: ref.watch(authApiProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

class CurrentUserNotifier extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() async {
    final user = await ref.read(authRepositoryProvider).getCurrentUser();
    if (user != null) OneSignal.login(user.id);
    return user;
  }

  void setUser(AuthUser user) {
    state = AsyncData(user);
    OneSignal.login(user.id);
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    OneSignal.logout();
    state = const AsyncData(null);
  }

  Future<String?> updateName(String name) async {
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .updateProfile(name: name);
      state = AsyncData(user);
      return null;
    } catch (e) {
      return apiExceptionOf(e)?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  Future<String?> updateAvatar(File imageFile) async {
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .uploadAvatar(imageFile);
      state = AsyncData(user);
      return null;
    } catch (e) {
      return apiExceptionOf(e)?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}

final currentUserProvider =
    AsyncNotifierProvider<CurrentUserNotifier, AuthUser?>(
      CurrentUserNotifier.new,
    );
