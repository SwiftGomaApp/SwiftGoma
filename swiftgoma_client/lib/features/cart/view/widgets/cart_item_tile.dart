import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';
import 'package:swiftgoma_client/features/cart/model/cart_item.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/qty_button.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';

class CartItemTile extends StatelessWidget {
  const CartItemTile({super.key, required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final CartCubit cubit = context.read<CartCubit>();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        SizedBox(
          width: 90.w,
          height: 100.w,
          child: ImagePlaceholder(borderRadius: BorderRadius.circular(16.r)),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.product.name,
                style: AppTypography.h4.copyWith(
                  color: AppColors.neutralDark1,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                '${item.color} / ${item.size}',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.neutralDark5,
                ),
              ),
              SizedBox(height: 12.h),
              Row(
                children: [
                  QtyButton(
                    icon: Icons.remove,
                    onTap: () => cubit.decrement(item),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14.w),
                    child: Text(
                      '${item.quantity}',
                      style: AppTypography.bodyL.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                  ),
                  QtyButton(
                    icon: Icons.add,
                    onTap: () => cubit.increment(item),
                  ),
                ],
              ),
            ],
          ),
        ),
        Text(
          '\$ ${item.total.toStringAsFixed(2)}',
          style: AppTypography.h4.copyWith(color: AppColors.neutralDark1),
        ),
      ],
    );
  }
}
