import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum AppLogoVariant { full, icon }

class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.variant = AppLogoVariant.full,
    this.size = 24,
  });

  final AppLogoVariant variant;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/images/logo.png',
          width: size,
          height: size,
          errorBuilder: (context, error, stackTrace) =>
              SizedBox(width: size, height: size),
        ),
        if (variant == AppLogoVariant.full) ...[
          const SizedBox(width: 4),
          Text.rich(
            TextSpan(
              text: 'SwiftGoma',
              style: GoogleFonts.geist(
                fontSize: size * 1.25,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
                color: colorScheme.onSurface,
              ),
              children: [
                TextSpan(
                  text: '.',
                  style: GoogleFonts.geist(
                    fontSize: size * 1.25,
                    fontWeight: FontWeight.w900,
                    color: colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
