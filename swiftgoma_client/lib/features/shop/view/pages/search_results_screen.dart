import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';
import 'package:swiftgoma_client/features/shop/view/widgets/product_card.dart';

enum _SortOption { relevance, priceLowHigh, priceHighLow, nameAz }

class SearchResultsScreen extends StatefulWidget {
  const SearchResultsScreen({super.key, required this.query});

  final String query;

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.query);
  _SortOption _sort = _SortOption.relevance;
  int _filterCount = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<Product> get _results {
    final List<Product> products = [...Product.samples];
    switch (_sort) {
      case _SortOption.priceLowHigh:
        products.sort((a, b) => a.price.compareTo(b.price));
      case _SortOption.priceHighLow:
        products.sort((a, b) => b.price.compareTo(a.price));
      case _SortOption.nameAz:
        products.sort((a, b) => a.name.compareTo(b.name));
      case _SortOption.relevance:
        break;
    }
    return products;
  }

  Future<void> _openFilters() async {
    final int? count = await context.push<int>(AppRoutes.filters);
    if (count != null) setState(() => _filterCount = count);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 0),
              child: TextField(
                controller: _controller,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => setState(() {}),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.neutralDark1,
                ),
                cursorColor: AppColors.highlight1,
                decoration: InputDecoration(
                  prefixIcon: Icon(
                    Icons.search,
                    size: 20.w,
                    color: AppColors.neutralDark1,
                  ),
                  filled: true,
                  fillColor: AppColors.neutralLight4,
                  contentPadding: EdgeInsets.symmetric(vertical: 12.h),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24.r),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            SizedBox(height: 12.h),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Row(
                children: [
                  _SortButton(
                    current: _sort,
                    onSelected: (option) => setState(() => _sort = option),
                  ),
                  const Spacer(),
                  _FilterButton(count: _filterCount, onTap: _openFilters),
                ],
              ),
            ),
            SizedBox(height: 16.h),
            Expanded(
              child: GridView.builder(
                padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 24.h),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16.h,
                  crossAxisSpacing: 16.w,
                  childAspectRatio: 0.82,
                ),
                itemCount: _results.length,
                itemBuilder: (context, index) => ProductCard(
                  product: _results[index],
                  onTap: () => context.push(
                    AppRoutes.product,
                    extra: _results[index],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SortButton extends StatelessWidget {
  const _SortButton({required this.current, required this.onSelected});

  final _SortOption current;
  final ValueChanged<_SortOption> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<_SortOption>(
      onSelected: onSelected,
      color: AppColors.neutralLight5,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
      itemBuilder: (context) => const [
        PopupMenuItem(value: _SortOption.relevance, child: Text('Relevance')),
        PopupMenuItem(
          value: _SortOption.priceLowHigh,
          child: Text('Price: low to high'),
        ),
        PopupMenuItem(
          value: _SortOption.priceHighLow,
          child: Text('Price: high to low'),
        ),
        PopupMenuItem(value: _SortOption.nameAz, child: Text('Name: A-Z')),
      ],
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.neutralLight3),
          borderRadius: BorderRadius.circular(10.r),
        ),
        child: Row(
          children: [
            Icon(Icons.swap_vert, size: 16.w, color: AppColors.neutralDark1),
            SizedBox(width: 6.w),
            Text(
              'Sort',
              style: AppTypography.actionL.copyWith(
                color: AppColors.neutralDark1,
              ),
            ),
            SizedBox(width: 4.w),
            Icon(
              Icons.keyboard_arrow_down,
              size: 16.w,
              color: AppColors.neutralDark5,
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  const _FilterButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.neutralLight3),
          borderRadius: BorderRadius.circular(10.r),
        ),
        child: Row(
          children: [
            Icon(Icons.tune, size: 16.w, color: AppColors.neutralDark1),
            SizedBox(width: 6.w),
            Text(
              'Filter',
              style: AppTypography.actionL.copyWith(
                color: AppColors.neutralDark1,
              ),
            ),
            if (count > 0) ...[
              SizedBox(width: 8.w),
              Container(
                padding: EdgeInsets.all(5.w),
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
            ],
          ],
        ),
      ),
    );
  }
}
