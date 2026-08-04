import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';

class DeliveryQrScreen extends StatelessWidget {
  const DeliveryQrScreen({super.key, this.orderId = 'SWIFTGOMA-ORDER-0001'});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Container(
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: AppColors.highlight1,
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        margin: EdgeInsets.all(6.w),
                        padding: EdgeInsets.all(12.w),
                        decoration: BoxDecoration(
                          color: AppColors.neutralLight5,
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        child: QrImageView(
                          data: orderId,
                          size: 200.w,
                          backgroundColor: AppColors.neutralLight5,
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.fromLTRB(12.w, 4.h, 12.w, 12.h),
                        child: Text(
                          'Scan to Confirm Delivery',
                          style: AppTypography.h4.copyWith(
                            color: AppColors.neutralLight5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
              child: AppButton(
                label: 'Done!',
                onPressed: () => context.go(AppRoutes.explore),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
