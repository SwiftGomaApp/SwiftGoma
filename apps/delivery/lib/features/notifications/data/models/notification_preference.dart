class NotificationPreference {
  const NotificationPreference({
    required this.type,
    required this.inApp,
    required this.push,
    required this.sms,
  });

  final String type;
  final bool inApp;
  final bool push;
  final bool sms;

  factory NotificationPreference.fromJson(Map<String, dynamic> json) {
    return NotificationPreference(
      type: json['type'] as String,
      inApp: json['inApp'] as bool? ?? true,
      push: json['push'] as bool? ?? true,
      sms: json['sms'] as bool? ?? false,
    );
  }

  NotificationPreference copyWith({bool? inApp, bool? push, bool? sms}) {
    return NotificationPreference(
      type: type,
      inApp: inApp ?? this.inApp,
      push: push ?? this.push,
      sms: sms ?? this.sms,
    );
  }
}
