import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/model/app_button_style.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.style = AppButtonStyle.filled,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonStyle style;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(12.r);
    final bool disabled = onPressed == null;

    final button = Opacity(
      opacity: disabled ? 0.5 : 1,
      child: Material(
        color: style.backgroundColor,
        borderRadius: radius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Container(
            height: 48.h,
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: radius,
              border: style.borderColor == null
                  ? null
                  : Border.all(color: style.borderColor!, width: 1.5.r),
            ),
            child: Text(
              label,
              style:
                  AppTypography.actionM.copyWith(color: style.foregroundColor),
            ),
          ),
        ),
      ),
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }
}