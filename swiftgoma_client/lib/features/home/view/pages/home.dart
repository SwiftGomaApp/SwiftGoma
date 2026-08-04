import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/model/app_button_style.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';
import 'package:swiftgoma_client/core/widgets/toast/toast_extensions.dart';

class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Component Preview')),
      body: ListView(
        padding: EdgeInsets.all(16.r),
        children: [
          Text(
            'Toast',
            style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
          ),
          SizedBox(height: 16.h),
          AppButton(
            label: 'Informative',
            style: AppButtonStyle.outline,
            onPressed: () =>
                context.showToast(variant: ToastVariant.informative),
          ),
          SizedBox(height: 12.h),
          AppButton(
            label: 'Success',
            style: AppButtonStyle.outline,
            onPressed: () => context.showToast(variant: ToastVariant.success),
          ),
          SizedBox(height: 12.h),
          AppButton(
            label: 'Warning',
            style: AppButtonStyle.outline,
            onPressed: () => context.showToast(variant: ToastVariant.warning),
          ),
          SizedBox(height: 12.h),
          AppButton(
            label: 'Error',
            style: AppButtonStyle.outline,
            onPressed: () => context.showToast(variant: ToastVariant.error),
          ),
          SizedBox(height: 32.h),
          Text(
            'Buttons',
            style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
          ),
          SizedBox(height: 16.h),
          AppButton(
            label: 'Full width filled',
            style: AppButtonStyle.filled,
            onPressed: () {},
          ),
          SizedBox(height: 12.h),
          AppButton(
            label: 'Full width outline',
            style: AppButtonStyle.outline,
            onPressed: () {},
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              AppButton(
                label: 'Button 1',
                style: AppButtonStyle.outline,
                fullWidth: false,
                onPressed: () {},
              ),
              SizedBox(width: 12.w),
              AppButton(
                label: 'Button 2',
                style: AppButtonStyle.filled,
                fullWidth: false,
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }
}
