/// Named route constants.
///
/// Keep this the single source of truth for route names so features never
/// hardcode path strings. Swap the body of [AppRouter.onGenerateRoute] for
/// go_router/auto_route later without touching feature code.
class AppRoutes {
  AppRoutes._();

  static const String home = '/';
}
