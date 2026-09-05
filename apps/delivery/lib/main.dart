import 'package:delivery/app/app.dart';
import 'package:delivery/core/config/env.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (kDebugMode) {
    OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
  }
  OneSignal.initialize(Env.oneSignalAppId);
  runApp(const ProviderScope(child: App()));
}
