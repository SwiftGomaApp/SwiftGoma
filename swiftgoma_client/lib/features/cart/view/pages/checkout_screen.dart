import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
// import 'package:swiftgoma_client/features/cart/model/cart_item.dart';
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
                  _MethodCard(
                    title: 'Mobile Payment',
                    selected: _method == _PaymentMethod.mobile,
                    onTap: () =>
                        setState(() => _method = _PaymentMethod.mobile),
                    child: _method == _PaymentMethod.mobile
                        ? _buildMobileContent(total)
                        : null,
                  ),
                  SizedBox(height: 16.h),
                  _MethodCard(
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
            _ProviderCard(
              label: 'airtel\nmoney',
              selected: _provider == _Provider.airtel,
              onTap: () => setState(() => _provider = _Provider.airtel),
            ),
            SizedBox(width: 12.w),
            _ProviderCard(
              label: 'Orange\nMoney',
              selected: _provider == _Provider.orange,
              onTap: () => setState(() => _provider = _Provider.orange),
            ),
            SizedBox(width: 12.w),
            _ProviderCard(
              label: 'vodacom\nM-Pesa',
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
            _CurrencyCard(
              amount: '\$ ${total.toStringAsFixed(2)}',
              code: 'USD',
              selected: _currency == _Currency.usd,
              onTap: () => setState(() => _currency = _Currency.usd),
            ),
            SizedBox(width: 12.w),
            _CurrencyCard(
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

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.title,
    required this.selected,
    required this.onTap,
    this.child,
  });

  final String title;
  final bool selected;
  final VoidCallback onTap;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.neutralLight3),
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _RadioDot(selected: selected),
                SizedBox(width: 12.w),
                Text(
                  title,
                  style: AppTypography.h4.copyWith(
                    color: AppColors.neutralDark2,
                  ),
                ),
              ],
            ),
            ?child,
          ],
        ),
      ),
    );
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20.w,
      height: 20.w,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? AppColors.highlight1 : AppColors.neutralLight5,
        border: Border.all(
          color: selected ? AppColors.highlight1 : AppColors.neutralLight1,
          width: 1.5,
        ),
      ),
      child: selected
          ? Center(
              child: Container(
                width: 7.w,
                height: 7.w,
                decoration: const BoxDecoration(
                  color: AppColors.neutralLight5,
                  shape: BoxShape.circle,
                ),
              ),
            )
          : null,
    );
  }
}

class _ProviderCard extends StatelessWidget {
  const _ProviderCard({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 76.h,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppColors.highlight4 : AppColors.highlight5,
            borderRadius: BorderRadius.circular(14.r),
            border: selected
                ? Border.all(color: AppColors.highlight1, width: 1.5)
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTypography.h5.copyWith(color: AppColors.neutralDark1),
          ),
        ),
      ),
    );
  }
}

class _CurrencyCard extends StatelessWidget {
  const _CurrencyCard({
    required this.amount,
    required this.code,
    required this.selected,
    required this.onTap,
  });

  final String amount;
  final String code;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
          decoration: BoxDecoration(
            color: AppColors.highlight5,
            borderRadius: BorderRadius.circular(14.r),
          ),
          child: Row(
            children: [
              _RadioDot(selected: selected),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      amount,
                      style: AppTypography.h3.copyWith(
                        color: AppColors.neutralDark1,
                      ),
                    ),
                    Text(
                      code,
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.neutralDark4,
                      ),
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
