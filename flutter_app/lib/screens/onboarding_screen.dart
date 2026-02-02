import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../app_state.dart';
import '../screens/login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  String _selectedLanguage = 'es';
  String _selectedTheme = 'dark';
  bool _savePreferences = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _selectedLanguage = prefs.getString('languageCode') ?? 'es';
      _selectedTheme = prefs.getString('themeMode') ?? 'dark';
    });
  }

  Future<void> _saveAndContinue() async {
    final appState = Provider.of<AppState>(context, listen: false);
    
    // Cambiar idioma
    await appState.setLanguage(_selectedLanguage);
    
    // Cambiar tema
    final themeMode = _selectedTheme == 'light' ? ThemeMode.light : ThemeMode.dark;
    await appState.setTheme(themeMode);
    
    // Guardar preferencias si está marcado
    if (_savePreferences) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('languageCode', _selectedLanguage);
      await prefs.setString('themeMode', _selectedTheme);
    }
    
    // Marcar onboarding como visto
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
    
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = Theme.of(context).colorScheme.primary;
    
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text(
                  'Welcome to BEDIC',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Before you start, choose your language and theme.\nDesigned for tourists and explorers.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 40),
                
                // LANGUAGE SELECTION
                Text(
                  'Language',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                _buildLanguageOption('es', 'Español'),
                const SizedBox(height: 12),
                _buildLanguageOption('en', 'English'),
                
                const SizedBox(height: 40),
                
                // THEME SELECTION
                Text(
                  'Theme',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                _buildThemeOption('light', 'Claro', Icons.light_mode),
                const SizedBox(height: 12),
                _buildThemeOption('dark', 'Oscuro', Icons.dark_mode),
                
                const SizedBox(height: 32),
                
                // SAVE PREFERENCES CHECKBOX
                CheckboxListTile(
                  value: _savePreferences,
                  onChanged: (val) => setState(() => _savePreferences = val ?? false),
                  title: Text(
                    'Save preferences for next login',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                
                const SizedBox(height: 32),
                
                // NEXT BUTTON
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saveAndContinue,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: primary,
                    ),
                    child: Text(
                      'Next',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageOption(String code, String label) {
    return GestureDetector(
      onTap: () => setState(() => _selectedLanguage = code),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: _selectedLanguage == code
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).dividerColor,
            width: _selectedLanguage == code ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Radio<String>(
              value: code,
              groupValue: _selectedLanguage,
              onChanged: (val) => setState(() => _selectedLanguage = val ?? 'es'),
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeOption(String theme, String label, IconData icon) {
    return GestureDetector(
      onTap: () => setState(() => _selectedTheme = theme),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: _selectedTheme == theme
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).dividerColor,
            width: _selectedTheme == theme ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Radio<String>(
              value: theme,
              groupValue: _selectedTheme,
              onChanged: (val) => setState(() => _selectedTheme = val ?? 'dark'),
            ),
            const SizedBox(width: 12),
            Icon(icon, size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
