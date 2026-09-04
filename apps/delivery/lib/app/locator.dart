import 'package:delivery/core/network/dio_client.dart';
import 'package:delivery/core/network/token_refresher.dart';
import 'package:delivery/core/network/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final tokenRefresherProvider = Provider<TokenRefresher>((ref) {
  return TokenRefresher(tokenStorage: ref.watch(tokenStorageProvider));
});

final dioProvider = Provider<Dio>((ref) {
  return createDio(
    ref.watch(tokenStorageProvider),
    ref.watch(tokenRefresherProvider),
  );
});
