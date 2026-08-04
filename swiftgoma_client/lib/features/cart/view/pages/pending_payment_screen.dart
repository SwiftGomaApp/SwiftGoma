import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class PendingPaymentScreen extends StatefulWidget {
  const PendingPaymentScreen({super.key});

  @override
  State<PendingPaymentScreen> createState() => _PendingPaymentScreenState();
}

class _PendingPaymentScreenState extends State<PendingPaymentScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 4), () {
      if (mounted) context.pushReplacement(AppRoutes.paymentSuccess);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 32.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 140.w,
                height: 140.w,
                decoration: const BoxDecoration(
                  color: AppColors.highlight5,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.phonelink_ring,
                  size: 64.w,
                  color: AppColors.highlight1,
                ),
              ),
              SizedBox(height: 32.h),
              Text(
                'Confirm payment\non your phone',
                textAlign: TextAlign.center,
                style: AppTypography.h1.copyWith(
                  color: AppColors.neutralDark1,
                  height: 1.25,
                ),
              ),
              SizedBox(height: 16.h),
              Text(
                'A request has been sent to your phone, please confirm the payment by entering your pin',
                textAlign: TextAlign.center,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.neutralDark5,
                  height: 1.5,
                ),
              ),
              SizedBox(height: 40.h),
              const CircularProgressIndicator(
                color: AppColors.highlight1,
                strokeWidth: 3,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
