import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/radio_dot.dart';

class MethodCard extends StatelessWidget {
  const MethodCard({super.key, 
    required this.title,
    required this.selected,
    required this.onTap,
    this.child,
  });

  final String title;
  final bool selected;
  final VoidCallback onTap;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.neutralLight3),
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                RadioDot(selected: selected),
                SizedBox(width: 12.w),
                Text(
                  title,
                  style: AppTypography.h4.copyWith(
                    color: AppColors.neutralDark2,
                  ),
                ),
              ],
            ),
            ?child,
          ],
        ),
      ),
    );
  }
}
