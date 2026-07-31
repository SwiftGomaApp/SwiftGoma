import 'package:flutter/material.dart';

/// Central place for the app's visual theme.
///
/// Feature code should never build its own [ThemeData] — pull colors,
/// text styles, etc. from `Theme.of(context)` and extend this file when
/// the design system grows.
class AppTheme {
  AppTheme._();

  static ThemeData get light {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      useMaterial3: true,
    );
  }
}
