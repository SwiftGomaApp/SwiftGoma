import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';
import 'package:swiftgoma_client/features/cart/model/cart_item.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/cart_item_tile.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 20.w,
            color: AppColors.highlight1,
          ),
        ),
        title: Text(
          'Cart',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
      ),
      body: BlocBuilder<CartCubit, List<CartItem>>(
        builder: (context, items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 96.w,
                    height: 96.w,
                    child: ImagePlaceholder(
                      borderRadius: BorderRadius.circular(24.r),
                    ),
                  ),
                  SizedBox(height: 20.h),
                  Text(
                    'Your cart is empty',
                    style: AppTypography.h2.copyWith(
                      color: AppColors.neutralDark1,
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    'Items you add will show up here.',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.neutralDark4,
                    ),
                  ),
                ],
              ),
            );
          }
          final CartCubit cubit = context.read<CartCubit>();
          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 8.h),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Divider(
                    color: AppColors.neutralLight3,
                    height: 32.h,
                  ),
                  itemBuilder: (context, index) =>
                      CartItemTile(item: items[index]),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 8.h),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Total',
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.neutralDark4,
                        ),
                      ),
                    ),
                    Text(
                      '\$ ${cubit.total.toStringAsFixed(2)}',
                      style: AppTypography.h3.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
                  child: AppButton(
                    label: 'Checkout',
                    onPressed: () => context.push(AppRoutes.checkout),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
