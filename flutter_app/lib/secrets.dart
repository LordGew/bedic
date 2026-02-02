import 'package:flutter/foundation.dart' show kIsWeb;

const String GOOGLE_MAPS_API_KEY = "AIzaSyAYZugW4Z2XcNLsEu2WnCIyUWVdc-0dJgM";

// La API de tu backend Node.js siempre escucha en el puerto 5000.
// Corregimos la lógica para que el puerto 54400 (puerto del frontend) no se use para el backend.
final String API_BASE_URL = kIsWeb
  // 1. En Web, usa localhost:5000 para llegar al backend que corre en el host.
  // Tu server define rutas bajo /api (ej. /api/auth), así que usamos /api aquí.
  ? 'http://localhost:5000/api' 
  // 2. En Android, usa 10.0.2.2:5000.
  : 'http://10.0.2.2:5000/api';

const String FCM_SENDER_ID = "1090040857039";
const String GOOGLE_CLIENT_ID = "1090040857039-1niegdj3vfc2fafvr3mmupgh6ujif9um.apps.googleusercontent.com";