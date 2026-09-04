import 'package:delivery/app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import '../core/config/env.dart';
import 'router.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: Env.appName,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      routerConfig: AppRouter.router,
    );
  }
}
