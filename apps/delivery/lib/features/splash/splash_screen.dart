import 'package:delivery/core/services/onboarding_prefs.dart';
import 'package:delivery/features/auth/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const Duration _animationDuration = Duration(milliseconds: 2200);
  static const Duration _holdAfterAnimation = Duration(milliseconds: 700);

  late final AnimationController _controller;

  late final Animation<double> _iconOpacity;
  late final Animation<double> _iconPopScale;
  late final Animation<double> _iconSize;
  late final Animation<double> _textReveal;
  late final Animation<double> _dotScale;
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

    _iconSize = Tween<double>(begin: 64, end: 28).animate(
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

  void _onAnimationStatus(AnimationStatus status) async {
    if (status != AnimationStatus.completed) return;
    await Future.delayed(_holdAfterAnimation);
    if (!mounted) return;

    final hasSeenOnboarding = await OnboardingPrefs.hasSeenOnboarding();
    final currentUser = await ref.read(currentUserProvider.future);
    if (!mounted) return;

    if (currentUser != null) {
      context.go('/');
    } else if (hasSeenOnboarding) {
      context.go('/login');
    } else {
      context.go('/onboarding');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Stack(
              children: [
                Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [_buildIcon(), _buildWordmark(colorScheme)],
                    ),
                  ),
                ),
                _buildVersionLabel(colorScheme),
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
          width: _iconSize.value,
          height: _iconSize.value,
        ),
      ),
    );
  }

  Widget _buildWordmark(ColorScheme colorScheme) {
    final style = GoogleFonts.geist(
      fontSize: 34,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.2,
      color: colorScheme.onSurface,
    );

    return ClipRect(
      child: Align(
        alignment: Alignment.centerLeft,
        widthFactor: _textReveal.value,
        child: Opacity(
          opacity: _textReveal.value,
          child: Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Text.rich(
              TextSpan(
                text: 'SwiftGoma',
                style: style,
                children: [
                  const WidgetSpan(child: SizedBox(width: 3)),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: Transform.scale(
                      scale: _dotScale.value.clamp(0.0, 1.2),
                      child: Text(
                        '.',
                        style: style.copyWith(color: colorScheme.primary),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVersionLabel(ColorScheme colorScheme) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 16,
      child: Opacity(
        opacity: _versionOpacity.value,
        child: Center(
          child: Text(
            'Version 1',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ),
      ),
    );
  }
}
