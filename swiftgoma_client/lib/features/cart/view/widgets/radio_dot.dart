import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';

class RadioDot extends StatelessWidget {
  const RadioDot({super.key, required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20.w,
      height: 20.w,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? AppColors.highlight1 : AppColors.neutralLight5,
        border: Border.all(
          color: selected ? AppColors.highlight1 : AppColors.neutralLight1,
          width: 1.5,
        ),
      ),
      child: selected
          ? Center(
              child: Container(
                width: 7.w,
                height: 7.w,
                decoration: const BoxDecoration(
                  color: AppColors.neutralLight5,
                  shape: BoxShape.circle,
                ),
              ),
            )
          : null,
    );
  }
}
