import 'package:flutter/material.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.neutralLight5,
      colorScheme: ColorScheme.light(
        primary: AppColors.highlight1,
        onPrimary: AppColors.neutralLight5,
        primaryContainer: AppColors.highlight5,
        onPrimaryContainer: AppColors.highlight1,
        secondary: AppColors.neutralDark1,
        onSecondary: AppColors.neutralLight5,
        surface: AppColors.neutralLight5,
        onSurface: AppColors.neutralDark1,
        surfaceContainerHighest: AppColors.neutralLight3,
        outline: AppColors.neutralLight1,
        error: AppColors.error1,
        onError: AppColors.neutralLight5,
        errorContainer: AppColors.error3,
        onErrorContainer: AppColors.error1,
      ),
      textTheme: TextTheme(
        headlineLarge: AppTypography.h1,
        headlineMedium: AppTypography.h2,
        headlineSmall: AppTypography.h3,
        titleLarge: AppTypography.h4,
        titleMedium: AppTypography.h5,
        bodyLarge: AppTypography.bodyL,
        bodyMedium: AppTypography.bodyM,
        bodySmall: AppTypography.bodyS,
        labelLarge: AppTypography.actionL,
        labelMedium: AppTypography.actionM,
        labelSmall: AppTypography.captionM,
      ),
    );
  }
}
