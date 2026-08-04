import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';

class FilterScreen extends StatefulWidget {
  const FilterScreen({super.key});

  @override
  State<FilterScreen> createState() => _FilterScreenState();
}

class _FilterScreenState extends State<FilterScreen> {
  static const List<String> _categories = [
    'Food',
    'Technology',
    'Sports',
    'Fashion',
    'Beauty',
  ];
  static const List<String> _colors = [
    'BLACK',
    'WHITE',
    'GREY',
    'YELLOW',
    'BLUE',
    'PURPLE',
    'GREEN',
    'RED',
    'PINK',
    'ORANGE',
    'GOLD',
    'SILVER',
  ];
  static const List<String> _sizes = ['XS', 'S', 'M', 'L', 'XL'];

  final Set<String> _selectedCategories = {};
  final Set<String> _selectedColors = {};
  final Set<String> _selectedSizes = {};
  RangeValues _priceRange = const RangeValues(0, 100);
  int _minReview = 0;

  String? _expandedSection = 'Color';

  int get _totalCount =>
      _selectedCategories.length +
      _selectedColors.length +
      _selectedSizes.length +
      (_priceRange.start > 0 || _priceRange.end < 100 ? 1 : 0) +
      (_minReview > 0 ? 1 : 0);

  void _clearAll() {
    setState(() {
      _selectedCategories.clear();
      _selectedColors.clear();
      _selectedSizes.clear();
      _priceRange = const RangeValues(0, 100);
      _minReview = 0;
    });
  }

  void _toggleSection(String section) {
    setState(
      () => _expandedSection = _expandedSection == section ? null : section,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: true,
        leadingWidth: 90.w,
        leading: Center(
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Text(
              'Cancel',
              style: AppTypography.actionL.copyWith(
                color: AppColors.highlight1,
              ),
            ),
          ),
        ),
        title: Text(
          'Filter',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
        actions: [
          Center(
            child: Padding(
              padding: EdgeInsets.only(right: 24.w),
              child: GestureDetector(
                onTap: _clearAll,
                child: Text(
                  'Clear All',
                  style: AppTypography.actionL.copyWith(
                    color: AppColors.highlight1,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(vertical: 8.h),
              children: [
                _Section(
                  title: 'Category',
                  count: _selectedCategories.length,
                  expanded: _expandedSection == 'Category',
                  onTap: () => _toggleSection('Category'),
                  child: _ChipWrap(
                    options: _categories.map((c) => c.toUpperCase()).toList(),
                    selected: _selectedCategories,
                    onToggle: (value) => setState(() {
                      _selectedCategories.contains(value)
                          ? _selectedCategories.remove(value)
                          : _selectedCategories.add(value);
                    }),
                  ),
                ),
                _Section(
                  title: 'Price Range',
                  count:
                      _priceRange.start > 0 || _priceRange.end < 100 ? 1 : 0,
                  expanded: _expandedSection == 'Price Range',
                  onTap: () => _toggleSection('Price Range'),
                  child: Column(
                    children: [
                      RangeSlider(
                        values: _priceRange,
                        max: 100,
                        divisions: 20,
                        activeColor: AppColors.highlight1,
                        inactiveColor: AppColors.highlight5,
                        labels: RangeLabels(
                          '\$${_priceRange.start.round()}',
                          '\$${_priceRange.end.round()}',
                        ),
                        onChanged: (values) =>
                            setState(() => _priceRange = values),
                      ),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8.w),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '\$ ${_priceRange.start.round()}',
                              style: AppTypography.bodyS.copyWith(
                                color: AppColors.neutralDark4,
                              ),
                            ),
                            Text(
                              '\$ ${_priceRange.end.round()}',
                              style: AppTypography.bodyS.copyWith(
                                color: AppColors.neutralDark4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                _Section(
                  title: 'Color',
                  count: _selectedColors.length,
                  expanded: _expandedSection == 'Color',
                  onTap: () => _toggleSection('Color'),
                  child: _ChipWrap(
                    options: _colors,
                    selected: _selectedColors,
                    onToggle: (value) => setState(() {
                      _selectedColors.contains(value)
                          ? _selectedColors.remove(value)
                          : _selectedColors.add(value);
                    }),
                  ),
                ),
                _Section(
                  title: 'Size',
                  count: _selectedSizes.length,
                  expanded: _expandedSection == 'Size',
                  onTap: () => _toggleSection('Size'),
                  child: _ChipWrap(
                    options: _sizes,
                    selected: _selectedSizes,
                    onToggle: (value) => setState(() {
                      _selectedSizes.contains(value)
                          ? _selectedSizes.remove(value)
                          : _selectedSizes.add(value);
                    }),
                  ),
                ),
                _Section(
                  title: 'Customer Review',
                  count: _minReview > 0 ? 1 : 0,
                  expanded: _expandedSection == 'Customer Review',
                  onTap: () => _toggleSection('Customer Review'),
                  child: Row(
                    children: List.generate(5, (index) {
                      final int stars = index + 1;
                      return GestureDetector(
                        onTap: () => setState(
                          () => _minReview = _minReview == stars ? 0 : stars,
                        ),
                        child: Padding(
                          padding: EdgeInsets.only(right: 8.w),
                          child: Icon(
                            stars <= _minReview
                                ? Icons.star
                                : Icons.star_border,
                            size: 28.w,
                            color: stars <= _minReview
                                ? AppColors.highlight1
                                : AppColors.neutralLight1,
                          ),
                        ),
                      );
                    }),
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
                label: 'Apply Filters',
                onPressed: () => context.pop(_totalCount),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.count,
    required this.expanded,
    required this.onTap,
    required this.child,
  });

  final String title;
  final int count;
  final bool expanded;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onTap,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.neutralDark1,
                    ),
                  ),
                ),
                if (count > 0)
                  Container(
                    padding: EdgeInsets.all(6.w),
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
                  )
                else
                  Icon(
                    expanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    size: 22.w,
                    color: AppColors.neutralDark5,
                  ),
              ],
            ),
          ),
        ),
        if (expanded)
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 16.h),
            child: child,
          ),
        Divider(color: AppColors.neutralLight3, height: 1, indent: 24.w),
      ],
    );
  }
}

class _ChipWrap extends StatelessWidget {
  const _ChipWrap({
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  final List<String> options;
  final Set<String> selected;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8.w,
      runSpacing: 10.h,
      children: options.map((option) {
        final bool isSelected = selected.contains(option);
        return GestureDetector(
          onTap: () => onToggle(option),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
            decoration: BoxDecoration(
              color:
                  isSelected ? AppColors.highlight1 : AppColors.highlight5,
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Text(
              option,
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
}
