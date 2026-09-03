import 'package:delivery/core/services/onboarding_prefs.dart';
import 'package:delivery/features/onboarding/model/onboarding_page_data.dart';
import 'package:delivery/features/onboarding/widgets/onboarding_page_indicator.dart';
import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_logo.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  List<OnboardingPageData> get _pages => OnboardingPageData.pages;

  bool get _isLastPage => _currentIndex == _pages.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNextPressed() async {
    if (_isLastPage) {
      await OnboardingPrefs.markOnboardingSeen();
      if (!mounted) return;
      context.go('/login');
      return;
    }
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: AppLogo(size: 20),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 420,
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() => _currentIndex = index),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 48),
                        child: SizedBox(
                          height: 200,
                          child: SvgPicture.asset(
                            page.image,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.geist(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          page.description,
                          textAlign: TextAlign.center,
                          style: textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurface.withValues(alpha: 0.6),
                            height: 1.45,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            OnboardingPageIndicator(
              count: _pages.length,
              activeIndex: _currentIndex,
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.fromLTRB(48, 0, 48, 16),
              child: AppButton(
                label: _isLastPage ? 'Get Started' : 'Next',
                expand: true,
                height: 42,
                onPressed: _onNextPressed,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
