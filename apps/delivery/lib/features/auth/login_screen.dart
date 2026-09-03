import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_input.dart';
import 'package:delivery/shared/widgets/otp_verification_screen.dart';
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

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
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
    setState(() => _isSubmitting = true);
    try {
      if (_useEmailPassword) {
        await Future.delayed(const Duration(seconds: 1));
        if (!mounted) return;
        context.go('/');
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
        child: SingleChildScrollView(
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
                        keyboardType: TextInputType.phone,
                        onChanged: (_) => setState(() {}),
                      )
                    else
                      AppInput(
                        controller: _emailController,
                        hint: 'Email Address',
                        keyboardType: TextInputType.emailAddress,
                        onChanged: (_) => setState(() {}),
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
                              color: colorScheme.onSurface.withValues(
                                alpha: 0.4,
                              ),
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
                        onChanged: (_) => setState(() {}),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          child: const Text('Forgot password?'),
                        ),
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
                              color: colorScheme.onSurface.withValues(
                                alpha: 0.5,
                              ),
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: colorScheme.outline)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _SocialIconButton(
                          onTap: () {},
                          backgroundColor: colorScheme.onSurface,
                          child: const Icon(Icons.key, color: Colors.white),
                        ),
                        const SizedBox(width: 16),
                        _SocialIconButton(
                          onTap: () {},
                          backgroundColor: colorScheme.surface,
                          borderColor: colorScheme.outline,
                          child: SvgPicture.string(
                            _googleIconSvg,
                            width: 20,
                            height: 20,
                          ),
                        ),
                        const SizedBox(width: 16),
                        _SocialIconButton(
                          onTap: () {},
                          backgroundColor: Colors.black,
                          child: const Icon(Icons.apple, color: Colors.white),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SocialIconButton extends StatelessWidget {
  const _SocialIconButton({
    required this.onTap,
    required this.backgroundColor,
    required this.child,
    this.borderColor,
  });

  final VoidCallback onTap;
  final Color backgroundColor;
  final Color? borderColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      shape: CircleBorder(
        side: borderColor != null
            ? BorderSide(color: borderColor!)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(width: 48, height: 48, child: Center(child: child)),
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
