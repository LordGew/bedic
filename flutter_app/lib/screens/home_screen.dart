import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../app_state.dart';
import '../services/auth_service.dart';
import '../services/websocket_service.dart';
import '../providers/notification_provider.dart';
import '../i18n/localization_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final PageController _controller = PageController();
  int index = 0;
  late AnimationController _bgAnim;

  final List<_OnboardPage> pages = const [
    _OnboardPage(
      Icons.map,
      'home.onboard.map.title',
      'home.onboard.map.desc',
    ),
    _OnboardPage(
      Icons.star,
      'home.onboard.rating.title',
      'home.onboard.rating.desc',
    ),
    _OnboardPage(
      Icons.event,
      'home.onboard.events.title',
      'home.onboard.events.desc',
    ),
    _OnboardPage(
      Icons.auto_awesome,
      'home.onboard.recommendations.title',
      'home.onboard.recommendations.desc',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _bgAnim =
        AnimationController(vsync: this, duration: const Duration(seconds: 6))
          ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _bgAnim.dispose();
    super.dispose();
  }

  void _next() {
    if (index < pages.length - 1) {
      _controller.nextPage(
          duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
    } else {
      _completeAndGoToLogin();
    }
  }

  void _completeAndGoToLogin() {
    Provider.of<AppState>(context, listen: false).completeSetup();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _initializeWebSocket() {
    final auth = Provider.of<AuthService>(context, listen: false);
    final notificationProvider = Provider.of<NotificationProvider>(context, listen: false);
    
    if (auth.currentUser != null && auth.token != null) {
      final wsService = WebSocketService(
        serverUrl: 'http://localhost:5000',
        token: auth.token!,
        userId: auth.currentUser!.id,
      );
      wsService.connect();
      notificationProvider.initialize(wsService);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final neon = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;
    final bgGradientColors = isDark
        ? [
            neon.withOpacity(0.2),
            Colors.black,
            neon.withOpacity(0.2),
          ]
        : [
            theme.colorScheme.background,
            theme.colorScheme.surface,
            theme.colorScheme.background,
          ];
    return AnimatedBuilder(
      animation: _bgAnim,
      builder: (_, __) {
        return Scaffold(
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: bgGradientColors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: const [0.0, 0.5, 1.0],
                transform: GradientRotation(_bgAnim.value * 6.28318),
              ),
            ),
            child: PageView.builder(
              controller: _controller,
              physics: const BouncingScrollPhysics(),
              // +1 para la página inicial de configuración (idioma/tema)
              itemCount: pages.length + 1,
              onPageChanged: (i) => setState(() => index = i),
              itemBuilder: (context, i) {
                if (i == 0) {
                  return const _ConfigOnboardPage();
                }
                return pages[i - 1];
              },
            ),
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton(
                    onPressed: _next,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      index == pages.length
                          ? context.tr('home.config.button.start')
                          : context.tr('home.config.button.next'),
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onPrimary,
                      ),
                    ),
                  ),
                  if (index > 0)
                    TextButton(
                      onPressed: _completeAndGoToLogin,
                      child: Text(
                        context.tr('home.config.button.skip'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onBackground.withOpacity(0.7),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ConfigOnboardPage extends StatefulWidget {
  const _ConfigOnboardPage({super.key});

  @override
  State<_ConfigOnboardPage> createState() => _ConfigOnboardPageState();
}

class _ConfigOnboardPageState extends State<_ConfigOnboardPage> {
  late String _selectedLanguage;
  late String _selectedTheme;
  bool _savePreferences = false;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    _selectedLanguage = appState.locale.languageCode;
    _selectedTheme = appState.themeMode == ThemeMode.dark ? 'dark' : 'light';
  }

  Future<void> _applyPreferences() async {
    final appState = Provider.of<AppState>(context, listen: false);
    final auth = Provider.of<AuthService>(context, listen: false);
    final prefs = await SharedPreferences.getInstance();

    // Cambiar idioma
    await appState.setLanguage(_selectedLanguage);

    // Cambiar tema
    final themeMode = _selectedTheme == 'light' ? ThemeMode.light : ThemeMode.dark;
    await appState.setTheme(themeMode);

    // Guardar preferencias si está marcado
    if (_savePreferences) {
      await prefs.setString('languageCode', _selectedLanguage);
      await prefs.setString('themeMode', _selectedTheme);
      await prefs.setBool('preferencesSet', true);
    }

    // Actualizar en backend si está autenticado
    if (auth.isAuthenticated) {
      try {
        await auth.updatePreferences();
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bgGradientColors = isDark
        ? const [Color(0xFF0A0A0A), Color(0xFF1C1F24)]
        : [
            theme.colorScheme.background,
            theme.colorScheme.surface,
          ];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: bgGradientColors,
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              Text(
                context.tr('home.config.title'),
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: theme.colorScheme.onBackground,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                context.tr('home.config.subtitle'),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onBackground.withOpacity(0.75),
                ),
              ),
              const SizedBox(height: 32),

              // IDIOMA
              Text(
                context.tr('home.config.language'),
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.onBackground,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.dividerColor.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  children: [
                    RadioListTile<String>(
                      title: Text(
                        'Español',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      value: 'es',
                      groupValue: _selectedLanguage,
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _selectedLanguage = v);
                          _applyPreferences();
                        }
                      },
                    ),
                    Divider(height: 1, color: theme.dividerColor.withOpacity(0.1)),
                    RadioListTile<String>(
                      title: Text(
                        'English',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      value: 'en',
                      groupValue: _selectedLanguage,
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _selectedLanguage = v);
                          _applyPreferences();
                        }
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // TEMA
              Text(
                context.tr('home.config.theme'),
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.onBackground,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.dividerColor.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  children: [
                    RadioListTile<String>(
                      title: Text(
                        context.tr('home.config.theme_light'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      value: 'light',
                      groupValue: _selectedTheme,
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _selectedTheme = v);
                          _applyPreferences();
                        }
                      },
                    ),
                    Divider(height: 1, color: theme.dividerColor.withOpacity(0.1)),
                    RadioListTile<String>(
                      title: Text(
                        context.tr('home.config.theme_dark'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      value: 'dark',
                      groupValue: _selectedTheme,
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _selectedTheme = v);
                          _applyPreferences();
                        }
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // GUARDAR PREFERENCIAS
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                  ),
                ),
                child: CheckboxListTile(
                  title: Text(
                    context.tr('home.config.save_preferences'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    context.tr('home.config.save_preferences_desc'),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                  value: _savePreferences,
                  onChanged: (v) {
                    setState(() => _savePreferences = v ?? false);
                  },
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardPage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;

  const _OnboardPage(this.icon, this.title, this.desc, {super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final neon = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;

    final bgGradientColors = isDark
        ? const [Color(0xFF0A0A0A), Color(0xFF1C1F24)]
        : [
            theme.colorScheme.background,
            theme.colorScheme.surface,
          ];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: bgGradientColors,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Brillo neón controlado
          Align(
            alignment: Alignment.center,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: neon.withOpacity(0.18),
                    blurRadius: 80,
                    spreadRadius: 25,
                  ),
                ],
              ),
            ),
          ),
          // Capa de oscurecimiento para contraste solo en tema oscuro
          if (isDark) Container(color: Colors.black.withOpacity(0.25)),
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 120, color: neon.withOpacity(0.9)),
                const SizedBox(height: 40),
                Text(
                  context.tr(title),
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onBackground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  context.tr(desc),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color:
                        theme.colorScheme.onBackground.withOpacity(isDark ? 0.75 : 0.8),
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
