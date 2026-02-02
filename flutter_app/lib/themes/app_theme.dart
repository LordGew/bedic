import 'package:flutter/material.dart';

class AppTheme {
  // Colores corporativos
  static const Color _neonPurple = Color(0xFF9B59B6);
  static const Color _darkBg = Color(0xFF0A0A0A);
  
  // Colores tema claro - Completamente refactorizado
  static const Color _lightBg = Color(0xFFF8F7FC);
  static const Color _lightSurface = Color(0xFFFFFFFF);
  static const Color _lightOnSurface = Color(0xFF2D1B4E);
  static const Color _lightSecondary = Color(0xFF7B3FF2);
  static const Color _lightTertiary = Color(0xFFD4A5FF);

  static ThemeData light(Color accent) {
    return ThemeData(
      brightness: Brightness.light,
      useMaterial3: true,
      scaffoldBackgroundColor: _lightBg,
      colorScheme: ColorScheme.light(
        primary: _neonPurple,
        onPrimary: Colors.white,
        secondary: _lightSecondary,
        onSecondary: Colors.white,
        tertiary: _lightTertiary,
        onTertiary: _lightOnSurface,
        surface: _lightSurface,
        onSurface: _lightOnSurface,
        surfaceVariant: Color(0xFFF0E6FF),
        onSurfaceVariant: Color(0xFF5A4570),
        outline: Color(0xFFB8A5D1),
        outlineVariant: Color(0xFFE5D9F5),
        background: _lightBg,
        onBackground: _lightOnSurface,
        error: Color(0xFFB3261E),
        onError: Colors.white,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: _lightSurface,
        foregroundColor: _lightOnSurface,
        elevation: 2,
        shadowColor: _neonPurple.withOpacity(0.15),
        centerTitle: false,
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: _lightOnSurface,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _neonPurple,
          foregroundColor: Colors.white,
          shadowColor: _neonPurple.withOpacity(0.4),
          elevation: 6,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: _neonPurple,
          side: const BorderSide(color: _neonPurple, width: 2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _neonPurple,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFFF5F0FF),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5D9F5), width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5D9F5), width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _neonPurple, width: 2.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFB3261E), width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFB3261E), width: 2.5),
        ),
        labelStyle: const TextStyle(
          color: Color(0xFF5A4570),
          fontWeight: FontWeight.w600,
        ),
        hintStyle: const TextStyle(
          color: Color(0xFF9B8AB5),
          fontWeight: FontWeight.w500,
        ),
        prefixIconColor: _neonPurple,
        suffixIconColor: _neonPurple,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: _neonPurple,
        foregroundColor: Colors.white,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      cardTheme: CardThemeData(
        color: _lightSurface,
        elevation: 3,
        shadowColor: _neonPurple.withOpacity(0.12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      textTheme: TextTheme(
        displayLarge: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: _lightOnSurface,
          letterSpacing: -0.5,
        ),
        displayMedium: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: _lightOnSurface,
          letterSpacing: -0.3,
        ),
        displaySmall: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: _lightOnSurface,
        ),
        headlineLarge: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: _lightOnSurface,
        ),
        headlineMedium: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: _lightOnSurface,
        ),
        headlineSmall: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: _lightOnSurface,
        ),
        titleLarge: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: _lightOnSurface,
          letterSpacing: 0.2,
        ),
        titleMedium: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: _lightOnSurface,
          letterSpacing: 0.1,
        ),
        titleSmall: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: _lightOnSurface,
        ),
        bodyLarge: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: _lightOnSurface,
          letterSpacing: 0.3,
        ),
        bodyMedium: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: _lightOnSurface,
          letterSpacing: 0.2,
        ),
        bodySmall: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Color(0xFF5A4570),
          letterSpacing: 0.1,
        ),
        labelLarge: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: _neonPurple,
          letterSpacing: 0.5,
        ),
        labelMedium: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: _neonPurple,
          letterSpacing: 0.3,
        ),
        labelSmall: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: _neonPurple,
          letterSpacing: 0.2,
        ),
      ),
      iconTheme: const IconThemeData(color: _neonPurple, size: 24),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE5D9F5),
        thickness: 1,
        space: 16,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Color(0xFFF0E6FF),
        selectedColor: _neonPurple,
        labelStyle: const TextStyle(
          color: _lightOnSurface,
          fontWeight: FontWeight.w600,
        ),
        secondaryLabelStyle: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: _neonPurple,
        linearTrackColor: Color(0xFFE5D9F5),
      ),
    );
  }

  static ThemeData dark(Color accent) {
    return ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,
      scaffoldBackgroundColor: _darkBg,
      colorScheme: ColorScheme.dark(
        primary: _neonPurple,
        secondary: _neonPurple,
        tertiary: _neonPurple.withOpacity(0.8),
        surface: Color(0xFF1A1A1A),
        surfaceVariant: Color(0xFF2A2A2A),
        onSurface: Colors.white,
        onSurfaceVariant: Color(0xFFB0B0B0),
        outline: Color(0xFF404040),
        outlineVariant: Color(0xFF303030),
        background: _darkBg,
        onBackground: Colors.white,
        error: Color(0xFFCF6679),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1A1A1A),
        foregroundColor: Colors.white,
        elevation: 1,
        shadowColor: Colors.black,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _neonPurple,
          foregroundColor: Colors.white,
          shadowColor: _neonPurple.withOpacity(0.6),
          elevation: 8,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: _neonPurple,
          side: BorderSide(color: _neonPurple, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _neonPurple,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF2A2A2A),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF404040)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF404040)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: _neonPurple, width: 2),
        ),
        labelStyle: TextStyle(color: Color(0xFFB0B0B0)),
        hintStyle: TextStyle(color: Color(0xFF808080)),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: _neonPurple,
        foregroundColor: Colors.white,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      cardTheme: CardThemeData(
        color: Color(0xFF1A1A1A),
        elevation: 4,
        shadowColor: Colors.black.withOpacity(0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      textTheme: TextTheme(
        displayLarge: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        displayMedium: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        displaySmall: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        headlineLarge: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        headlineMedium: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        headlineSmall: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        titleLarge: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        titleMedium: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleSmall: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        bodyLarge: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Colors.white,
        ),
        bodyMedium: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Colors.white,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: Color(0xFFB0B0B0),
        ),
        labelLarge: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: _neonPurple,
        ),
        labelMedium: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: _neonPurple,
        ),
        labelSmall: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _neonPurple,
        ),
      ),
      iconTheme: const IconThemeData(color: _neonPurple, size: 24),
      dividerTheme: DividerThemeData(
        color: Color(0xFF303030),
        thickness: 1,
      ),
    );
  }
}
