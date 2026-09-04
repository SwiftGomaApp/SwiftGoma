import 'package:delivery/shared/utils/validators.dart';
import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_input.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

enum _Step { forgot, reset, success, failure }

/// Forgot / reset password flow, all in one screen — the same pattern as
/// the web app's forgot-password form (a step enum swaps the body in place
/// rather than navigating between screens).
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  static const _minPasswordLength = 8;

  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  _Step _step = _Step.forgot;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  bool _showValidationErrors = false;
  String? _errorText;

  String? get _emailError {
    if (!_showValidationErrors) return null;
    final value = _emailController.text.trim();
    if (value.isEmpty || isValidEmail(value)) return null;
    return 'Enter a valid email address';
  }

  String? get _newPasswordError {
    if (!_showValidationErrors) return null;
    final value = _newPasswordController.text;
    if (value.isEmpty || value.length >= _minPasswordLength) return null;
    return 'Use at least $_minPasswordLength characters';
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _clearResetFields() {
    _codeController.clear();
    _newPasswordController.clear();
    _confirmPasswordController.clear();
  }

  // TODO: replace with real API calls once the backend auth endpoints are
  // wired up (POST /auth/forgot-password, POST /auth/reset-password).
  Future<void> _onSendCode() async {
    if (_emailController.text.trim().isEmpty || _isLoading) return;
    if (!isValidEmail(_emailController.text)) {
      setState(() => _showValidationErrors = true);
      return;
    }
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _showValidationErrors = false;
      _step = _Step.reset;
    });
  }

  Future<void> _onResetPassword() async {
    if (_isLoading) return;
    if (_newPasswordController.text.length < _minPasswordLength) {
      setState(() => _showValidationErrors = true);
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _errorText = 'Passwords do not match.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorText = null;
    });
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    // TESTING: 123456 = success, anything else = failure.
    if (_codeController.text == '123456') {
      setState(() {
        _isLoading = false;
        _step = _Step.success;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorText = 'The verification code is incorrect or has expired.';
        _step = _Step.failure;
      });
    }
  }

  Future<void> _onTryAgain() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1)); // resend code
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _errorText = null;
      _showValidationErrors = false;
      _clearResetFields();
      _step = _Step.reset;
    });
  }

  void _onStartOver() {
    setState(() {
      _errorText = null;
      _showValidationErrors = false;
      _clearResetFields();
      _step = _Step.forgot;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(backgroundColor: colorScheme.surface, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ..._buildHeader(colorScheme, textTheme),
              const SizedBox(height: 24),
              ..._buildBody(colorScheme, textTheme),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildHeader(ColorScheme colorScheme, TextTheme textTheme) {
    switch (_step) {
      case _Step.forgot:
        return [
          Text(
            'Forgot password?',
            style: textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Enter your email address and we'll send you a verification "
            'code to reset your password.',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ];
      case _Step.reset:
        return [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Reset password',
                  style: textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              TextButton(
                onPressed: _onStartOver,
                child: const Text('Start over'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the verification code sent to your email and choose a '
            'new password.',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ];
      case _Step.success:
        return [
          Icon(Icons.check_circle, color: Colors.green, size: 56),
          const SizedBox(height: 16),
          Text(
            'Password reset successfully!',
            textAlign: TextAlign.center,
            style: textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your password has been updated successfully. You can now sign '
            'in with your new password.',
            textAlign: TextAlign.center,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ];
      case _Step.failure:
        return [
          Icon(Icons.cancel, color: colorScheme.error, size: 56),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            textAlign: TextAlign.center,
            style: textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorText ??
                "We couldn't complete your password reset. Please check "
                    'your information and try again.',
            textAlign: TextAlign.center,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ];
    }
  }

  List<Widget> _buildBody(ColorScheme colorScheme, TextTheme textTheme) {
    switch (_step) {
      case _Step.forgot:
        return [
          AppInput(
            controller: _emailController,
            label: 'Email',
            hint: 'm@example.com',
            errorText: _emailError,
            autofocus: true,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => _onSendCode(),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'Send verification code',
            expand: true,
            height: 44,
            isLoading: _isLoading,
            onPressed: _emailController.text.trim().isNotEmpty
                ? _onSendCode
                : null,
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => context.pop(),
              child: const Text('Remember your password? Sign in'),
            ),
          ),
        ];
      case _Step.reset:
        return [
          AppInput(
            controller: _codeController,
            label: 'Verification code',
            hint: 'Enter your code',
            autofocus: true,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => FocusScope.of(context).nextFocus(),
          ),
          const SizedBox(height: 12),
          AppInput(
            controller: _newPasswordController,
            label: 'New password',
            hint: 'Enter your new password',
            errorText: _newPasswordError,
            obscureText: _obscureNewPassword,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => FocusScope.of(context).nextFocus(),
            suffixIcon: IconButton(
              tooltip: _obscureNewPassword ? 'Show password' : 'Hide password',
              icon: Icon(
                _obscureNewPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
              onPressed: () =>
                  setState(() => _obscureNewPassword = !_obscureNewPassword),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'At least $_minPasswordLength characters.',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 8),
          AppInput(
            controller: _confirmPasswordController,
            label: 'Confirm password',
            hint: 'Confirm your new password',
            obscureText: _obscureConfirmPassword,
            textInputAction: TextInputAction.done,
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => _onResetPassword(),
            suffixIcon: IconButton(
              tooltip: _obscureConfirmPassword
                  ? 'Show password'
                  : 'Hide password',
              icon: Icon(
                _obscureConfirmPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
              onPressed: () => setState(
                () => _obscureConfirmPassword = !_obscureConfirmPassword,
              ),
            ),
          ),
          if (_errorText != null) ...[
            const SizedBox(height: 12),
            Text(
              _errorText!,
              style: TextStyle(color: colorScheme.error, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          AppButton(
            label: 'Reset password',
            expand: true,
            height: 44,
            isLoading: _isLoading,
            onPressed:
                _codeController.text.isNotEmpty &&
                    _newPasswordController.text.isNotEmpty &&
                    _confirmPasswordController.text.isNotEmpty
                ? _onResetPassword
                : null,
          ),
        ];
      case _Step.success:
        return [
          AppButton(
            label: 'Sign in',
            expand: true,
            height: 44,
            onPressed: () => context.pop(),
          ),
        ];
      case _Step.failure:
        return [
          AppButton(
            label: 'Try again',
            expand: true,
            height: 44,
            isLoading: _isLoading,
            onPressed: _onTryAgain,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'Back',
            variant: AppButtonVariant.ghost,
            expand: true,
            height: 44,
            onPressed: _onStartOver,
          ),
        ];
    }
  }
}
