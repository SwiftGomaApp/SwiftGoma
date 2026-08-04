import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/input/view/app_text_field.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final FocusNode _nameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();

  bool _termsAccepted = false;
  bool _showTermsError = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _nameFocus.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  String? _validateName(String? value) {
    if ((value ?? '').trim().isEmpty) return 'Name is required';
    return null;
  }

  String? _validateEmail(String? value) {
    final String email = value?.trim() ?? '';
    if (email.isEmpty) return 'Email is required';
    final RegExp emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(email)) return 'Enter a valid email address';
    return null;
  }

  void _onSignupPressed() {
    FocusScope.of(context).unfocus();
    final bool fieldsValid = _formKey.currentState?.validate() ?? false;
    setState(() => _showTermsError = !_termsAccepted);
    if (!fieldsValid || !_termsAccepted) return;
    context.push(AppRoutes.confirmCode, extra: _emailController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 20.w,
            color: AppColors.neutralDark1,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
          child: Form(
            key: _formKey,
            child: AutofillGroup(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sign up',
                    style: AppTypography.h2.copyWith(
                      color: AppColors.neutralDark1,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    'Create an account to get started',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.neutralDark4,
                    ),
                  ),
                  SizedBox(height: 24.h),
                  AppTextField(
                    label: 'Name',
                    hint: 'Your full name',
                    controller: _nameController,
                    focusNode: _nameFocus,
                    keyboardType: TextInputType.name,
                    textCapitalization: TextCapitalization.words,
                    autofillHints: const [AutofillHints.name],
                    textInputAction: TextInputAction.next,
                    validator: _validateName,
                    onSubmitted: (_) => _emailFocus.requestFocus(),
                  ),
                  SizedBox(height: 20.h),
                  AppTextField(
                    label: 'Email Address',
                    hint: 'name@email.com',
                    controller: _emailController,
                    focusNode: _emailFocus,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    textInputAction: TextInputAction.done,
                    validator: _validateEmail,
                    onSubmitted: (_) => _onSignupPressed(),
                  ),
                  SizedBox(height: 20.h),
                  _buildTermsCheckbox(),
                  if (_showTermsError) ...[
                    SizedBox(height: 8.h),
                    Text(
                      'You must accept the terms to continue',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.error1,
                      ),
                    ),
                  ],
                  SizedBox(height: 24.h),
                  AppButton(label: 'Sign up', onPressed: _onSignupPressed),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24.w,
          height: 24.w,
          child: Checkbox(
            value: _termsAccepted,
            onChanged: (value) => setState(() {
              _termsAccepted = value ?? false;
              if (_termsAccepted) _showTermsError = false;
            }),
            activeColor: AppColors.highlight1,
            side: BorderSide(color: AppColors.neutralLight1, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6.r),
            ),
          ),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Text.rich(
            TextSpan(
              style: AppTypography.bodyS.copyWith(
                color: AppColors.neutralDark4,
                height: 1.4,
              ),
              children: [
                const TextSpan(text: "I've read and agree with the "),
                TextSpan(
                  text: 'Terms and Conditions',
                  style: AppTypography.h5.copyWith(
                    color: AppColors.highlight1,
                  ),
                  recognizer: TapGestureRecognizer()..onTap = () {},
                ),
                const TextSpan(text: ' and the '),
                TextSpan(
                  text: 'Privacy Policy',
                  style: AppTypography.h5.copyWith(
                    color: AppColors.highlight1,
                  ),
                  recognizer: TapGestureRecognizer()..onTap = () {},
                ),
                const TextSpan(text: '.'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}