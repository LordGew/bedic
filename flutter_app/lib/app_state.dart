// app_state.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppState extends ChangeNotifier {
  Locale _locale = const Locale('es');
  ThemeMode _themeMode = ThemeMode.dark;
  Color _corporateColor = const Color(0xFF9B5CFF); // Neon Purple default;
  bool _isFirstTime = true;

  Locale get locale => _locale;
  ThemeMode get themeMode => _themeMode;
  Color get corporateColor => _corporateColor;
  bool get isFirstTime => _isFirstTime;
  int currentStep = 0;
  final int totalSteps = 4;

  AppState() {
    _loadPreferences();
  }

  void _loadPreferences() async {
    await Future.delayed(const Duration(milliseconds: 100));
    final prefs = await SharedPreferences.getInstance();

    final langCode = prefs.getString('languageCode') ?? 'es';
    _locale = Locale(langCode);

    final themeString = prefs.getString('themeMode') ?? 'dark';
    _themeMode = ThemeMode.values.firstWhere(
        (e) => e.toString() == 'ThemeMode.$themeString',
        orElse: () => ThemeMode.dark);

    final colorValue = prefs.getInt('corporateColorValue') ?? Colors.blue.value;
    _corporateColor = Color(colorValue);

    _isFirstTime = prefs.getBool('isFirstTime') ?? true;

    notifyListeners();
  }

  Future<void> setLanguage(String code) async {
    _locale = Locale(code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('languageCode', code);
    notifyListeners();
  }

  Future<void> setTheme(ThemeMode mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('themeMode', mode.name);
    notifyListeners();
  }

  Future<void> setCorporateColor(Color color) async {
    _corporateColor = color;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('corporateColorValue', color.value);
    notifyListeners();
  }

  Future<void> completeSetup() async {
    _isFirstTime = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstTime', false);
    notifyListeners();
  }

  // --- CARGA DESDE BACKEND ---
  Future<void> loadUserPreferences({
    required String language,
    required String theme,
    required String corporateColorHex,
  }) async {
    Color color = Colors.blue;
    if (corporateColorHex.length == 7 && corporateColorHex.startsWith('#')) {
      color = Color(int.parse(corporateColorHex.substring(1), radix: 16) + 0xFF000000);
    }

    final prefs = await SharedPreferences.getInstance();

    // Preferir el idioma y el tema locales ya guardados si existen;
    // usar los valores del backend solo como fallback.
    final storedLangCode = prefs.getString('languageCode'); // 'en' | 'es' | null
    final effectiveLanguage =
        (storedLangCode == 'en' || storedLangCode == 'es') ? storedLangCode! : language;

    final storedTheme = prefs.getString('themeMode'); // 'dark' | 'light' | null
    final effectiveTheme = (storedTheme == 'dark' || storedTheme == 'light')
        ? storedTheme!
        : theme;

    _locale = Locale(effectiveLanguage);
    _themeMode = effectiveTheme == 'dark' ? ThemeMode.dark : ThemeMode.light;

    _corporateColor = color;

    await prefs.setString('languageCode', effectiveLanguage);

    await prefs.setString('themeMode', effectiveTheme);
    await prefs.setInt('corporateColorValue', color.value);

    notifyListeners();
  }
}