import 'package:delivery/core/config/env.dart';
import 'package:delivery/core/network/api_exception.dart';
import 'package:delivery/core/network/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

const _mobileHeaders = {
  'Accept': 'application/json',
  'x-client-type': 'mobile',
  'X-Locale': 'fr',
};

Dio createDio(TokenStorage tokenStorage) {
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: _mobileHeaders,
    ),
  );

  final refreshDio = Dio(
    BaseOptions(baseUrl: Env.apiBaseUrl, headers: _mobileHeaders),
  );

  Future<bool>? refreshing;

  Future<bool> doRefresh() async {
    final refreshToken = await tokenStorage.readRefreshToken();
    if (refreshToken == null) return false;
    try {
      final response = await refreshDio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data as Map<String, dynamic>;
      await tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await tokenStorage.clearTokens();
      return false;
    }
  }

  Future<bool> refreshTokens() =>
      refreshing ??= doRefresh().whenComplete(() => refreshing = null);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokenStorage.readAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        final body = response.data;
        if (body is Map<String, dynamic> && body['success'] == true) {
          response.data = body['data'];
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        final isUnauthorized = error.response?.statusCode == 401;
        final alreadyRetried = error.requestOptions.extra['retried'] == true;

        if (isUnauthorized && !alreadyRetried) {
          final refreshed = await refreshTokens();
          if (refreshed) {
            final retryOptions = error.requestOptions..extra['retried'] = true;
            final newToken = await tokenStorage.readAccessToken();
            if (newToken != null) {
              retryOptions.headers['Authorization'] = 'Bearer $newToken';
            }
            try {
              final response = await dio.fetch(retryOptions);
              return handler.resolve(response);
            } on DioException catch (e) {
              return handler.next(_mapError(e));
            }
          }
        }

        handler.next(_mapError(error));
      },
    ),
  );

  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
  }

  return dio;
}

DioException _mapError(DioException error) {
  final response = error.response;
  final data = response?.data;
  final errorBody = data is Map<String, dynamic>
      ? data['error'] as Map<String, dynamic>?
      : null;

  final String message;
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      message = 'La connexion a expiré. Veuillez réessayer.';
    case DioExceptionType.connectionError:
      message = 'Aucune connexion Internet. Veuillez vérifier votre réseau.';
    case DioExceptionType.badResponse:
      message =
          (errorBody?['message'] as String?) ??
          'Une erreur est survenue (${response?.statusCode}).';
    case DioExceptionType.cancel:
      message = 'Requête annulée.';
    default:
      message = 'Erreur inattendue. Veuillez réessayer.';
  }

  return error.copyWith(
    error: ApiException(
      message: message,
      statusCode: response?.statusCode,
      code: errorBody?['code'] as String?,
      requestId: errorBody?['requestId'] as String?,
      details: errorBody?['details'],
    ),
  );
}
