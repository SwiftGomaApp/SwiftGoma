import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/radio_dot.dart';

class CurrencyCard extends StatelessWidget {
  const CurrencyCard({super.key, 
    required this.amount,
    required this.code,
    required this.selected,
    required this.onTap,
  });

  final String amount;
  final String code;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
          decoration: BoxDecoration(
            color: AppColors.highlight5,
            borderRadius: BorderRadius.circular(14.r),
          ),
          child: Row(
            children: [
              RadioDot(selected: selected),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      amount,
                      style: AppTypography.h3.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                    Text(
                      code,
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.neutralDark4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}