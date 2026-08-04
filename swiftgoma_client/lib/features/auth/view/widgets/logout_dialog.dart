import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/model/app_button_style.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';

Future<bool> showLogoutDialog(BuildContext context) async {
  final bool? result = await showDialog<bool>(
    context: context,
    barrierColor: Colors.black54,
    builder: (context) => const _LogoutDialog(),
  );
  return result ?? false;
}

class _LogoutDialog extends StatelessWidget {
  const _LogoutDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.neutralLight5,
      insetPadding: EdgeInsets.symmetric(horizontal: 20.w),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 16.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Log out',
              style: AppTypography.h2.copyWith(color: AppColors.neutralDark1),
            ),
            SizedBox(height: 12.h),
            Text(
              "Are you sure you want to log out? You'll need to login again to use the app.",
              textAlign: TextAlign.center,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.neutralDark4,
                height: 1.45,
              ),
            ),
            SizedBox(height: 24.h),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Cancel',
                    style: AppButtonStyle.outline,
                    onPressed: () => Navigator.of(context).pop(false),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: AppButton(
                    label: 'Log out',
                    onPressed: () => Navigator.of(context).pop(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}