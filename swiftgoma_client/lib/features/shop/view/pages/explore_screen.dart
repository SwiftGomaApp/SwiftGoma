import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';
import 'package:swiftgoma_client/features/cart/model/cart_item.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';
import 'package:swiftgoma_client/features/shop/view/widgets/product_card.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final PageController _bannerController = PageController();
  int _bannerIndex = 0;

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              _buildBanner(),
              SizedBox(height: 24.h),
              _buildSection(context, 'Perfect for you', Product.samples),
              SizedBox(height: 24.h),
              _buildSection(
                context,
                'For this summer',
                Product.samples.reversed.toList(),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 12.h),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.push(AppRoutes.search),
            child: Icon(Icons.search, size: 26.w, color: AppColors.neutralDark1),
          ),
          const Spacer(),
          Icon(Icons.favorite_border, size: 24.w, color: AppColors.neutralDark1),
          SizedBox(width: 20.w),
          GestureDetector(
            onTap: () => context.push(AppRoutes.cart),
            child: BlocBuilder<CartCubit, List<CartItem>>(
              builder: (context, state) {
                final int count = context.read<CartCubit>().itemCount;
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      size: 24.w,
                      color: AppColors.neutralDark1,
                    ),
                    if (count > 0)
                      Positioned(
                        right: -4.w,
                        bottom: -2.h,
                        child: Container(
                          padding: EdgeInsets.all(4.w),
                          decoration: const BoxDecoration(
                            color: AppColors.highlight1,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$count',
                            style: AppTypography.captionM.copyWith(
                              color: AppColors.neutralLight5,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner() {
    return Column(
      children: [
        SizedBox(
          height: 200.h,
          child: PageView.builder(
            controller: _bannerController,
            itemCount: 5,
            onPageChanged: (index) => setState(() => _bannerIndex = index),
            itemBuilder: (context, index) => const ImagePlaceholder(),
          ),
        ),
        SizedBox(height: 12.h),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            final bool isActive = index == _bannerIndex;
            return Container(
              margin: EdgeInsets.symmetric(horizontal: 4.w),
              width: 8.w,
              height: 8.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isActive
                    ? AppColors.highlight1
                    : AppColors.neutralLight2,
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<Product> products,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.h3.copyWith(
                    color: AppColors.neutralDark1,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => context.push(AppRoutes.searchResults, extra: ''),
                child: Text(
                  'See more',
                  style: AppTypography.actionL.copyWith(
                    color: AppColors.highlight1,
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 14.h),
        SizedBox(
          height: 200.h,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            itemCount: products.length,
            separatorBuilder: (_, _) => SizedBox(width: 16.w),
            itemBuilder: (context, index) => ProductCard(
              product: products[index],
              width: 160.w,
              onTap: () =>
                  context.push(AppRoutes.product, extra: products[index]),
            ),
          ),
        ),
      ],
    );
  }
}
