// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import 'app_state.dart';
import 'themes/app_theme.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/place_service.dart' as place_service;
import 'services/admin_service.dart';
import 'services/network_check.dart';
import 'services/websocket_service.dart';
import 'providers/notification_provider.dart';

import 'screens/login_screen.dart';
import 'screens/map_screen.dart';
import 'screens/home_screen.dart';
import 'screens/setup_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'i18n/localization_service.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configuración robusta de Firebase para producción
  if (!kIsWeb) {
    try {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: "AIzaSyAYZugW4Z2XcNLsEu2WnCIyUWVdc-0dJgM",
          appId: "1:1090040857039:android:1234567890abcdef",
          messagingSenderId: "1090040857039",
          projectId: "bedic-production",
          storageBucket: "bedic-production.appspot.com",
        ),
      );
      print('✅ Firebase inicializado correctamente para producción');
    } catch (e) {
      print('⚠️ Firebase no disponible: $e');
      // La app continúa funcionando sin Firebase
    }
  }

  final apiCheck = await checkApiReachable();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ProxyProvider<AuthService, place_service.PlaceService>(
          update: (_, auth, __) => place_service.PlaceService(auth),
        ),
        ProxyProvider<AuthService, NotificationService>(
          update: (_, auth, __) => NotificationService(auth),
        ),
        ProxyProvider<AuthService, AdminService>(
          update: (_, auth, __) => AdminService(auth),
        ),
      ],
      child: MyApp(
        apiOk: apiCheck.ok,
        apiMessage: apiCheck.ok
            ? null
            : "API no disponible (status: ${apiCheck.statusCode})",
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  final bool apiOk;
  final String? apiMessage;

  const MyApp({super.key, required this.apiOk, this.apiMessage});

  Widget _initialScreen(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthService>(context);

    if (appState.isFirstTime) return const HomeScreen();
    if (auth.isAuthenticated) {
      Provider.of<NotificationService>(context, listen: false).initialize();
      return const MapScreen();
    }
    return const LoginScreen();
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      title: "BEDIC",

      // 🌍 Localización
      locale: appState.locale,
      supportedLocales: const [Locale('en'), Locale('es')],
      localizationsDelegates: const [
        appLocalizationsDelegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // 🎨 Tema global con color seleccionable
      theme: AppTheme.light(const Color(0xFF9B59B6)),
      darkTheme: AppTheme.dark(const Color(0xFF9B59B6)),
      themeMode: appState.themeMode == ThemeMode.system ? ThemeMode.dark : appState.themeMode,

      // 🌐 Rutas nombradas (sin ruta '/' para evitar conflicto con home)
      routes: {
        '/map': (_) => const MapScreen(),
        '/setup': (_) => const SetupScreen(),
        '/admin-dashboard': (_) => const AdminDashboardScreen(),
      },
      home: apiOk
          ? _initialScreen(context)
          : Scaffold(
              backgroundColor: const Color(0xFF0D0F12),
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.cloud_off,
                          size: 80, color: appState.corporateColor),
                      const SizedBox(height: 20),
                      Text(
                        "Sin conexión al servidor",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: appState.corporateColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        apiMessage ?? "Verifica que el backend esté activo",
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => main(),
                        child: const Text("Reintentar"),
                      )
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
