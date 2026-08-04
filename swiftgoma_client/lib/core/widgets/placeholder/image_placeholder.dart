import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';

class ImagePlaceholder extends StatelessWidget {
  const ImagePlaceholder({
    super.key,
    this.borderRadius,
    this.iconSize,
  });

  final BorderRadius? borderRadius;
  final double? iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.highlight5,
        borderRadius: borderRadius,
      ),
      alignment: Alignment.center,
      child: Icon(
        Icons.image_outlined,
        size: iconSize ?? 28.w,
        color: AppColors.highlight4,
      ),
    );
  }
}
