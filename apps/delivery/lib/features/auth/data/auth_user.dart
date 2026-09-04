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
    );
  }
}
