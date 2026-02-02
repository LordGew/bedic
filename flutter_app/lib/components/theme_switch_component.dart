import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';

class ThemeSwitchComponent extends StatelessWidget {
  const ThemeSwitchComponent({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(appState.themeMode == ThemeMode.dark ? 'Modo Oscuro' : 'Modo Claro'), // Placeholder i18n
        Switch(
          value: appState.themeMode == ThemeMode.dark,
          onChanged: (bool isDark) {
            appState.setTheme(isDark ? ThemeMode.dark : ThemeMode.light); // Actualiza el estado
          },
        ),
      ],
    );
  }
}