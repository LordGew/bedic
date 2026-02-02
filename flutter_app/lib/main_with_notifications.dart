// Ejemplo de cómo integrar las notificaciones en tiempo real en main.dart
// Agregar esto a tu main.dart existente

import 'package:provider/provider.dart';
import 'services/websocket_service.dart';
import 'services/auth_service.dart';
import 'providers/notification_provider.dart';
import 'screens/notifications_screen.dart';
import 'widgets/notification_badge.dart';

// En la función main(), agregar MultiProvider:
/*
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => PlaceService()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        // ... otros providers
      ],
      child: const MyApp(),
    ),
  );
}
*/

// En el AppBar de tu pantalla principal, agregar el badge de notificaciones:
/*
AppBar(
  title: const Text('BEDIC'),
  actions: [
    NotificationBadge(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const NotificationsScreen(),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Icon(Icons.notifications),
      ),
    ),
    // ... otros actions
  ],
)
*/

// En initState de tu widget principal, inicializar WebSocket:
/*
@override
void initState() {
  super.initState();
  _initializeWebSocket();
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
*/
