import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_data.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';

class ToastCard extends StatelessWidget {
  const ToastCard({super.key, required this.data, required this.onClose});

  final ToastData data;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final variant = data.variant;

    return Material(
      color: Colors.transparent,
      elevation: 6,
      borderRadius: BorderRadius.circular(16.r),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Container(
                color: variant.backgroundColor,
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 24.r,
                      height: 24.r,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: variant.accentColor,
                      ),
                      child: FaIcon(
                        variant.icon,
                        size: 12.sp,
                        color: AppColors.neutralLight5,
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (data.showTitle)
                            Text(
                              data.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.h5.copyWith(
                                color: AppColors.neutralDark1,
                                height: 1.0,
                                letterSpacing: 0,
                              ),
                            ),
                          if (data.showTitle && data.showDescription)
                            SizedBox(height: 4.h),
                          if (data.showDescription)
                            Text(
                              data.description,
                              style: AppTypography.bodyS.copyWith(
                                color: AppColors.neutralDark3,
                                height: 16 / 12,
                                letterSpacing: 0.12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    SizedBox(width: 16.w),
                    InkResponse(
                      onTap: onClose,
                      radius: 16.r,
                      child: Icon(
                        Icons.close_rounded,
                        size: 18.sp,
                        color: AppColors.neutralDark4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
