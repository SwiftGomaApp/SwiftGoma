import 'dart:async';

import 'package:delivery/shared/widgets/app_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// What the code being entered is for. Drives the screen's default title
/// when the caller doesn't pass an explicit [OtpVerificationScreen.title].
enum OtpPurpose {
  login,
  emailVerification,
  phoneVerification,
  twoFactor;

  String get defaultTitle {
    switch (this) {
      case OtpPurpose.login:
        return 'Enter confirmation code';
      case OtpPurpose.emailVerification:
        return 'Verify your email';
      case OtpPurpose.phoneVerification:
        return 'Verify your phone number';
      case OtpPurpose.twoFactor:
        return 'Two-factor verification';
    }
  }
}

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    this.destination,
    required this.onVerify,
    this.onResend,
    this.purpose = OtpPurpose.login,
    this.title,
    this.subtitle,
    this.codeLength = 6,
    this.resendCooldown = const Duration(seconds: 30),
  });

  /// Where the code was sent (email/phone), shown as an editable chip below
  /// the title. Leave null — together with [subtitle] — for codes that
  /// weren't "sent" anywhere, e.g. an authenticator app TOTP code.
  final String? destination;
  final Future<String?> Function(String code) onVerify;

  /// Resend handler. Omit to hide the resend row entirely, e.g. for a TOTP
  /// code that can't be "resent".
  final Future<void> Function()? onResend;
  final OtpPurpose purpose;

  /// Overrides [purpose]'s default title when set.
  final String? title;

  /// Overrides the default "A N-digit code was sent to destination" line
  /// (and hides the destination chip) when set.
  final String? subtitle;
  final int codeLength;
  final Duration resendCooldown;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final TextEditingController _codeController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  Timer? _resendTimer;
  int _resendSecondsLeft = 0;
  bool _isSubmitting = false;
  String? _errorText;

  bool get _isComplete => _codeController.text.length == widget.codeLength;

  @override
  void initState() {
    super.initState();
    _codeController.addListener(_handleCodeChanged);
    _focusNode.addListener(_handleFocusChanged);
  }

  @override
  void dispose() {
    _codeController.removeListener(_handleCodeChanged);
    _focusNode.removeListener(_handleFocusChanged);
    _codeController.dispose();
    _focusNode.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _handleCodeChanged() {
    if (_errorText != null) {
      setState(() => _errorText = null);
    } else {
      setState(() {});
    }
    if (_isComplete && !_isSubmitting) {
      _onContinue();
    }
  }

  void _handleFocusChanged() => setState(() {});

  Future<void> _onContinue() async {
    if (!_isComplete || _isSubmitting) return;
    final code = _codeController.text;
    setState(() => _isSubmitting = true);
    final error = await widget.onVerify(code);
    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      _errorText = error;
    });
  }

  Future<void> _onResend() async {
    final onResend = widget.onResend;
    if (onResend == null || _resendSecondsLeft > 0) return;
    await onResend();
    if (!mounted) return;
    setState(() => _resendSecondsLeft = widget.resendCooldown.inSeconds);
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendSecondsLeft <= 1) {
        timer.cancel();
        setState(() => _resendSecondsLeft = 0);
      } else {
        setState(() => _resendSecondsLeft -= 1);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final code = _codeController.text;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      widget.title ?? widget.purpose.defaultTitle,
                      textAlign: TextAlign.center,
                      style: textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (widget.subtitle != null)
                      Text(
                        widget.subtitle!,
                        textAlign: TextAlign.center,
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.6),
                          height: 1.4,
                        ),
                      )
                    else ...[
                      Text(
                        'A ${widget.codeLength}-digit code was sent to',
                        textAlign: TextAlign.center,
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.6),
                          height: 1.4,
                        ),
                      ),
                      if (widget.destination != null) ...[
                        const SizedBox(height: 2),
                        Tooltip(
                          message: 'Edit',
                          child: TextButton.icon(
                            onPressed: () => Navigator.of(context).maybePop(),
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: Icon(
                              Icons.edit_outlined,
                              size: 14,
                              color: colorScheme.primary,
                            ),
                            label: Text(
                              widget.destination!,
                              style: TextStyle(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                    const SizedBox(height: 32),
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (var i = 0; i < widget.codeLength; i++) ...[
                              if (i > 0) const SizedBox(width: 8),
                              _OtpBoxDisplay(
                                digit: i < code.length ? code[i] : '',
                                isActive:
                                    _focusNode.hasFocus &&
                                    (i == code.length ||
                                        (i == widget.codeLength - 1 &&
                                            code.length == widget.codeLength)),
                              ),
                            ],
                          ],
                        ),
                        // Invisible field that actually receives input; the
                        // boxes above are purely a display of its text.
                        Positioned.fill(
                          child: Opacity(
                            opacity: 0,
                            child: TextField(
                              controller: _codeController,
                              focusNode: _focusNode,
                              autofocus: true,
                              showCursor: false,
                              keyboardType: TextInputType.number,
                              autofillHints: const [AutofillHints.oneTimeCode],
                              decoration: const InputDecoration(
                                border: InputBorder.none,
                                counterText: '',
                              ),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(
                                  widget.codeLength,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_errorText != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _errorText!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: colorScheme.error,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                    AppButton(
                      label: 'Continue',
                      expand: true,
                      height: 48,
                      isLoading: _isSubmitting,
                      onPressed: _isComplete ? _onContinue : null,
                    ),
                    if (widget.onResend != null) ...[
                      const SizedBox(height: 8),
                      _resendSecondsLeft > 0
                          ? Text(
                              'Resend code in ${_resendSecondsLeft}s',
                              style: TextStyle(
                                color: colorScheme.onSurface.withValues(
                                  alpha: 0.5,
                                ),
                                fontSize: 14,
                              ),
                            )
                          : TextButton(
                              onPressed: _onResend,
                              child: Text(
                                'Resend code',
                                style: TextStyle(
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _OtpBoxDisplay extends StatelessWidget {
  const _OtpBoxDisplay({required this.digit, required this.isActive});

  final String digit;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: 44,
      height: 52,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? colorScheme.primary : colorScheme.outline,
          width: isActive ? 2 : 1,
        ),
      ),
      child: Text(
        digit,
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
      ),
    );
  }
}
