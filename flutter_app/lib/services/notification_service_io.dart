import 'package:firebase_messaging/firebase_messaging.dart'; // Soluciona FirebaseMessaging, RemoteMessage, AuthorizationStatus
import 'package:firebase_core/firebase_core.dart';           // Soluciona Firebase en el background handler
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'auth_service.dart';
import '../secrets.dart';

// Este handler debe estar fuera de cualquier clase para funcionar con FCM
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Inicializar Firebase ES REQUERIDO antes de usar cualquier servicio de Firebase en el fondo.
  await Firebase.initializeApp();
  print("Manejo de mensaje en segundo plano: ${message.messageId}");
}

class NotificationService {
  final AuthService _authService;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  NotificationService(this._authService);

  Future<void> initialize() async {
    // 1. Configurar el handler de segundo plano
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 2. Solicitar permisos
    NotificationSettings settings = await _fcm.requestPermission();

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      _setupForegroundHandler();
      _registerTokenWithBackend();
    }
  }

  // 3. Obtener token y registrar en el backend
  void _registerTokenWithBackend() async {
    if (!_authService.isAuthenticated) return;

    String? token = await _fcm.getToken();
    if (token == null) return;

    final url = Uri.parse('$API_BASE_URL/notifications/token');

    final authResult = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${_authService.token}',
      },
      body: json.encode({
        'deviceToken': token,
        'platform': 'android',
      }),
    );

    if (authResult.statusCode != 200) {
      print("Fallo al registrar token FCM en el backend");
    } else {
      print("Token FCM registrado exitosamente.");
    }
  }

  // 4. Manejar mensajes en primer plano (app abierta)
  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Mensaje recibido en foreground: ${message.notification?.body}');
    });
  }
}
