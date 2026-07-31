import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';

enum ToastVariant { informative, success, warning, error }

extension ToastVariantStyle on ToastVariant {
  Color get accentColor {
    switch (this) {
      case ToastVariant.informative:
        return AppColors.highlight1;
      case ToastVariant.success:
        return AppColors.success2;
      case ToastVariant.warning:
        return AppColors.warning1;
      case ToastVariant.error:
        return AppColors.error2;
    }
  }

  Color get backgroundColor {
    switch (this) {
      case ToastVariant.informative:
        return AppColors.highlight5;
      case ToastVariant.success:
        return AppColors.success3;
      case ToastVariant.warning:
        return AppColors.warning3;
      case ToastVariant.error:
        return AppColors.error3;
    }
  }

  FaIconData get icon {
    switch (this) {
      case ToastVariant.informative:
        return FontAwesomeIcons.info;
      case ToastVariant.success:
        return FontAwesomeIcons.check;
      case ToastVariant.warning:
        return FontAwesomeIcons.exclamation;
      case ToastVariant.error:
        return FontAwesomeIcons.exclamation;
    }
  }
}
