import 'package:delivery/shared/utils/validators.dart';
import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_input.dart';
import 'package:delivery/shared/widgets/otp_verification_screen.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _useEmailPassword = false;
  bool _usePhone = false;
  bool _obscurePassword = true;
  bool _isSubmitting = false;
  bool _showValidationErrors = false;

  late final TapGestureRecognizer _termsRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/terms');
  late final TapGestureRecognizer _privacyRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/privacy');

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    super.dispose();
  }

  String get _buttonLabel => _useEmailPassword ? 'Login' : 'Continue';

  bool get _canSubmit {
    if (_isSubmitting) return false;
    if (_usePhone) return _phoneController.text.trim().isNotEmpty;
    if (_useEmailPassword) {
      return _emailController.text.trim().isNotEmpty &&
          _passwordController.text.isNotEmpty;
    }
    return _emailController.text.trim().isNotEmpty;
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

  void _showComingSoon(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in is coming soon.')),
    );
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
    if (!_isDestinationValid) {
      setState(() => _showValidationErrors = true);
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      if (_useEmailPassword) {
        await Future.delayed(const Duration(seconds: 1)); // password check
        if (!mounted) return;
        await _simulateSendCode();
        if (!mounted) return;
        context.push(
          '/otp',
          extra: OtpVerificationScreen(
            purpose: OtpPurpose.twoFactor,
            destination: _emailController.text.trim(),
            onVerify: _simulateVerifyAndGoHome,
            onResend: _simulateSendCode,
          ),
        );
        return;
      }

      final destination = _usePhone
          ? _phoneController.text.trim()
          : _emailController.text.trim();
      await _simulateSendCode();
      if (!mounted) return;
      context.push(
        '/otp',
        extra: OtpVerificationScreen(
          purpose: OtpPurpose.login,
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
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(child: _buildForm(context, colorScheme, textTheme)),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: Text.rich(
                TextSpan(
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                  children: [
                    const TextSpan(text: 'By continuing, you agree to our '),
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
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm(
    BuildContext context,
    ColorScheme colorScheme,
    TextTheme textTheme,
  ) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Image.asset(
              'assets/images/login_hero.jpg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: colorScheme.primary.withValues(alpha: 0.08),
                alignment: Alignment.center,
                child: Icon(
                  Icons.image_outlined,
                  size: 48,
                  color: colorScheme.primary,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Welcome!',
                  style: textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 20),
                if (_usePhone)
                  AppInput(
                    controller: _phoneController,
                    hint: '+243 999 999 999',
                    errorText: _destinationError,
                    autofocus: true,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) => _onSubmit(),
                  )
                else
                  AppInput(
                    controller: _emailController,
                    hint: 'Email Address',
                    errorText: _destinationError,
                    autofocus: true,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: _useEmailPassword
                        ? TextInputAction.next
                        : TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) {
                      if (_useEmailPassword) {
                        FocusScope.of(context).nextFocus();
                      } else {
                        _onSubmit();
                      }
                    },
                  ),
                if (!_useEmailPassword && !_usePhone) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: () =>
                            setState(() => _useEmailPassword = true),
                        child: const Text('Login with password'),
                      ),
                      Text(
                        '·',
                        style: TextStyle(
                          color: colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _usePhone = true),
                        child: const Text('Use phone number'),
                      ),
                    ],
                  ),
                ],
                if (_usePhone) ...[
                  const SizedBox(height: 4),
                  Center(
                    child: TextButton(
                      onPressed: () => setState(() => _usePhone = false),
                      child: const Text('Use email instead'),
                    ),
                  ),
                ],
                if (_useEmailPassword) ...[
                  const SizedBox(height: 12),
                  AppInput(
                    controller: _passwordController,
                    hint: 'Password',
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) => _onSubmit(),
                    suffixIcon: IconButton(
                      tooltip: _obscurePassword
                          ? 'Show password'
                          : 'Hide password',
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () => setState(() {
                          _useEmailPassword = false;
                          _passwordController.clear();
                        }),
                        child: const Text('Use a code instead'),
                      ),
                      TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: const Text('Forgot password?'),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                AppButton(
                  label: _buttonLabel,
                  expand: true,
                  height: 42,
                  isLoading: _isSubmitting,
                  onPressed: _canSubmit ? _onSubmit : null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: Divider(color: colorScheme.outline)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'Or continue with',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: colorScheme.outline)),
                  ],
                ),
                const SizedBox(height: 20),
                _SocialButton(
                  onTap: () => _showComingSoon('Apple'),
                  label: 'Continue with Apple',
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  icon: const Icon(Icons.apple, color: Colors.white),
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  onTap: () => _showComingSoon('Google'),
                  label: 'Continue with Google',
                  backgroundColor: colorScheme.surface,
                  foregroundColor: colorScheme.onSurface,
                  borderColor: colorScheme.outline,
                  icon: SvgPicture.string(
                    _googleIconSvg,
                    width: 20,
                    height: 20,
                  ),
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  onTap: () => _showComingSoon('Passkey'),
                  label: 'Continue with Passkey',
                  backgroundColor: colorScheme.onSurface,
                  foregroundColor: colorScheme.surface,
                  icon: Icon(Icons.key, color: colorScheme.surface),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.push('/signup'),
                    child: const Text("Don't have an account? Sign up"),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.onTap,
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
    this.borderColor,
  });

  final VoidCallback onTap;
  final String label;
  final Widget icon;
  final Color backgroundColor;
  final Color foregroundColor;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: borderColor != null
            ? BorderSide(color: borderColor!)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        customBorder: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: SizedBox(
          height: 48,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  color: foregroundColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

const _googleIconSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039
	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
</svg>
''';
