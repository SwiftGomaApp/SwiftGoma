import 'package:delivery/shared/utils/validators.dart';
import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_input.dart';
import 'package:delivery/shared/widgets/otp_verification_screen.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  static const _minPasswordLength = 8;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _usePhone = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptedTerms = false;
  bool _isSubmitting = false;
  bool _showValidationErrors = false;
  String? _errorText;

  late final TapGestureRecognizer _termsRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/terms');
  late final TapGestureRecognizer _privacyRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/privacy');

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    super.dispose();
  }

  bool get _isDestinationValid => _usePhone
      ? isValidPhone(_phoneController.text)
      : isValidEmail(_emailController.text);

  String? get _destinationError {
    if (!_showValidationErrors) return null;
    final value = _usePhone
        ? _phoneController.text.trim()
        : _emailController.text.trim();
    if (value.isEmpty || _isDestinationValid) return null;
    return _usePhone
        ? 'Enter a valid phone number'
        : 'Enter a valid email address';
  }

  String? get _passwordError {
    if (!_showValidationErrors) return null;
    final value = _passwordController.text;
    if (value.isEmpty || value.length >= _minPasswordLength) return null;
    return 'Use at least $_minPasswordLength characters';
  }

  bool get _canSubmit {
    if (_isSubmitting) return false;
    final destination = _usePhone
        ? _phoneController.text.trim()
        : _emailController.text.trim();
    return _nameController.text.trim().isNotEmpty &&
        destination.isNotEmpty &&
        _passwordController.text.isNotEmpty &&
        _confirmPasswordController.text.isNotEmpty &&
        _acceptedTerms;
  }

  // TODO: replace these simulations with real API calls once the backend
  // auth endpoints are wired up.
  Future<void> _simulateSendCode() async {
    await Future.delayed(const Duration(seconds: 1));
  }

  Future<String?> _simulateVerifyAndGoHome(String code) async {
    await Future.delayed(const Duration(seconds: 1));
    if (code != '123456') return 'Invalid code. Try 123456.';
    if (mounted) context.go('/');
    return null;
  }

  Future<void> _onSubmit() async {
    if (!_canSubmit) return;
    if (!_isDestinationValid ||
        _passwordController.text.length < _minPasswordLength) {
      setState(() => _showValidationErrors = true);
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorText = 'Passwords do not match.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });
    try {
      await Future.delayed(const Duration(seconds: 1)); // create account
      if (!mounted) return;
      final destination = _usePhone
          ? _phoneController.text.trim()
          : _emailController.text.trim();
      await _simulateSendCode();
      if (!mounted) return;
      context.push(
        '/otp',
        extra: OtpVerificationScreen(
          purpose: _usePhone
              ? OtpPurpose.phoneVerification
              : OtpPurpose.emailVerification,
          destination: destination,
          onVerify: _simulateVerifyAndGoHome,
          onResend: _simulateSendCode,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppInput(
                controller: _nameController,
                hint: 'Full name',
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => FocusScope.of(context).nextFocus(),
              ),
              const SizedBox(height: 12),
              if (_usePhone)
                AppInput(
                  controller: _phoneController,
                  hint: '+243 999 999 999',
                  errorText: _destinationError,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  onChanged: (_) => setState(() {}),
                  onSubmitted: (_) => FocusScope.of(context).nextFocus(),
                )
              else
                AppInput(
                  controller: _emailController,
                  hint: 'Email Address',
                  errorText: _destinationError,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  onChanged: (_) => setState(() {}),
                  onSubmitted: (_) => FocusScope.of(context).nextFocus(),
                ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => setState(() => _usePhone = !_usePhone),
                  child: Text(
                    _usePhone ? 'Use email instead' : 'Use phone number',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              AppInput(
                controller: _passwordController,
                hint: 'Password',
                errorText: _passwordError,
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.next,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => FocusScope.of(context).nextFocus(),
                suffixIcon: IconButton(
                  tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
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
                hint: 'Confirm password',
                obscureText: _obscureConfirmPassword,
                textInputAction: TextInputAction.done,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _onSubmit(),
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
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _acceptedTerms,
                    onChanged: (value) =>
                        setState(() => _acceptedTerms = value ?? false),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text.rich(
                        TextSpan(
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                          children: [
                            const TextSpan(text: 'I agree to the '),
                            TextSpan(
                              text: 'Terms of Service',
                              style: TextStyle(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                              recognizer: _termsRecognizer,
                            ),
                            const TextSpan(text: ' and '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: TextStyle(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                              recognizer: _privacyRecognizer,
                            ),
                            const TextSpan(text: '.'),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppButton(
                label: 'Create account',
                expand: true,
                height: 42,
                isLoading: _isSubmitting,
                onPressed: _canSubmit ? _onSubmit : null,
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  _usePhone
                      ? "We'll text a code to verify your phone number."
                      : "We'll email a code to verify your address.",
                  textAlign: TextAlign.center,
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Already have an account? Log in'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
