import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class ProviderCard extends StatelessWidget {
  const ProviderCard({super.key, 
    required this.label,
    required this.assetPath,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String assetPath;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 76.h,
          padding: EdgeInsets.all(12.w),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppColors.highlight3 : AppColors.highlight5,
            borderRadius: BorderRadius.circular(14.r),
          ),
          child: Image.asset(
            assetPath,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => Text(
              label,
              textAlign: TextAlign.center,
              style: AppTypography.h5.copyWith(color: AppColors.neutralDark1),
            ),
          ),
        ),
      ),
    );
  }
}
