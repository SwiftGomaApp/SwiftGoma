class AuthUser {
  const AuthUser({
    required this.id,
    required this.name,
    required this.role,
    this.email,
    this.isEmailVerified = false,
    this.phone,
    this.isPhoneVerified = false,
    this.avatarUrl,
    this.hasPassword = false,
    this.twoFactorEnabled = false,
    this.emails = const [],
    this.passkeys = const [],
  });

  final String id;
  final String name;
  final String role;
  final String? email;
  final bool isEmailVerified;
  final String? phone;
  final bool isPhoneVerified;
  final String? avatarUrl;
  final bool hasPassword;
  final bool twoFactorEnabled;
  final List<UserEmail> emails;
  final List<UserPasskey> passkeys;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      email: json['email'] as String?,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      phone: json['phone'] as String?,
      isPhoneVerified: json['isPhoneVerified'] as bool? ?? false,
      avatarUrl: json['avatarUrl'] as String?,
      hasPassword: json['hasPassword'] as bool? ?? false,
      twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
      emails: (json['emails'] as List<dynamic>? ?? [])
          .map((e) => UserEmail.fromJson(e as Map<String, dynamic>))
          .toList(),
      passkeys: (json['passkeys'] as List<dynamic>? ?? [])
          .map((p) => UserPasskey.fromJson(p as Map<String, dynamic>))
          .toList(),
    );
  }
}

class UserEmail {
  const UserEmail({
    required this.id,
    required this.email,
    required this.isPrimary,
    required this.isVerified,
  });

  final String id;
  final String email;
  final bool isPrimary;
  final bool isVerified;

  factory UserEmail.fromJson(Map<String, dynamic> json) {
    return UserEmail(
      id: json['id'] as String,
      email: json['email'] as String,
      isPrimary: json['isPrimary'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
    );
  }
}

class UserPasskey {
  const UserPasskey({
    required this.id,
    this.deviceName,
    this.deviceType,
    this.backedUp = false,
    this.transports,
    this.lastUsedAt,
  });

  final String id;
  final String? deviceName;
  final String? deviceType;
  final bool backedUp;
  final String? transports;
  final DateTime? lastUsedAt;

  factory UserPasskey.fromJson(Map<String, dynamic> json) {
    return UserPasskey(
      id: json['id'] as String,
      deviceName: json['deviceName'] as String?,
      deviceType: json['deviceType'] as String?,
      backedUp: json['backedUp'] as bool? ?? false,
      transports: json['transports'] as String?,
      lastUsedAt: json['lastUsedAt'] == null
          ? null
          : DateTime.parse(json['lastUsedAt'] as String),
    );
  }
}
