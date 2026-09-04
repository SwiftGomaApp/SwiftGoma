import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.obscureText = false,
    this.enabled = true,
    this.autofocus = false,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.prefixIcon,
    this.suffixIcon,
    this.inputFormatters,
    this.onChanged,
    this.onSubmitted,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? errorText;
  final bool obscureText;
  final bool enabled;
  final bool autofocus;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  static const _lightRing = Color(0xFFABA09C);
  static const _darkRing = Color(0xFF7C6D67);
  static const _lightMutedForeground = Color(0xFF7C6D67);
  static const _darkMutedForeground = Color(0xFFABA09C);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ringColor = isDark ? _darkRing : _lightRing;
    final mutedForeground = isDark
        ? _darkMutedForeground
        : _lightMutedForeground;
    final radius = BorderRadius.circular(8);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Opacity(
          opacity: enabled ? 1 : 0.5,
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            enabled: enabled,
            autofocus: autofocus,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            textCapitalization: textCapitalization,
            inputFormatters: inputFormatters,
            onChanged: onChanged,
            onSubmitted: onSubmitted,
            style: TextStyle(fontSize: 14, color: colorScheme.onSurface),
            decoration: InputDecoration(
              hintText: hint,
              errorText: errorText,
              hintStyle: TextStyle(fontSize: 14, color: mutedForeground),
              filled: true,
              fillColor: colorScheme.outline.withValues(alpha: 0.2),
              prefixIcon: prefixIcon,
              suffixIcon: suffixIcon,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              border: OutlineInputBorder(
                borderRadius: radius,
                borderSide: BorderSide(color: colorScheme.outline),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: radius,
                borderSide: BorderSide(color: colorScheme.outline),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: radius,
                borderSide: BorderSide(color: ringColor, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: radius,
                borderSide: BorderSide(color: colorScheme.error),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: radius,
                borderSide: BorderSide(color: colorScheme.error, width: 2),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
