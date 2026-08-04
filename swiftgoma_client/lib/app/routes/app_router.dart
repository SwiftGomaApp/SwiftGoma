import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/features/home/view/pages/home.dart';
import 'package:swiftgoma_client/features/splash/view/pages/onboarding_screen.dart';
import 'package:swiftgoma_client/features/splash/view/pages/splash_screen.dart';

class AppRouter {
  AppRouter._();

  static final GlobalKey<NavigatorState> rootNavigatorKey =
      GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (context, state) => const Home(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('No route defined for ${state.uri.path}')),
    ),
  );
}