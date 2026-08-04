import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class AuthFooter extends StatelessWidget {
  const AuthFooter({
    super.key,
    required this.onRegisterTap,
    this.onGoogleTap,
    this.onAppleTap,
  });

  final VoidCallback onRegisterTap;
  final VoidCallback? onGoogleTap;
  final VoidCallback? onAppleTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Not a member? ',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.neutralDark4,
              ),
            ),
            GestureDetector(
              onTap: onRegisterTap,
              child: Text(
                'Register now',
                style: AppTypography.actionM.copyWith(
                  color: AppColors.highlight1,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 20.h),
        Divider(color: AppColors.neutralLight3, height: 1),
        SizedBox(height: 20.h),
        Text(
          'Or continue with',
          style: AppTypography.bodyS.copyWith(color: AppColors.neutralDark4),
        ),
        SizedBox(height: 16.h),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _SocialButton(
              background: const Color(0xFFEA4359),
              icon: FontAwesomeIcons.google,
              onTap: onGoogleTap,
            ),
            SizedBox(width: 16.w),
            _SocialButton(
              background: AppColors.neutralDark2,
              icon: FontAwesomeIcons.apple,
              onTap: onAppleTap,
            ),
          ],
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.background,
    required this.icon,
    this.onTap,
  });

  final Color background;
  final FaIconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 40.w,
          height: 40.w,
          child: Center(
            child: FaIcon(icon, size: 18.w, color: AppColors.neutralLight5),
          ),
        ),
      ),
    );
  }
}