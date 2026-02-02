import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';

class LanguageSelectorComponent extends StatelessWidget {
  const LanguageSelectorComponent({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final currentLang = appState.locale.languageCode;

    return DropdownButton<String>(
      value: currentLang,
      onChanged: (String? newValue) {
        if (newValue != null) {
          appState.setLanguage(newValue); // Actualiza el estado
        }
      },
      items: <String>['es', 'en']
          .map<DropdownMenuItem<String>>((String value) {
        return DropdownMenuItem<String>(
          value: value,
          child: Text(value == 'es' ? 'Español' : 'English'), // Placeholder i18n
        );
      }).toList(),
    );
  }
}