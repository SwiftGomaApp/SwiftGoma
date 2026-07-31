import 'package:flutter/material.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';

enum AppButtonStyle { filled, outline }

extension AppButtonStyleColors on AppButtonStyle {
  Color get backgroundColor {
    switch (this) {
      case AppButtonStyle.filled:
        return AppColors.highlight1;
      case AppButtonStyle.outline:
        return Colors.transparent;
    }
  }

  Color get foregroundColor {
    switch (this) {
      case AppButtonStyle.filled:
        return AppColors.neutralLight5;
      case AppButtonStyle.outline:
        return AppColors.highlight1;
    }
  }

  Color? get borderColor {
    switch (this) {
      case AppButtonStyle.filled:
        return null;
      case AppButtonStyle.outline:
        return AppColors.highlight1;
    }
  }
}