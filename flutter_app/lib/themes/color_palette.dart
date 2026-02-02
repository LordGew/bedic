import 'package:flutter/material.dart';

// Definición de colores base y la paleta de colores corporativos
class AppColors {
  static const Color primaryBase = Color(0xFF007BFF); // Azul principal por defecto
  static const Color secondaryBase = Color(0xFF6C757D);
  static const Color backgroundLight = Color(0xFFF8F9FA);
  static const Color backgroundDark = Color(0xFF212529); // Color de fondo oscuro (como en las imágenes)

  // Paleta de colores sugeridos para que el usuario elija 
  static const List<Color> corporateColors = [
    // Colores Originales
    Colors.blue,
    Colors.red,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.teal,
    
    // --- NUEVOS COLORES AÑADIDOS (Inspirados en las imágenes) ---
    Color(0xFF4F2B6A), // Púrpura oscuro (basado en el fondo)
    Color(0xFFD63384), // Magenta/Rosa vibrante (basado en el botón)
    // --------------------------------------------------------
  ];
}