import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/features/auth/view/widgets/otp_input.dart';

class ConfirmationCodeScreen extends StatefulWidget {
  const ConfirmationCodeScreen({super.key, required this.email});

  final String email;

  @override
  State<ConfirmationCodeScreen> createState() => _ConfirmationCodeScreenState();
}

class _ConfirmationCodeScreenState extends State<ConfirmationCodeScreen> {
  static const int _codeLength = 6;
  static const int _resendCooldownSeconds = 30;

  String _code = '';
  int _cooldown = 0;
  Timer? _timer;

  bool get _isComplete => _code.length == _codeLength;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = _resendCooldownSeconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_cooldown <= 1) {
        timer.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown -= 1);
      }
    });
  }

  void _onContinuePressed() {
    if (!_isComplete) return;
    context.go(AppRoutes.explore);
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
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: 24.h),
              Text(
                'Enter confirmation code',
                textAlign: TextAlign.center,
                style: AppTypography.h2.copyWith(
                  color: AppColors.neutralDark1,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'A 6-digit code was sent to\n${widget.email}',
                textAlign: TextAlign.center,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.neutralDark4,
                  height: 1.45,
                ),
              ),
              SizedBox(height: 32.h),
              OtpInput(
                length: _codeLength,
                onChanged: (code) => setState(() => _code = code),
                onCompleted: (_) => _onContinuePressed(),
              ),
              SizedBox(height: 48.h),
              Center(
                child: GestureDetector(
                  onTap: _cooldown == 0 ? _startCooldown : null,
                  child: Text(
                    _cooldown == 0
                        ? 'Resend code'
                        : 'Resend code in ${_cooldown}s',
                    style: AppTypography.actionM.copyWith(
                      color: _cooldown == 0
                          ? AppColors.highlight1
                          : AppColors.neutralDark5,
                    ),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              AppButton(
                label: 'Continue',
                onPressed: _isComplete ? _onContinuePressed : null,
              ),
              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }
}