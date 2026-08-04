import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/input/view/app_text_field.dart';
import 'package:swiftgoma_client/features/auth/view/widgets/auth_footer.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const String _imagePath = 'assets/images/auth_header.png';

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  bool _withPassword = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    final String email = value?.trim() ?? '';
    if (email.isEmpty) return 'Email is required';
    final RegExp emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(email)) return 'Enter a valid email address';
    return null;
  }

  String? _validatePassword(String? value) {
    if (!_withPassword) return null;
    if ((value ?? '').isEmpty) return 'Password is required';
    return null;
  }

  void _toggleMode() {
    setState(() => _withPassword = !_withPassword);
    if (_withPassword) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _emailController.text.isNotEmpty) {
          _passwordFocus.requestFocus();
        }
      });
    }
  }

  void _onForgotPassword() {
    if (_validateEmail(_emailController.text) != null) {
      _emailFocus.requestFocus();
      _formKey.currentState?.validate();
      return;
    }
    context.push(AppRoutes.confirmCode, extra: _emailController.text.trim());
  }

  void _onLoginPressed() {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final String email = _emailController.text.trim();
    if (_withPassword) {
      context.go(AppRoutes.home);
    } else {
      context.push(AppRoutes.confirmCode, extra: email);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          SizedBox(
            height: 0.38.sh,
            width: double.infinity,
            child: Image.asset(
              _imagePath,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: AppColors.highlight5,
                alignment: Alignment.center,
                child: Icon(
                  Icons.image_outlined,
                  size: 48.w,
                  color: AppColors.highlight3,
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 16.h),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome!',
                      style: AppTypography.h1.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                    SizedBox(height: 20.h),
                    AutofillGroup(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AppTextField(
                            hint: 'Email Address',
                            controller: _emailController,
                            focusNode: _emailFocus,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
                            textInputAction: _withPassword
                                ? TextInputAction.next
                                : TextInputAction.done,
                            validator: _validateEmail,
                            onSubmitted: (_) {
                              if (_withPassword) {
                                _passwordFocus.requestFocus();
                              } else {
                                _onLoginPressed();
                              }
                            },
                          ),
                          if (_withPassword) ...[
                            SizedBox(height: 16.h),
                            AppTextField(
                              hint: 'Password',
                              controller: _passwordController,
                              focusNode: _passwordFocus,
                              obscurable: true,
                              autofillHints: const [AutofillHints.password],
                              textInputAction: TextInputAction.done,
                              validator: _validatePassword,
                              onSubmitted: (_) => _onLoginPressed(),
                            ),
                          ],
                        ],
                      ),
                    ),
                    SizedBox(height: 12.h),
                    GestureDetector(
                      onTap: _withPassword ? _onForgotPassword : _toggleMode,
                      child: Text(
                        _withPassword ? 'Forgot password?' : 'Login with password',
                        style: AppTypography.actionM.copyWith(
                          color: AppColors.highlight1,
                        ),
                      ),
                    ),
                    SizedBox(height: 20.h),
                    AppButton(label: 'Login', onPressed: _onLoginPressed),
                    SizedBox(height: 20.h),
                    AuthFooter(
                      onRegisterTap: () => context.push(AppRoutes.signup),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}