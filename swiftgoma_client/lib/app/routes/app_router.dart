import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/features/auth/view/pages/confirmation_code_screen.dart';
import 'package:swiftgoma_client/features/auth/view/pages/login_screen.dart';
import 'package:swiftgoma_client/features/auth/view/pages/signup_screen.dart';
import 'package:swiftgoma_client/features/cart/view/pages/cart_screen.dart';
import 'package:swiftgoma_client/features/cart/view/pages/checkout_screen.dart';
import 'package:swiftgoma_client/features/cart/view/pages/payment_success_screen.dart';
import 'package:swiftgoma_client/features/cart/view/pages/pending_payment_screen.dart';
import 'package:swiftgoma_client/features/main/view/pages/main_shell.dart';
import 'package:swiftgoma_client/features/orders/view/pages/delivery_map_screen.dart';
import 'package:swiftgoma_client/features/orders/view/pages/delivery_qr_screen.dart';
import 'package:swiftgoma_client/features/orders/view/pages/orders_screen.dart';
import 'package:swiftgoma_client/features/settings/view/pages/settings_screen.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';
import 'package:swiftgoma_client/features/shop/view/pages/categories_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/explore_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/filter_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/product_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/search_results_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/search_screen.dart';
import 'package:swiftgoma_client/features/shop/view/pages/stores_screen.dart';
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
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.signup,
        name: 'signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: AppRoutes.confirmCode,
        name: 'confirmCode',
        builder: (context, state) =>
            ConfirmationCodeScreen(email: state.extra as String? ?? ''),
      ),
      GoRoute(
        path: AppRoutes.search,
        name: 'search',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: AppRoutes.searchResults,
        name: 'searchResults',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) =>
            SearchResultsScreen(query: state.extra as String? ?? ''),
      ),
      GoRoute(
        path: AppRoutes.filters,
        name: 'filters',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const FilterScreen(),
      ),
      GoRoute(
        path: AppRoutes.product,
        name: 'product',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) =>
            ProductScreen(product: state.extra as Product),
      ),
      GoRoute(
        path: AppRoutes.cart,
        name: 'cart',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: AppRoutes.checkout,
        name: 'checkout',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentPending,
        name: 'paymentPending',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const PendingPaymentScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentSuccess,
        name: 'paymentSuccess',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const PaymentSuccessScreen(),
      ),
      GoRoute(
        path: AppRoutes.deliveryMap,
        name: 'deliveryMap',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const DeliveryMapScreen(),
      ),
      GoRoute(
        path: AppRoutes.deliveryConfirm,
        name: 'deliveryConfirm',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const DeliveryQrScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.explore,
                name: 'explore',
                builder: (context, state) => const ExploreScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.categories,
                name: 'categories',
                builder: (context, state) => const CategoriesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.stores,
                name: 'stores',
                builder: (context, state) => const StoresScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                name: 'profile',
                builder: (context, state) => const SettingsScreen(),
                routes: [
                  GoRoute(
                    path: 'orders',
                    name: 'orders',
                    builder: (context, state) => const OrdersScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('No route defined for ${state.uri.path}')),
    ),
  );
}
