import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:provider/provider.dart';
import 'dart:async';

class WebSocketService {
  late IO.Socket socket;
  final String serverUrl;
  final String token;
  final String userId;
  
  final StreamController<Map<String, dynamic>> _notificationController = 
    StreamController<Map<String, dynamic>>.broadcast();
  
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  
  bool _isConnected = false;
  bool get isConnected => _isConnected;

  WebSocketService({
    required this.serverUrl,
    required this.token,
    required this.userId,
  });

  Future<void> connect() async {
    try {
      socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({
            'token': token,
            'userId': userId,
          })
          .build(),
      );

      socket.onConnect((_) {
        print('✅ WebSocket conectado');
        _isConnected = true;
      });

      socket.onDisconnect((_) {
        print('❌ WebSocket desconectado');
        _isConnected = false;
      });

      socket.onError((error) {
        print('⚠️ Error WebSocket: $error');
      });

      // Escuchar notificaciones de nuevos lugares sugeridos
      socket.on('recommendation:new', (data) {
        print('📍 Nueva recomendación: $data');
        _notificationController.add({
          'type': 'recommendation',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de nuevos lugares
      socket.on('place:new', (data) {
        print('🏪 Nuevo lugar: $data');
        _notificationController.add({
          'type': 'place_new',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de comentarios
      socket.on('comment:new', (data) {
        print('💬 Nuevo comentario: $data');
        _notificationController.add({
          'type': 'comment_new',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de respuestas a comentarios
      socket.on('comment:reply', (data) {
        print('↩️ Respuesta a comentario: $data');
        _notificationController.add({
          'type': 'comment_reply',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de likes
      socket.on('comment:liked', (data) {
        print('👍 Like en comentario: $data');
        _notificationController.add({
          'type': 'comment_liked',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de dislikes
      socket.on('comment:disliked', (data) {
        print('👎 Dislike en comentario: $data');
        _notificationController.add({
          'type': 'comment_disliked',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones de eventos
      socket.on('event:rsvp', (data) {
        print('📅 Respuesta a evento: $data');
        _notificationController.add({
          'type': 'event_rsvp',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      // Escuchar notificaciones generales
      socket.on('notification:new', (data) {
        print('🔔 Nueva notificación: $data');
        _notificationController.add({
          'type': 'general',
          'data': data,
          'timestamp': DateTime.now(),
        });
      });

      socket.connect();
    } catch (e) {
      print('Error conectando WebSocket: $e');
    }
  }

  void disconnect() {
    if (socket.connected) {
      socket.disconnect();
      _isConnected = false;
    }
  }

  void dispose() {
    disconnect();
    _notificationController.close();
  }
}
