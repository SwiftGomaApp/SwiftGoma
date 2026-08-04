import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  static const List<String> _categories = [
    'All Categories',
    'Food',
    'Technology',
    'Sports',
    'Fashion',
  ];

  int _selectedCategory = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 16.h),
                child: GestureDetector(
                  onTap: () => context.push(AppRoutes.search),
                  child: Icon(
                    Icons.search,
                    size: 26.w,
                    color: AppColors.neutralDark1,
                  ),
                ),
              ),
              SizedBox(
                height: 36.h,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 24.w),
                  itemCount: _categories.length,
                  separatorBuilder: (_, _) => SizedBox(width: 8.w),
                  itemBuilder: (context, index) {
                    final bool isSelected = index == _selectedCategory;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedCategory = index),
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 14.w),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.highlight1
                              : AppColors.highlight5,
                          borderRadius: BorderRadius.circular(18.r),
                        ),
                        child: Text(
                          _categories[index].toUpperCase(),
                          style: AppTypography.actionM.copyWith(
                            color: isSelected
                                ? AppColors.neutralLight5
                                : AppColors.neutralDark1,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              SizedBox(height: 24.h),
              _buildProductSection(context, 'New Products'),
              SizedBox(height: 24.h),
              _buildListSection(context, 'Your picks'),
              SizedBox(height: 24.h),
              _buildProductSection(context, 'Selling out'),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProductSection(BuildContext context, String title) {
    final List<Product> products = Product.samples;
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
          height: 250.h,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            itemCount: products.length,
            separatorBuilder: (_, _) => SizedBox(width: 16.w),
            itemBuilder: (context, index) => _EventCard(
              product: products[index],
              onTap: () =>
                  context.push(AppRoutes.product, extra: products[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildListSection(BuildContext context, String title) {
    final List<Product> products = Product.samples.take(2).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Text(
            title,
            style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
          ),
        ),
        SizedBox(height: 14.h),
        for (final product in products)
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 12.h),
            child: GestureDetector(
              onTap: () => context.push(AppRoutes.product, extra: product),
              child: Container(
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: AppColors.neutralLight4,
                  borderRadius: BorderRadius.circular(16.r),
                ),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 74,
                      height: 74,
                      child: ImagePlaceholder(),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product.name,
                            style: AppTypography.h4.copyWith(
                              color: AppColors.neutralDark1,
                            ),
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            'Goma, Nord-Kivu',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.neutralDark5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(right: 16.w),
                      child: Icon(
                        Icons.chevron_right,
                        size: 22.w,
                        color: AppColors.neutralDark5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.product, required this.onTap});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 250.w,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: AppColors.neutralLight4,
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  const Positioned.fill(child: ImagePlaceholder()),
                  Positioned(
                    top: 12.h,
                    right: 12.w,
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 10.w,
                        vertical: 5.h,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.highlight1,
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Text(
                        'NEW',
                        style: AppTypography.captionM.copyWith(
                          color: AppColors.neutralLight5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.all(12.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.h4.copyWith(
                      color: AppColors.neutralDark1,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    'Goma, Nord-Kivu',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.neutralDark5,
                    ),
                  ),
                  SizedBox(height: 10.h),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(vertical: 9.h),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppColors.highlight1,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Text(
                      'Add to Cart',
                      style: AppTypography.actionL.copyWith(
                        color: AppColors.highlight1,
                      ),
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
