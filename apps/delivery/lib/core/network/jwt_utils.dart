import 'dart:convert';

Map<String, dynamic>? decodeJwtPayload(String token) {
  final parts = token.split('.');
  if (parts.length != 3) return null;
  try {
    final normalized = base64Url.normalize(parts[1]);
    final payload = utf8.decode(base64Url.decode(normalized));
    return jsonDecode(payload) as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
}

DateTime? jwtExpiry(String token) {
  final exp = decodeJwtPayload(token)?['exp'];
  if (exp is! int) return null;
  return DateTime.fromMillisecondsSinceEpoch(exp * 1000);
}

bool isJwtExpiringSoon(String token, {required Duration buffer}) {
  final expiry = jwtExpiry(token);
  if (expiry == null) return false;
  return expiry.difference(DateTime.now()) <= buffer;
}
