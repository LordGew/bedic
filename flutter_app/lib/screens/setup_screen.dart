// lib/screens/setup_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../i18n/localization_service.dart';
import '../app_state.dart';
import '../services/auth_service.dart';
import '../components/language_selector_component.dart';
import '../components/theme_switch_component.dart';

class SetupScreen extends StatelessWidget {
  const SetupScreen({super.key});

  Future<void> _save(BuildContext context) async {
    final auth = Provider.of<AuthService>(context, listen: false);

    // AppState ya se actualiza desde los componentes de idioma/tema.
    // Aquí solo persistimos en el backend y volvemos.
    try {
      await auth.updatePreferences();
    } catch (_) {
      // si falla, al menos dejamos los cambios locales
    }

    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.themeMode == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          context.tr('settings_title') ?? 'Configuración',
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('appearance_section') ??
                          'Apariencia e idioma',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),

                    const Text('Idioma preferido'),
                    const SizedBox(height: 8),
                    const LanguageSelectorComponent(),

                    const Divider(height: 32),

                    Text(
                      'Tema',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    const ThemeSwitchComponent(),

                    const Spacer(),

                    Center(
                      child: ElevatedButton.icon(
                        onPressed: () => _save(context),
                        icon: const Icon(Icons.check),
                        label: Text(
                          context.tr('save_changes') ?? 'Guardar cambios',
                        ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(220, 50),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Center(
                      child: Text(
                        isDark ? 'Tema oscuro activo' : 'Tema claro activo',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
