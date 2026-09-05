import 'package:delivery/app/locator.dart';
import 'package:delivery/app/theme/app_theme.dart';
import 'package:delivery/features/home/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../core/config/env.dart';
import 'router.dart';

class App extends ConsumerStatefulWidget {
  const App({super.key});

  @override
  ConsumerState<App> createState() => _AppState();
}

class _AppState extends ConsumerState<App> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    OneSignal.Notifications.addClickListener(_onNotificationClicked);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    OneSignal.Notifications.removeClickListener(_onNotificationClicked);
    super.dispose();
  }

  void _onNotificationClicked(OSNotificationClickEvent event) {
    final data = event.notification.additionalData ?? {};
    AppRouter.router.go('/');
    if (data.containsKey('orderId')) {
      ref.read(homeTabIndexProvider.notifier).state = 0; // Livraisons
    } else {
      ref.read(homeTabIndexProvider.notifier).state = 2; // Notifications
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(tokenRefresherProvider).refreshIfExpiringSoon();
    }
  }

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
