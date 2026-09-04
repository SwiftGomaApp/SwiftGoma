import 'package:delivery/core/network/api_exception.dart';
import 'package:delivery/features/auth/data/auth_api.dart';
import 'package:delivery/features/auth/data/repo/auth_repository.dart';
import 'package:delivery/features/auth/login_view_model.dart';
import 'package:delivery/shared/utils/validators.dart';
import 'package:delivery/shared/widgets/app_button.dart';
import 'package:delivery/shared/widgets/app_input.dart';
import 'package:delivery/shared/widgets/otp_verification_screen.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _useEmailPassword = false;
  bool _obscurePassword = true;
  bool _showValidationErrors = false;

  late final TapGestureRecognizer _termsRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/terms');
  late final TapGestureRecognizer _privacyRecognizer = TapGestureRecognizer()
    ..onTap = () => context.push('/privacy');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    super.dispose();
  }

  String get _buttonLabel => _useEmailPassword ? 'Connexion' : 'Continuer';

  bool get _isBusy => ref.watch(loginViewModelProvider).isLoading;

  bool get _canSubmit {
    if (_isBusy) return false;
    if (_useEmailPassword) {
      return _emailController.text.trim().isNotEmpty &&
          _passwordController.text.isNotEmpty;
    }
    return _emailController.text.trim().isNotEmpty;
  }

  bool get _isDestinationValid => isValidEmail(_emailController.text);

  String? get _destinationError {
    if (!_showValidationErrors) return null;
    final value = _emailController.text.trim();
    if (value.isEmpty || _isDestinationValid) return null;
    return 'Entrez une adresse e-mail valide';
  }

  String? get _submitError {
    final error = ref.watch(loginViewModelProvider).error;
    if (error == null || error is TotpRequiredException) return null;
    if (error is RoleNotAllowedException) return error.message;
    return apiExceptionOf(error)?.message ??
        'Une erreur est survenue. Veuillez réessayer.';
  }

  void _showComingSoon(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('La connexion avec $provider arrive bientôt.')),
    );
  }

  Future<String?> _verifyEmailOtpAndGoHome(String code) async {
    final error = await ref
        .read(loginViewModelProvider.notifier)
        .verifyEmailOtp(email: _emailController.text.trim(), code: code);
    if (error == null && mounted) context.go('/');
    return error;
  }

  Future<String?> _verifyTotpAndGoHome(String pendingToken, String code) async {
    final error = await ref
        .read(loginViewModelProvider.notifier)
        .verifyTotp(pendingToken: pendingToken, code: code);
    if (error == null && mounted) context.go('/');
    return error;
  }

  Future<void> _onSubmit() async {
    if (!_canSubmit) return;
    if (!_isDestinationValid) {
      setState(() => _showValidationErrors = true);
      return;
    }

    final email = _emailController.text.trim();
    final notifier = ref.read(loginViewModelProvider.notifier);

    if (_useEmailPassword) {
      await notifier.loginWithPassword(
        email: email,
        password: _passwordController.text,
      );
      if (!mounted) return;
      final error = ref.read(loginViewModelProvider).error;
      if (error is TotpRequiredException) {
        context.push(
          '/otp',
          extra: OtpVerificationScreen(
            purpose: OtpPurpose.twoFactor,
            subtitle:
                'Entrez le code à 6 chiffres généré par votre application '
                "d'authentification.",
            onVerify: (code) =>
                _verifyTotpAndGoHome(error.pendingToken, code),
          ),
        );
        return;
      }
      if (error == null) {
        context.go('/');
      }
      return;
    }

    await notifier.requestEmailOtp(email: email);
    if (!mounted) return;
    if (ref.read(loginViewModelProvider).hasError) return;
    context.push(
      '/otp',
      extra: OtpVerificationScreen(
        purpose: OtpPurpose.login,
        destination: email,
        onVerify: _verifyEmailOtpAndGoHome,
        onResend: () => notifier.requestEmailOtp(email: email),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        top: false,
        child: _buildForm(context, colorScheme, textTheme),
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
                  'Bienvenue !',
                  style: textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 24),
                AppInput(
                  controller: _emailController,
                  hint: 'Adresse e-mail',
                  errorText: _destinationError,
                  autofocus: true,
                  height: 52,
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
                if (!_useEmailPassword) ...[
                  Center(
                    child: TextButton(
                      onPressed: () => setState(() => _useEmailPassword = true),
                      child: const Text('Se connecter avec un mot de passe'),
                    ),
                  ),
                ],
                if (_useEmailPassword) ...[
                  const SizedBox(height: 16),
                  AppInput(
                    controller: _passwordController,
                    hint: 'Mot de passe',
                    obscureText: _obscurePassword,
                    height: 52,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) => _onSubmit(),
                    suffixIcon: IconButton(
                      tooltip: _obscurePassword
                          ? 'Afficher le mot de passe'
                          : 'Masquer le mot de passe',
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
                      Flexible(
                        child: TextButton(
                          onPressed: () => setState(() {
                            _useEmailPassword = false;
                            _passwordController.clear();
                          }),
                          child: const Text(
                            'Utiliser un code à la place',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                      Flexible(
                        child: TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          child: const Text(
                            'Mot de passe oublié ?',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                if (_submitError != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _submitError!,
                    style: TextStyle(color: colorScheme.error, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 16),
                AppButton(
                  label: _buttonLabel,
                  expand: true,
                  height: 42,
                  isLoading: _isBusy,
                  onPressed: _canSubmit ? _onSubmit : null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: Divider(color: colorScheme.outline)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'Ou continuer avec',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: colorScheme.outline)),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Tooltip(
                      message: 'Continuer avec Apple',
                      child: AppButton(
                        circular: true,
                        height: 56,
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        icon: const Icon(Icons.apple, color: Colors.white),
                        onPressed: () => _showComingSoon('Apple'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Tooltip(
                      message: 'Continuer avec Google',
                      child: AppButton(
                        circular: true,
                        height: 56,
                        backgroundColor: colorScheme.surface,
                        foregroundColor: colorScheme.onSurface,
                        borderColor: colorScheme.outline,
                        icon: SvgPicture.string(
                          _googleIconSvg,
                          width: 22,
                          height: 22,
                        ),
                        onPressed: () => _showComingSoon('Google'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Tooltip(
                      message: "Continuer avec une clé d'accès",
                      child: AppButton(
                        circular: true,
                        height: 56,
                        backgroundColor: colorScheme.onSurface,
                        foregroundColor: colorScheme.surface,
                        icon: Icon(Icons.key, color: colorScheme.surface),
                        onPressed: () => _showComingSoon('Passkey'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text.rich(
                  TextSpan(
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                    children: [
                      const TextSpan(text: 'En continuant, vous acceptez nos '),
                      TextSpan(
                        text: "Conditions d'utilisation",
                        style: TextStyle(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                        recognizer: _termsRecognizer,
                      ),
                      const TextSpan(text: ' et notre '),
                      TextSpan(
                        text: 'Politique de confidentialité',
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
              ],
            ),
          ),
        ],
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
