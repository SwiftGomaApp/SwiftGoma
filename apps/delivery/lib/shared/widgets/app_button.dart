import 'package:flutter/material.dart';

enum AppButtonVariant { primary, outline, secondary, ghost, destructive, link }

enum AppButtonSize { xs, sm, md, lg }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.height,
    this.leadingIcon,
    this.trailingIcon,
    this.isLoading = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final double? height;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final bool isLoading;
  final bool expand;

  double get _defaultHeight => switch (size) {
    AppButtonSize.xs => 28,
    AppButtonSize.sm => 32,
    AppButtonSize.md => 36,
    AppButtonSize.lg => 40,
  };

  double get _horizontalPadding => switch (size) {
    AppButtonSize.xs => 10,
    AppButtonSize.sm => 12,
    AppButtonSize.md => 16,
    AppButtonSize.lg => 24,
  };

  double get _fontSize => size == AppButtonSize.xs ? 12 : 14;

  double get _radius => size == AppButtonSize.xs ? 6 : 8;

  double get _iconSize => size == AppButtonSize.xs ? 14 : 16;

  bool get _isInteractive => onPressed != null && !isLoading;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final style = _resolveStyle(colorScheme);

    final content = isLoading
        ? SizedBox(
            width: _iconSize,
            height: _iconSize,
            child: CircularProgressIndicator.adaptive(
              strokeWidth: 2,
              // `backgroundColor` is what actually tints the Cupertino
              // spinner on iOS/macOS; `valueColor` only affects Material.
              valueColor: AlwaysStoppedAnimation(style.foreground),
              backgroundColor: style.foreground,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (leadingIcon != null) ...[
                Icon(leadingIcon, size: _iconSize, color: style.foreground),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: _fontSize,
                  fontWeight: FontWeight.w500,
                  color: style.foreground,
                  decoration: variant == AppButtonVariant.link
                      ? TextDecoration.underline
                      : TextDecoration.none,
                ),
              ),
              if (trailingIcon != null) ...[
                const SizedBox(width: 6),
                Icon(trailingIcon, size: _iconSize, color: style.foreground),
              ],
            ],
          );

    final button = Opacity(
      opacity: onPressed == null ? 0.5 : 1,
      child: Material(
        color: style.background,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radius),
          side: style.borderColor != null
              ? BorderSide(color: style.borderColor!)
              : BorderSide.none,
        ),
        child: InkWell(
          onTap: _isInteractive ? onPressed : null,
          borderRadius: BorderRadius.circular(_radius),
          overlayColor: WidgetStatePropertyAll(style.overlay),
          child: Container(
            height: height ?? _defaultHeight,
            padding: EdgeInsets.symmetric(horizontal: _horizontalPadding),
            alignment: Alignment.center,
            child: content,
          ),
        ),
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }

  _ButtonStyle _resolveStyle(ColorScheme colorScheme) {
    switch (variant) {
      case AppButtonVariant.primary:
        return _ButtonStyle(
          background: colorScheme.primary,
          foreground: colorScheme.onPrimary,
          overlay: Colors.black.withValues(alpha: 0.08),
        );
      case AppButtonVariant.outline:
        return _ButtonStyle(
          background: Colors.transparent,
          foreground: colorScheme.onSurface,
          borderColor: colorScheme.outline,
          overlay: colorScheme.onSurface.withValues(alpha: 0.05),
        );
      case AppButtonVariant.secondary:
        return _ButtonStyle(
          background: colorScheme.secondary,
          foreground: colorScheme.onSecondary,
          overlay: colorScheme.onSecondary.withValues(alpha: 0.05),
        );
      case AppButtonVariant.ghost:
        return _ButtonStyle(
          background: Colors.transparent,
          foreground: colorScheme.onSurface,
          overlay: colorScheme.onSurface.withValues(alpha: 0.05),
        );
      case AppButtonVariant.destructive:
        return _ButtonStyle(
          background: colorScheme.error.withValues(alpha: 0.1),
          foreground: colorScheme.error,
          overlay: colorScheme.error.withValues(alpha: 0.1),
        );
      case AppButtonVariant.link:
        return _ButtonStyle(
          background: Colors.transparent,
          foreground: colorScheme.primary,
          overlay: Colors.transparent,
        );
    }
  }
}

class _ButtonStyle {
  const _ButtonStyle({
    required this.background,
    required this.foreground,
    this.borderColor,
    this.overlay = Colors.transparent,
  });

  final Color background;
  final Color foreground;
  final Color? borderColor;
  final Color overlay;
}
