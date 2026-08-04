import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';
import 'package:swiftgoma_client/core/widgets/toast/toast_extensions.dart';
import 'package:swiftgoma_client/features/cart/model/cart_item.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key, required this.product});

  final Product product;

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  static const Map<String, Color> _colorSwatches = {
    'Black': Color(0xFF1F2024),
    'Grey': Color(0xFF71727A),
    'Silver': Color(0xFFC5C6CC),
    'White': Color(0xFFE8E9F1),
  };

  final PageController _imageController = PageController();
  int _imageIndex = 0;
  bool _favorite = false;
  late String _selectedSize = widget.product.sizes[1];
  late String _selectedColor = widget.product.colors.first;

  @override
  void dispose() {
    _imageController.dispose();
    super.dispose();
  }

  void _addToCart() {
    context.read<CartCubit>().add(
          CartItem(
            product: widget.product,
            size: _selectedSize,
            color: _selectedColor,
          ),
        );
    context.showToast(
      variant: ToastVariant.success,
      title: 'Added to cart',
      description: '${widget.product.name} · $_selectedColor / $_selectedSize',
      duration: const Duration(seconds: 2),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildImageCarousel(context),
                  Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                widget.product.name,
                                style: AppTypography.h1.copyWith(
                                  color: AppColors.neutralDark1,
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () =>
                                  setState(() => _favorite = !_favorite),
                              child: Icon(
                                _favorite
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                size: 24.w,
                                color: _favorite
                                    ? AppColors.highlight1
                                    : AppColors.neutralDark1,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8.h),
                        Text(
                          '\$ ${widget.product.price.toStringAsFixed(2)}',
                          style: AppTypography.h2.copyWith(
                            color: AppColors.neutralDark1,
                          ),
                        ),
                        SizedBox(height: 16.h),
                        Text(
                          widget.product.description,
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.neutralDark4,
                            height: 1.5,
                          ),
                        ),
                        SizedBox(height: 24.h),
                        Text(
                          'Size',
                          style: AppTypography.h4.copyWith(
                            color: AppColors.neutralDark1,
                          ),
                        ),
                        SizedBox(height: 10.h),
                        _buildSizeChips(),
                        SizedBox(height: 20.h),
                        Text(
                          'Color',
                          style: AppTypography.h4.copyWith(
                            color: AppColors.neutralDark1,
                          ),
                        ),
                        SizedBox(height: 10.h),
                        _buildColorSwatches(),
                        SizedBox(height: 16.h),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
              child: AppButton(label: '+  Add to Cart', onPressed: _addToCart),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageCarousel(BuildContext context) {
    return Stack(
      children: [
        Column(
          children: [
            SizedBox(
              height: 0.42.sh,
              child: PageView.builder(
                controller: _imageController,
                itemCount: 5,
                onPageChanged: (index) =>
                    setState(() => _imageIndex = index),
                itemBuilder: (context, index) =>
                    const ImagePlaceholder(iconSize: 40),
              ),
            ),
            Container(
              color: AppColors.highlight5,
              width: double.infinity,
              padding: EdgeInsets.only(bottom: 14.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final bool isActive = index == _imageIndex;
                  return Container(
                    margin: EdgeInsets.symmetric(horizontal: 4.w),
                    width: 8.w,
                    height: 8.w,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isActive
                          ? AppColors.highlight1
                          : AppColors.highlight4,
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
        Positioned(
          top: MediaQuery.of(context).padding.top + 12.h,
          left: 24.w,
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Icon(Icons.close, size: 26.w, color: AppColors.neutralDark1),
          ),
        ),
      ],
    );
  }

  Widget _buildSizeChips() {
    return Wrap(
      spacing: 10.w,
      children: widget.product.sizes.map((size) {
        final bool isSelected = size == _selectedSize;
        return GestureDetector(
          onTap: () => setState(() => _selectedSize = size),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
            decoration: BoxDecoration(
              color:
                  isSelected ? AppColors.highlight1 : AppColors.highlight5,
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Text(
              size,
              style: AppTypography.actionM.copyWith(
                color: isSelected
                    ? AppColors.neutralLight5
                    : AppColors.neutralDark1,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildColorSwatches() {
    return Row(
      children: widget.product.colors.map((color) {
        final bool isSelected = color == _selectedColor;
        final Color swatch =
            _colorSwatches[color] ?? AppColors.neutralLight2;
        return GestureDetector(
          onTap: () => setState(() => _selectedColor = color),
          child: Container(
            margin: EdgeInsets.only(right: 14.w),
            width: 36.w,
            height: 36.w,
            decoration: BoxDecoration(color: swatch, shape: BoxShape.circle),
            child: isSelected
                ? Align(
                    alignment: Alignment.topRight,
                    child: Container(
                      width: 16.w,
                      height: 16.w,
                      decoration: BoxDecoration(
                        color: AppColors.highlight1,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.neutralLight5,
                          width: 1.5,
                        ),
                      ),
                      child: Icon(
                        Icons.check,
                        size: 10.w,
                        color: AppColors.neutralLight5,
                      ),
                    ),
                  )
                : null,
          ),
        );
      }).toList(),
    );
  }
}
