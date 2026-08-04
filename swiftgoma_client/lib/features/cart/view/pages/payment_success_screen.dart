import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/model/app_button_style.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';

class PaymentSuccessScreen extends StatefulWidget {
  const PaymentSuccessScreen({super.key});

  @override
  State<PaymentSuccessScreen> createState() => _PaymentSuccessScreenState();
}

class _PaymentSuccessScreenState extends State<PaymentSuccessScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<CartCubit>().clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
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
                        Icons.check_circle,
                        size: 72.w,
                        color: AppColors.highlight1,
                      ),
                    ),
                    SizedBox(height: 32.h),
                    Text(
                      'Congratulations!',
                      style: AppTypography.h1.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                    SizedBox(height: 12.h),
                    Text(
                      'You successfully made a payment,\nenjoy our service!',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.neutralDark5,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
              child: Row(
                children: [
                  Expanded(
                    child: AppButton(
                      label: 'See Order',
                      style: AppButtonStyle.outline,
                      onPressed: () => context.go(AppRoutes.orders),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: AppButton(
                      label: 'Track Order',
                      onPressed: () =>
                          context.pushReplacement(AppRoutes.deliveryMap),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
