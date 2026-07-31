import 'package:flutter/material.dart';
import 'package:swiftgoma_client/core/theme/app_theme.dart';
import 'routes/app_router.dart';
import 'routes/app_routes.dart';


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
