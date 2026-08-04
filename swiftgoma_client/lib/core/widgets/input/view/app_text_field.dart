import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.hint,
    this.label,
    this.controller,
    this.focusNode,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.obscurable = false,
    this.autofillHints,
    this.textCapitalization = TextCapitalization.none,
    this.validator,
    this.onSubmitted,
  });

  final String hint;
  final String? label;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final bool obscurable;
  final Iterable<String>? autofillHints;
  final TextCapitalization textCapitalization;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onSubmitted;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscured = widget.obscurable;

  OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(12.r),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTypography.h5.copyWith(color: AppColors.neutralDark1),
          ),
          SizedBox(height: 8.h),
        ],
        TextFormField(
          controller: widget.controller,
          focusNode: widget.focusNode,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          obscureText: _obscured,
          autofillHints: widget.autofillHints,
          textCapitalization: widget.textCapitalization,
          validator: widget.validator,
          onFieldSubmitted: widget.onSubmitted,
          style: AppTypography.bodyS.copyWith(color: AppColors.neutralDark1),
          cursorColor: AppColors.highlight1,
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle:
                AppTypography.bodyM.copyWith(color: AppColors.neutralDark5),
            filled: true,
            fillColor: AppColors.neutralLight5,
            contentPadding:
                EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
            enabledBorder: _border(AppColors.neutralLight1),
            focusedBorder: _border(AppColors.highlight1, width: 1.5),
            errorBorder: _border(AppColors.error1),
            focusedErrorBorder: _border(AppColors.error1, width: 1.5),
            errorStyle:
                AppTypography.bodyS.copyWith(color: AppColors.error1),
            suffixIcon: widget.obscurable
                ? IconButton(
                    onPressed: () => setState(() => _obscured = !_obscured),
                    icon: Icon(
                      _obscured
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20.w,
                      color: AppColors.neutralDark5,
                    ),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}