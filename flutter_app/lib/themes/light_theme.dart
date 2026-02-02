import 'package:flutter/material.dart';
import 'color_palette.dart';

ThemeData lightTheme(Color corporateColor) {
  return ThemeData(
    brightness: Brightness.light,
    primaryColor: corporateColor,
    colorScheme: ColorScheme.light(
      primary: corporateColor,
      secondary: AppColors.secondaryBase,
      surface: AppColors.backgroundLight,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.backgroundLight,
      iconTheme: IconThemeData(color: Colors.black87),
      titleTextStyle: TextStyle(color: Colors.black87, fontSize: 20),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: corporateColor,
    ),
    // Configuración general del tema claro
  );
}