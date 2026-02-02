import 'package:flutter/material.dart';
import 'color_palette.dart';

ThemeData darkTheme(Color corporateColor) {
  return ThemeData(
    brightness: Brightness.dark,
    primaryColor: corporateColor, // Color principal
    scaffoldBackgroundColor: const Color(0xFF212529), // Fondo oscuro (como en las imágenes)
    
    colorScheme: ColorScheme.dark(
      primary: corporateColor, // Color de acento principal
      secondary: corporateColor, // Color secundario
      background: const Color(0xFF212529), // Fondo
      surface: const Color(0xFF343A40), // Color de superficie (tarjetas, paneles)
      onPrimary: Colors.white, // Texto SOBRE color primario (ej. botones sólidos)
      onSurface: Colors.white, // Texto SOBRE superficie (texto normal)
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF343A40),
      iconTheme: IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(color: Colors.white, fontSize: 20),
    ),

    // --- CORRECCIÓN DE CONTRASTE ---
    // Asegurar que los botones usen el color corporativo
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: corporateColor, // Botón usa color corporativo
        foregroundColor: Colors.white, // Texto del botón es blanco (contraste)
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: corporateColor,
      foregroundColor: Colors.white,
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: corporateColor, // Texto de botones de texto
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: Colors.white70), // Borde al enfocar
      ),
    ),
    // Configuración general del tema oscuro
  );
}