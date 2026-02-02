import 'package:flutter/foundation.dart';
import '../services/websocket_service.dart';
import '../services/place_service.dart';

class NotificationProvider extends ChangeNotifier {
  late WebSocketService _wsService;
  int _unreadCount = 0;
  List<Map<String, dynamic>> _recentNotifications = [];
  
  int get unreadCount => _unreadCount;
  List<Map<String, dynamic>> get recentNotifications => _recentNotifications;
  bool get hasUnread => _unreadCount > 0;

  void initialize(WebSocketService wsService) {
    _wsService = wsService;
    _wsService.notificationStream.listen((notification) {
      _addNotification(notification);
    });
  }

  void _addNotification(Map<String, dynamic> notification) {
    _unreadCount++;
    _recentNotifications.insert(0, notification);
    
    // Mantener solo las últimas 50 notificaciones en memoria
    if (_recentNotifications.length > 50) {
      _recentNotifications.removeLast();
    }
    
    notifyListeners();
  }

  void markAsRead() {
    _unreadCount = 0;
    notifyListeners();
  }

  void clearNotifications() {
    _recentNotifications.clear();
    _unreadCount = 0;
    notifyListeners();
  }
}
