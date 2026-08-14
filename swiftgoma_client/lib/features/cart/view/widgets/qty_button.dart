import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';

class QtyButton extends StatelessWidget {
  const QtyButton({super.key, required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28.w,
        height: 28.w,
        decoration: const BoxDecoration(
          color: AppColors.highlight5,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16.w, color: AppColors.highlight1),
      ),
    );
  }
}
