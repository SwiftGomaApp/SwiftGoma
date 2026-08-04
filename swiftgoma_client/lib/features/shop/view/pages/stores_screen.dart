import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class StoresScreen extends StatelessWidget {
  const StoresScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Stores',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.storefront_outlined,
              size: 48.w,
              color: AppColors.neutralLight1,
            ),
            SizedBox(height: 12.h),
            Text(
              'Stores coming soon',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.neutralDark4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
