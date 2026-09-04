import 'package:flutter/material.dart';

enum AppButtonVariant { primary, outline, secondary, ghost, destructive, link }

enum AppButtonSize { xs, sm, md, lg }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    this.label = '',
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.height,
    this.leadingIcon,
    this.trailingIcon,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.borderColor,
    this.isLoading = false,
    this.expand = false,
    this.circular = false,
  }) : assert(
         circular == false || label == '',
         'circular buttons are icon-only and ignore label',
       );

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final double? height;
  final IconData? leadingIcon;
  final IconData? trailingIcon;

  /// A custom leading widget (e.g. a brand SVG logo) used instead of
  /// [leadingIcon] when set — for icons that aren't a single [IconData].
  final Widget? icon;

  /// Overrides the variant's resolved colors, e.g. for fixed brand colors.
  final Color? backgroundColor;
  final Color? foregroundColor;
  final Color? borderColor;

  final bool isLoading;
  final bool expand;

  /// Renders as an icon-only circle (diameter = [height], default 40) —
  /// [label] is ignored, and [expand] has no effect.
  final bool circular;

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

  double get _radius => size == AppButtonSize.xs ? 10 : 14;

  double get _iconSize => size == AppButtonSize.xs ? 14 : 16;

  bool get _isInteractive => onPressed != null && !isLoading;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final resolvedStyle = _resolveStyle(colorScheme);
    final style = _ButtonStyle(
      background: backgroundColor ?? resolvedStyle.background,
      foreground: foregroundColor ?? resolvedStyle.foreground,
      borderColor: borderColor ?? resolvedStyle.borderColor,
      overlay: resolvedStyle.overlay,
    );

    final spinner = SizedBox(
      width: _iconSize,
      height: _iconSize,
      child: CircularProgressIndicator.adaptive(
        strokeWidth: 2,
        // `backgroundColor` is what actually tints the Cupertino spinner on
        // iOS/macOS; `valueColor` only affects Material.
        valueColor: AlwaysStoppedAnimation(style.foreground),
        backgroundColor: style.foreground,
      ),
    );

    final content = isLoading
        ? spinner
        : circular
        ? (icon ??
              (leadingIcon != null
                  ? Icon(leadingIcon, color: style.foreground)
                  : const SizedBox.shrink()))
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: 12),
              ] else if (leadingIcon != null) ...[
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

    final shape = circular
        ? CircleBorder(
            side: style.borderColor != null
                ? BorderSide(color: style.borderColor!)
                : BorderSide.none,
          )
        : RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_radius),
            side: style.borderColor != null
                ? BorderSide(color: style.borderColor!)
                : BorderSide.none,
          );

    final diameter = height ?? 40;

    final button = Opacity(
      opacity: onPressed == null ? 0.5 : 1,
      child: Material(
        color: style.background,
        shape: shape,
        child: InkWell(
          onTap: _isInteractive ? onPressed : null,
          customBorder: shape,
          overlayColor: WidgetStatePropertyAll(style.overlay),
          child: circular
              ? SizedBox(
                  width: diameter,
                  height: diameter,
                  child: Center(child: content),
                )
              : Container(
                  height: height ?? _defaultHeight,
                  padding: EdgeInsets.symmetric(horizontal: _horizontalPadding),
                  alignment: Alignment.center,
                  child: content,
                ),
        ),
      ),
    );

    return expand && !circular
        ? SizedBox(width: double.infinity, child: button)
        : button;
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
