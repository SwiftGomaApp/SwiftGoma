import 'package:flutter/material.dart';

import '../../features/home/view/pages/home_page.dart';
import 'app_routes.dart';

/// Maps [AppRoutes] names to the `view` of each feature.
///
/// Only the `app/` layer is allowed to import a feature's `view/pages`
/// directly — features should never import each other's pages/viewmodels.
class AppRouter {
  AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.home:
        return MaterialPageRoute(builder: (_) => const HomePage());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }
}
