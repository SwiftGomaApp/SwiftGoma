import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:swiftgoma_client/app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const SwiftgomaApp());
}
