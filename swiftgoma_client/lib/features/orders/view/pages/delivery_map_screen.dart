import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class DeliveryMapScreen extends StatelessWidget {
  const DeliveryMapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: Container(
                    color: AppColors.neutralLight4,
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.map_outlined,
                      size: 64.w,
                      color: AppColors.neutralLight1,
                    ),
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 12.h,
                  left: 24.w,
                  child: _MapButton(
                    icon: Icons.arrow_back_ios_new,
                    onTap: () => context.pop(),
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 12.h,
                  right: 24.w,
                  child: _MapButton(icon: Icons.my_location, onTap: () {}),
                ),
              ],
            ),
          ),
          _BottomPanel(),
        ],
      ),
    );
  }
}

class _MapButton extends StatelessWidget {
  const _MapButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44.w,
        height: 44.w,
        decoration: BoxDecoration(
          color: AppColors.neutralLight3.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(14.r),
        ),
        child: Icon(icon, size: 20.w, color: AppColors.neutralDark1),
      ),
    );
  }
}

class _BottomPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.neutralLight5,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(24.w, 10.h, 24.w, 12.h),
          child: Column(
            children: [
              Container(
                width: 56.w,
                height: 5.h,
                decoration: BoxDecoration(
                  color: AppColors.neutralLight3,
                  borderRadius: BorderRadius.circular(3.r),
                ),
              ),
              SizedBox(height: 18.h),
              Text(
                '10 minutes left',
                style: AppTypography.h1.copyWith(
                  color: AppColors.neutralDark1,
                ),
              ),
              SizedBox(height: 6.h),
              Text.rich(
                TextSpan(
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.neutralDark5,
                  ),
                  children: [
                    const TextSpan(text: 'Delivery to '),
                    TextSpan(
                      text: 'Av. du Lac, Goma',
                      style: AppTypography.h4.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 18.h),
              Row(
                children: List.generate(4, (index) {
                  final bool done = index < 3;
                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index == 3 ? 0 : 8.w),
                      height: 5.h,
                      decoration: BoxDecoration(
                        color: done
                            ? AppColors.success2
                            : AppColors.neutralLight3,
                        borderRadius: BorderRadius.circular(3.r),
                      ),
                    ),
                  );
                }),
              ),
              SizedBox(height: 20.h),
              GestureDetector(
                onTap: () => context.push(AppRoutes.deliveryConfirm),
                child: Container(
                  padding: EdgeInsets.all(14.w),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.neutralLight3),
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 56.w,
                        height: 56.w,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.neutralLight3),
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                        child: Icon(
                          Icons.delivery_dining,
                          size: 30.w,
                          color: AppColors.highlight1,
                        ),
                      ),
                      SizedBox(width: 14.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delivering your order',
                              style: AppTypography.h3.copyWith(
                                color: AppColors.neutralDark1,
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              'We will deliver your goods to you in the shortest possible time.',
                              style: AppTypography.bodyM.copyWith(
                                color: AppColors.neutralDark5,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              Row(
                children: [
                  Container(
                    width: 52.w,
                    height: 52.w,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: AppColors.highlight5,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      'BS',
                      style: AppTypography.h4.copyWith(
                        color: AppColors.highlight1,
                      ),
                    ),
                  ),
                  SizedBox(width: 14.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Brooklyn Simmons',
                          style: AppTypography.h3.copyWith(
                            color: AppColors.neutralDark1,
                          ),
                        ),
                        SizedBox(height: 2.h),
                        Text(
                          'Personal Courier',
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.neutralDark5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      width: 48.w,
                      height: 48.w,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.neutralLight3),
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Icon(
                        Icons.phone_in_talk_outlined,
                        size: 22.w,
                        color: AppColors.highlight1,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
