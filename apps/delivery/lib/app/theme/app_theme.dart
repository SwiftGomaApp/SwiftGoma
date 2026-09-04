import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const _lightPrimary = Color(0xFFFF4F00);
  static const _lightOnPrimary = Color(0xFFFFF7ED);
  static const _lightSecondary = Color(0xFFF4F4F5);
  static const _lightOnSecondary = Color(0xFF18181B);
  static const _lightBackground = Color(0xFFFFFFFF);
  static const _lightOnBackground = Color(0xFF0C0A09);
  static const _lightSurface = Color(0xFFFFFFFF);
  static const _lightOnSurface = Color(0xFF0C0A09);
  static const _lightMuted = Color(0xFFF3F1F1);
  static const _lightBorder = Color(0xFFE8E4E3);
  static const _lightError = Color(0xFFE7000B);
  static const _lightOnError = Color(0xFFF8F9FE);

  static const _darkPrimary = Color(0xFFFF4F00);
  static const _darkOnPrimary = Color(0xFFFFF7ED);
  static const _darkSecondary = Color(0xFF27272A);
  static const _darkOnSecondary = Color(0xFFFAFAFA);
  static const _darkBackground = Color(0xFF0C0A09);
  static const _darkOnBackground = Color(0xFFFBFAF9);
  static const _darkSurface = Color(0xFF1D1816);
  static const _darkOnSurface = Color(0xFFFBFAF9);
  static const _darkBorder = Color(0x1AFFFFFF);
  static const _darkError = Color(0xFFE7000B);
  static const _darkOnError = Color(0xFFF8F9FE);

  static ThemeData get light {
    final colorScheme = ColorScheme.light(
      primary: _lightPrimary,
      onPrimary: _lightOnPrimary,
      secondary: _lightSecondary,
      onSecondary: _lightOnSecondary,
      surface: _lightSurface,
      onSurface: _lightOnSurface,
      error: _lightError,
      onError: _lightOnError,
      outline: _lightBorder,
      surfaceContainerHighest: _lightMuted,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _lightBackground,
      textTheme: GoogleFonts.geistTextTheme().apply(
        bodyColor: _lightOnBackground,
        displayColor: _lightOnBackground,
      ),
    );
  }

  static ThemeData get dark {
    final colorScheme = ColorScheme.dark(
      primary: _darkPrimary,
      onPrimary: _darkOnPrimary,
      secondary: _darkSecondary,
      onSecondary: _darkOnSecondary,
      surface: _darkSurface,
      onSurface: _darkOnSurface,
      error: _darkError,
      onError: _darkOnError,
      outline: _darkBorder,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _darkBackground,
      textTheme: GoogleFonts.geistTextTheme(
        ThemeData.dark().textTheme,
      ).apply(bodyColor: _darkOnBackground, displayColor: _darkOnBackground),
    );
  }
}
