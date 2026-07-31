import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTypography {
  AppTypography._();

  static const String fontFamily = 'Geist';

  static TextStyle _geist(double fontSize, FontWeight fontWeight) {
    return GoogleFonts.getFont(
      fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
    );
  }

  static TextStyle get h1 => _geist(24, FontWeight.w800);
  static TextStyle get h2 => _geist(18, FontWeight.w800);
  static TextStyle get h3 => _geist(16, FontWeight.w800);
  static TextStyle get h4 => _geist(14, FontWeight.w700);
  static TextStyle get h5 => _geist(12, FontWeight.w700);

  static TextStyle get bodyXl => _geist(18, FontWeight.w400);
  static TextStyle get bodyL => _geist(16, FontWeight.w400);
  static TextStyle get bodyM => _geist(14, FontWeight.w400);
  static TextStyle get bodyS => _geist(12, FontWeight.w400);
  static TextStyle get bodyXs => _geist(10, FontWeight.w500);

  static TextStyle get actionL => _geist(14, FontWeight.w600);
  static TextStyle get actionM => _geist(12, FontWeight.w600);
  static TextStyle get actionS => _geist(10, FontWeight.w600);

  static TextStyle get captionM => _geist(10, FontWeight.w600);
}
