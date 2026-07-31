import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'routes/app_router.dart';
import 'routes/app_routes.dart';

/// Root widget. `main.dart` should only ever call `runApp(const SwiftgomaApp())`
/// — any app-level wiring (theme, routing, global providers) lives here.
class SwiftgomaApp extends StatelessWidget {
  const SwiftgomaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Swiftgoma',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: AppRoutes.home,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
