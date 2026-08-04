import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class SettingsTile extends StatelessWidget {
  const SettingsTile({
    super.key,
    required this.title,
    this.onTap,
    this.titleColor,
    this.showChevron = true,
  });

  final String title;
  final VoidCallback? onTap;
  final Color? titleColor;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 18.h),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: AppTypography.bodyL.copyWith(
                  color: titleColor ?? AppColors.neutralDark1,
                ),
              ),
            ),
            if (showChevron)
              Icon(
                Icons.chevron_right,
                size: 22.w,
                color: AppColors.neutralDark5,
              ),
          ],
        ),
      ),
    );
  }
}
