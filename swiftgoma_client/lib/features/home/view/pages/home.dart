import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
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
          _ToastTriggerButton(
            label: 'Informative',
            onPressed: () =>
                context.showToast(variant: ToastVariant.informative),
          ),
          SizedBox(height: 12.h),
          _ToastTriggerButton(
            label: 'Success',
            onPressed: () => context.showToast(variant: ToastVariant.success),
          ),
          SizedBox(height: 12.h),
          _ToastTriggerButton(
            label: 'Warning',
            onPressed: () => context.showToast(variant: ToastVariant.warning),
          ),
          SizedBox(height: 12.h),
          _ToastTriggerButton(
            label: 'Error',
            onPressed: () => context.showToast(variant: ToastVariant.error),
          ),
        ],
      ),
    );
  }
}

class _ToastTriggerButton extends StatelessWidget {
  const _ToastTriggerButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(onPressed: onPressed, child: Text(label)),
    );
  }
}
