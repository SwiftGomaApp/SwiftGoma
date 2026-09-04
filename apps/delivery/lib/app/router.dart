import 'package:delivery/features/auth/views/login_screen.dart';
import 'package:delivery/features/auth/views/signup_screen.dart';
import 'package:delivery/features/home/home_screen.dart';
import 'package:delivery/features/auth/views/forgot_password_screen.dart';
import 'package:delivery/features/legal/privacy_policy_screen.dart';
import 'package:delivery/features/legal/terms_screen.dart';
import 'package:delivery/features/onboarding/onboarding_screen.dart';
import 'package:delivery/features/splash/splash_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(path: '/otp', builder: (context, state) => state.extra as Widget),
      GoRoute(path: '/terms', builder: (context, state) => const TermsScreen()),
      GoRoute(
        path: '/privacy',
        builder: (context, state) => const PrivacyPolicyScreen(),
      ),
    ],
  );
}
