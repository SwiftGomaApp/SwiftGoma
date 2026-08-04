import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const Duration _animationDuration = Duration(milliseconds: 2200);
  static const Duration _holdAfterAnimation = Duration(milliseconds: 700);

  late final AnimationController _controller;

  // Phase 1: icon appears in the center.
  late final Animation<double> _iconOpacity;
  late final Animation<double> _iconPopScale;

  // Phase 2: icon shrinks + slides left while the text reveals.
  late final Animation<double> _iconSize;
  late final Animation<double> _textReveal;

  // Phase 3: the orange dot pops in.
  late final Animation<double> _dotScale;

  // Bottom version label.
  late final Animation<double> _versionOpacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _animationDuration)
      ..addStatusListener(_onAnimationStatus);

    _iconOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.18, curve: Curves.easeOut),
    );

    _iconPopScale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.28, curve: Curves.easeOutBack),
      ),
    );

    _iconSize = Tween<double>(begin: 100, end: 36).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.38, 0.72, curve: Curves.easeInOutCubic),
      ),
    );

    _textReveal = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.42, 0.78, curve: Curves.easeOutCubic),
    );

    _dotScale = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.80, 0.95, curve: Curves.easeOutBack),
    );

    _versionOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.55, 0.85, curve: Curves.easeOut),
    );

    _controller.forward();
  }

  void _onAnimationStatus(AnimationStatus status) {
    if (status != AnimationStatus.completed) return;
    Future.delayed(_holdAfterAnimation, () {
      if (mounted) context.go(AppRoutes.home);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Stack(
              children: [
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      _buildIcon(),
                      _buildWordmark(),
                    ],
                  ),
                ),
                _buildVersionLabel(),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildIcon() {
    return Opacity(
      opacity: _iconOpacity.value,
      child: Transform.scale(
        scale: _iconPopScale.value,
        child: Image.asset(
          'assets/images/logo.png',
          width: _iconSize.value.w,
          height: _iconSize.value.w,
        ),
      ),
    );
  }

  Widget _buildWordmark() {
    final TextStyle style = GoogleFonts.getFont(
      AppTypography.fontFamily,
      fontSize: 34.sp,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.2,
      color: AppColors.neutralDark1,
    );

    // ClipRect + widthFactor reveals the text from left to right. As the
    // centered row widens, the icon is pushed to the left.
    return ClipRect(
      child: Align(
        alignment: Alignment.centerLeft,
        widthFactor: _textReveal.value,
        child: Opacity(
          opacity: _textReveal.value,
          child: Padding(
            padding: EdgeInsets.only(left: 8.w),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('SwiftGoma', style: style),
                SizedBox(width: 3.w),
                Padding(
                  padding: EdgeInsets.only(bottom: 7.h),
                  child: Transform.scale(
                    scale: _dotScale.value.clamp(0.0, 1.2),
                    child: Container(
                      width: 9.w,
                      height: 9.w,
                      decoration: BoxDecoration(
                        color: AppColors.highlight1,
                        borderRadius: BorderRadius.circular(2.5.r),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVersionLabel() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 16.h,
      child: Opacity(
        opacity: _versionOpacity.value,
        child: Center(
          child: Text(
            'Version 1',
            style: AppTypography.bodyXs.copyWith(
              color: AppColors.neutralDark4,
            ),
          ),
        ),
      ),
    );
  }
}