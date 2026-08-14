import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/currency_card.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/method_card.dart';
import 'package:swiftgoma_client/features/cart/view/widgets/provider_card.dart';
import 'package:swiftgoma_client/features/cart/viewmodel/cart_cubit.dart';

enum _PaymentMethod { mobile, cashOnDelivery }

enum _Provider { airtel, orange, vodacom }

enum _Currency { usd, cdf }

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const double _cdfRate = 2850;

  final TextEditingController _phoneController = TextEditingController();
  _PaymentMethod _method = _PaymentMethod.mobile;
  _Provider _provider = _Provider.airtel;
  _Currency _currency = _Currency.usd;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  String _formatCdf(double usd) {
    final int cdf = (usd * _cdfRate).round();
    final String digits = cdf.toString();
    final StringBuffer buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
      buffer.write(digits[i]);
    }
    return buffer.toString();
  }

  void _onContinue() {
    if (_method == _PaymentMethod.mobile &&
        _phoneController.text.trim().isEmpty) {
      return;
    }
    if (_method == _PaymentMethod.mobile) {
      context.push(AppRoutes.paymentPending);
    } else {
      context.push(AppRoutes.paymentSuccess);
    }
  }

  @override
  Widget build(BuildContext context) {
    final double total = context.watch<CartCubit>().total;
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: true,
        leadingWidth: 90.w,
        leading: Center(
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Text(
              'Cancel',
              style: AppTypography.actionL.copyWith(
                color: AppColors.highlight1,
              ),
            ),
          ),
        ),
        title: Text(
          'Checkout',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Choose a payment method',
                    style: AppTypography.h2.copyWith(
                      color: AppColors.neutralDark1,
                    ),
                  ),
                  SizedBox(height: 6.h),
                  Text(
                    "You won't be charged until you review the order on the next page",
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.neutralDark4,
                      height: 1.4,
                    ),
                  ),
                  SizedBox(height: 20.h),
                  MethodCard(
                    title: 'Mobile Payment',
                    selected: _method == _PaymentMethod.mobile,
                    onTap: () =>
                        setState(() => _method = _PaymentMethod.mobile),
                    child: _method == _PaymentMethod.mobile
                        ? _buildMobileContent(total)
                        : null,
                  ),
                  SizedBox(height: 16.h),
                  MethodCard(
                    title: 'Cash on Delivery',
                    selected: _method == _PaymentMethod.cashOnDelivery,
                    onTap: () => setState(
                      () => _method = _PaymentMethod.cashOnDelivery,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 16.h),
              child: AppButton(label: 'Continue', onPressed: _onContinue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileContent(double total) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: 16.h),
        Row(
          children: [
            ProviderCard(
              label: 'airtel money',
              assetPath: 'assets/images/providers/airtel_money.png',
              selected: _provider == _Provider.airtel,
              onTap: () => setState(() => _provider = _Provider.airtel),
            ),
            SizedBox(width: 12.w),
            ProviderCard(
              label: 'Orange Money',
              assetPath: 'assets/images/providers/orange_money.png',
              selected: _provider == _Provider.orange,
              onTap: () => setState(() => _provider = _Provider.orange),
            ),
            SizedBox(width: 12.w),
            ProviderCard(
              label: 'vodacom M-Pesa',
              assetPath: 'assets/images/providers/vodacom.png',
              selected: _provider == _Provider.vodacom,
              onTap: () => setState(() => _provider = _Provider.vodacom),
            ),
          ],
        ),
        SizedBox(height: 20.h),
        Text(
          'Phone number',
          style: AppTypography.h4.copyWith(color: AppColors.neutralDark1),
        ),
        SizedBox(height: 8.h),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _onContinue(),
          style: AppTypography.bodyM.copyWith(color: AppColors.neutralDark1),
          cursorColor: AppColors.highlight1,
          decoration: InputDecoration(
            hintText: '+243 978 833 883',
            hintStyle: AppTypography.bodyM.copyWith(
              color: AppColors.neutralDark5,
            ),
            filled: true,
            fillColor: AppColors.neutralLight5,
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16.w,
              vertical: 14.h,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: AppColors.neutralLight1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(
                color: AppColors.highlight1,
                width: 1.5,
              ),
            ),
          ),
        ),
        SizedBox(height: 20.h),
        Row(
          children: [
            CurrencyCard(
              amount: '\$ ${total.toStringAsFixed(2)}',
              code: 'USD',
              selected: _currency == _Currency.usd,
              onTap: () => setState(() => _currency = _Currency.usd),
            ),
            SizedBox(width: 12.w),
            CurrencyCard(
              amount: 'Fr ${_formatCdf(total)}',
              code: 'CDF',
              selected: _currency == _Currency.cdf,
              onTap: () => setState(() => _currency = _Currency.cdf),
            ),
          ],
        ),
      ],
    );
  }
}
