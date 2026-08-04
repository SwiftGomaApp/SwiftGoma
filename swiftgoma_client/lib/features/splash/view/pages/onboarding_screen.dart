import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/features/splash/model/onboarding_page_data.dart';
import 'package:swiftgoma_client/features/splash/view/widgets/onboarding_page_indicator.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  static const String _imagePath = 'assets/images/onboarding.png';

  final PageController _pageController = PageController();
  int _currentIndex = 0;

  List<OnboardingPageData> get _pages => OnboardingPageData.pages;

  bool get _isLastPage => _currentIndex == _pages.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNextPressed() {
    if (_isLastPage) {
      context.go(AppRoutes.home);
      return;
    }
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: SizedBox(
              width: double.infinity,
              child: Image.asset(
                _imagePath,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: AppColors.neutralLight3,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.image_not_supported,
                    size: 48.w,
                    color: AppColors.neutralDark5,
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 0),
            child: OnboardingPageIndicator(
              count: _pages.length,
              activeIndex: _currentIndex,
            ),
          ),
          SizedBox(height: 20.h),
          SizedBox(
            height: 150.h,
            child: PageView.builder(
              controller: _pageController,
              itemCount: _pages.length,
              onPageChanged: (index) => setState(() => _currentIndex = index),
              itemBuilder: (context, index) {
                final page = _pages[index];
                return Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        page.title,
                        style: AppTypography.h1.copyWith(
                          color: AppColors.neutralDark1,
                          height: 1.25,
                        ),
                      ),
                      SizedBox(height: 12.h),
                      Text(
                        page.description,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.neutralDark4,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(24.w, 4.h, 24.w, 12.h),
              child: AppButton(
                label: _isLastPage ? 'Get Started' : 'Next',
                onPressed: _onNextPressed,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
