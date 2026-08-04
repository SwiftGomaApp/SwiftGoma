import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _recentSearches = ['Shoes', 'Jacket', 'Pants'];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit(String query) {
    final String trimmed = query.trim();
    if (trimmed.isEmpty) return;
    setState(() {
      _recentSearches.remove(trimmed);
      _recentSearches.insert(0, trimmed);
    });
    context.pushReplacement(AppRoutes.searchResults, extra: trimmed);
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
                autofocus: true,
                textInputAction: TextInputAction.search,
                onSubmitted: _submit,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.neutralDark1,
                ),
                cursorColor: AppColors.highlight1,
                decoration: InputDecoration(
                  hintText: 'Search',
                  hintStyle: AppTypography.bodyM.copyWith(
                    color: AppColors.neutralDark5,
                  ),
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
            SizedBox(height: 24.h),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Text(
                'RECENT SEARCHES',
                style: AppTypography.captionM.copyWith(
                  color: AppColors.neutralDark5,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            SizedBox(height: 8.h),
            Expanded(
              child: ListView.builder(
                itemCount: _recentSearches.length,
                itemBuilder: (context, index) {
                  final String term = _recentSearches[index];
                  return InkWell(
                    onTap: () => _submit(term),
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 24.w,
                        vertical: 14.h,
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              term,
                              style: AppTypography.bodyM.copyWith(
                                color: AppColors.neutralDark1,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(
                              () => _recentSearches.removeAt(index),
                            ),
                            child: Icon(
                              Icons.cancel,
                              size: 18.w,
                              color: AppColors.neutralLight1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
