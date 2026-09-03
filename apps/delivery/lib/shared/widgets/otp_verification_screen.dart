import 'dart:async';

import 'package:delivery/shared/widgets/app_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Reusable confirmation-code screen used by every auth flow that needs an
/// OTP step (login, signup, password reset, phone verification, ...).
///
/// [onVerify] should return an error message to display, or null on success
/// (the caller is responsible for navigating away on success).
class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    required this.destination,
    required this.onVerify,
    required this.onResend,
    this.title = 'Enter confirmation code',
    this.codeLength = 6,
    this.resendCooldown = const Duration(seconds: 30),
  });

  final String destination;
  final Future<String?> Function(String code) onVerify;
  final Future<void> Function() onResend;
  final String title;
  final int codeLength;
  final Duration resendCooldown;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  late final List<TextEditingController> _controllers = List.generate(
    widget.codeLength,
    (_) => TextEditingController(),
  );
  late final List<FocusNode> _focusNodes = List.generate(
    widget.codeLength,
    (_) => FocusNode(),
  );

  Timer? _resendTimer;
  int _resendSecondsLeft = 0;
  bool _isSubmitting = false;
  String? _errorText;

  bool get _isComplete =>
      _controllers.every((c) => c.text.trim().isNotEmpty);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusNodes.first.requestFocus();
    });
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    _resendTimer?.cancel();
    super.dispose();
  }

  void _onChanged(int index, String value) {
    if (_errorText != null) setState(() => _errorText = null);
    if (value.isNotEmpty && index < widget.codeLength - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    setState(() {});
  }

  void _onBackspace(int index) {
    if (_controllers[index].text.isEmpty && index > 0) {
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
      setState(() {});
    }
  }

  Future<void> _onContinue() async {
    if (!_isComplete || _isSubmitting) return;
    final code = _controllers.map((c) => c.text).join();
    setState(() => _isSubmitting = true);
    final error = await widget.onVerify(code);
    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      _errorText = error;
    });
  }

  Future<void> _onResend() async {
    if (_resendSecondsLeft > 0) return;
    await widget.onResend();
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

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
          child: Column(
            children: [
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'A ${widget.codeLength}-digit code was sent to\n${widget.destination}',
                textAlign: TextAlign.center,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurface.withValues(alpha: 0.6),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < widget.codeLength; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    _OtpBox(
                      controller: _controllers[i],
                      focusNode: _focusNodes[i],
                      onChanged: (value) => _onChanged(i, value),
                      onBackspace: () => _onBackspace(i),
                    ),
                  ],
                ],
              ),
              if (_errorText != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorText!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: colorScheme.error, fontSize: 13),
                ),
              ],
              const SizedBox(height: 24),
              _resendSecondsLeft > 0
                  ? Text(
                      'Resend code in ${_resendSecondsLeft}s',
                      style: TextStyle(
                        color: colorScheme.onSurface.withValues(alpha: 0.5),
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
              const SizedBox(height: 24),
              AppButton(
                label: 'Continue',
                expand: true,
                height: 48,
                isLoading: _isSubmitting,
                onPressed: _isComplete ? _onContinue : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onBackspace,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final VoidCallback onBackspace;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 44,
      height: 52,
      child: KeyboardListener(
        focusNode: FocusNode(skipTraversal: true),
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.backspace &&
              controller.text.isEmpty) {
            onBackspace();
          }
        },
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(1),
          ],
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurface,
          ),
          decoration: InputDecoration(
            counterText: '',
            contentPadding: EdgeInsets.zero,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: colorScheme.outline),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: colorScheme.outline),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: colorScheme.primary, width: 2),
            ),
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
