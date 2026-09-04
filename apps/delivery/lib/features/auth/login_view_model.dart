import 'dart:async';

import 'package:delivery/core/network/api_exception.dart';
import 'package:delivery/features/auth/data/repo/auth_repository.dart';
import 'package:delivery/features/auth/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginViewModel extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {}

  Future<void> loginWithPassword({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await ref
          .read(authRepositoryProvider)
          .loginWithPassword(email: email, password: password);
      ref.read(currentUserProvider.notifier).setUser(user);
    });
  }

  Future<void> requestEmailOtp({required String email}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).requestLoginOtp(email: email),
    );
  }

  Future<String?> verifyEmailOtp({
    required String email,
    required String code,
  }) async {
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .verifyLoginOtp(email: email, code: code);
      ref.read(currentUserProvider.notifier).setUser(user);
      return null;
    } on RoleNotAllowedException catch (e) {
      return e.message;
    } catch (e) {
      return apiExceptionOf(e)?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  Future<String?> verifyTotp({
    required String pendingToken,
    required String code,
  }) async {
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .verifyTotp(pendingToken: pendingToken, code: code);
      ref.read(currentUserProvider.notifier).setUser(user);
      return null;
    } on RoleNotAllowedException catch (e) {
      return e.message;
    } catch (e) {
      return apiExceptionOf(e)?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}

final loginViewModelProvider = AsyncNotifierProvider<LoginViewModel, void>(
  LoginViewModel.new,
);
