import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter/services.dart';

// Clase que maneja la carga de strings y el delegate
class LocalizationService {
  final Locale locale;
  
  LocalizationService(this.locale);

  static LocalizationService? of(BuildContext context) {
    return Localizations.of<LocalizationService>(context, LocalizationService);
  }

  late Map<String, String> _localizedStrings;

  Future<bool> load() async {
    try {
      String jsonString;
      try {
        jsonString = await rootBundle.loadString('i18n/${locale.languageCode}.json');
      } catch (e) {
        debugPrint('Trying alternative path for localization: $e');
        jsonString = await rootBundle.loadString('assets/i18n/${locale.languageCode}.json');
      }
      
      final Map<String, dynamic> jsonMap = json.decode(jsonString);

      _localizedStrings = jsonMap.map((key, value) {
        return MapEntry(key, value.toString());
      });

      debugPrint('Localization loaded successfully for ${locale.languageCode}');
      return true;
    } catch (e) {
      debugPrint('Error loading localization: $e');
      // Inicializar con un mapa vacío para evitar LateInitializationError
      _localizedStrings = {};
      return false;
    }
  }

  // Método para obtener el texto localizado
  String translate(String key) {
    if (_localizedStrings.isEmpty) {
      debugPrint('Warning: _localizedStrings is empty for key: $key');
    }
    return _localizedStrings[key] ?? key;
  }
}


// Delegate para que Flutter sepa cómo cargar la localización
class _LocalizationServiceDelegate
    extends LocalizationsDelegate<LocalizationService> {
  // Constructor corregido para ser constante
  const _LocalizationServiceDelegate(); 

  @override
  bool isSupported(Locale locale) {
    return ['en', 'es'].contains(locale.languageCode);
  }

  @override
  Future<LocalizationService> load(Locale locale) async {
    LocalizationService localizationService = LocalizationService(locale);
    await localizationService.load();
    return localizationService;
  }

  @override
  bool shouldReload(_LocalizationServiceDelegate old) {
    // Siempre recargar para asegurar que se cargue el idioma correcto
    return true;
  }
}

// Delegate estático para usar en MaterialApp
// --- SINTAXIS CORREGIDA: Se usa la variable global simple ---
const LocalizationsDelegate<LocalizationService> appLocalizationsDelegate =
    _LocalizationServiceDelegate();

    // Al final del archivo, añade esto:
extension LocalizationExtension on BuildContext {
  String tr(String key) {
    return LocalizationService.of(this)?.translate(key) ?? key;
  }
}