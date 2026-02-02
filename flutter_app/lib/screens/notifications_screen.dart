import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';
import 'place_detail_screen.dart';
import 'events_screen.dart';

class Notification {
  final String id;
  final String type;
  final String title;
  final String message;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  bool read;

  Notification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.data,
    required this.createdAt,
    this.read = false,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'general',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      data: json['data'] ?? {},
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      read: json['read'] ?? false,
    );
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<Notification>> _notificationsFuture;
  List<Notification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  String _getNotificationTitle(String type) {
    switch (type) {
      case 'recommendation':
        return '🎯 Recomendación';
      case 'place_new':
        return '🏪 Nuevo lugar';
      case 'comment_new':
        return '💬 Nuevo comentario';
      case 'comment_reply':
        return '↩️ Respuesta a comentario';
      case 'comment_liked':
        return '👍 Like en comentario';
      case 'comment_disliked':
        return '👎 Dislike en comentario';
      case 'event_rsvp':
        return '📅 Respuesta a evento';
      default:
        return '🔔 Notificación';
    }
  }

  String _getNotificationMessage(Notification notification) {
    final data = notification.data;
    final userName = data['userName'] ?? 'Usuario';
    final placeName = data['placeName'] ?? 'lugar';
    final eventName = data['eventName'] ?? 'evento';
    final response = data['response'] ?? '';

    switch (notification.type) {
      case 'comment_new':
        return '$userName ha comentado en $placeName';
      case 'comment_reply':
        return '$userName respondió tu comentario en $placeName';
      case 'comment_liked':
        return '$userName le dio like a tu comentario en $placeName';
      case 'comment_disliked':
        return '$userName le dio dislike a tu comentario en $placeName';
      case 'event_rsvp':
        final responseText = response == 'interested' 
            ? 'está interesado' 
            : response == 'going' 
            ? 'va a asistir'
            : 'no puede asistir';
        return '$userName $responseText a tu evento "$eventName"';
      case 'recommendation':
        return 'Te recomendamos $placeName basado en tus búsquedas';
      case 'place_new':
        return 'Se agregó un nuevo lugar: $placeName';
      default:
        return notification.message;
    }
  }

  void _loadNotifications() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    _notificationsFuture = _fetchNotifications(placeService);
  }

  Future<List<Notification>> _fetchNotifications(PlaceService placeService) async {
    try {
      final response = await placeService.getNotifications();
      if (response is List) {
        return response
            .map((n) => Notification.fromJson(n as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  Future<void> _markAsRead(Notification notification) async {
    try {
      final placeService = Provider.of<PlaceService>(context, listen: false);
      await placeService.markNotificationAsRead(notification.id);
      setState(() {
        notification.read = true;
      });
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  void _handleNotificationTap(Notification notification) async {
    await _markAsRead(notification);
    
    if (!mounted) return;
    
    try {
      switch (notification.type) {
        case 'comment_new':
        case 'comment_reply':
        case 'comment_liked':
        case 'comment_disliked':
        case 'recommendation':
        case 'place_new':
          if (mounted) {
            Navigator.pop(context);
          }
          break;
        case 'event_rsvp':
          if (mounted) {
            Navigator.pop(context);
          }
          break;
      }
    } catch (e) {
      print('Error al navegar desde notificación: $e');
      if (mounted) {
        Navigator.pop(context);
      }
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('notifications.title')),
        elevation: 0,
        backgroundColor: theme.scaffoldBackgroundColor,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      body: FutureBuilder<List<Notification>>(
        future: _notificationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text('Error: ${snapshot.error}'),
            );
          }

          final notifications = snapshot.data ?? [];
          final allNotifications = [..._notifications, ...notifications];
          allNotifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));

          if (allNotifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: theme.colorScheme.onSurface.withOpacity(0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('notifications.empty'),
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: allNotifications.length,
            itemBuilder: (context, index) {
              final notification = allNotifications[index];
              return _buildNotificationTile(notification, theme);
            },
          );
        },
      ),
    );
  }

  Widget _buildNotificationTile(Notification notification, ThemeData theme) {
    final dynamicMessage = _getNotificationMessage(notification);
    
    return Material(
      color: notification.read
          ? theme.scaffoldBackgroundColor
          : theme.colorScheme.surface,
      child: InkWell(
        onTap: () => _handleNotificationTap(notification),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.only(top: 6, right: 12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: notification.read
                      ? Colors.transparent
                      : theme.colorScheme.primary,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dynamicMessage,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatTime(notification.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Hace unos segundos';
    } else if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} minuto(s)';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} hora(s)';
    } else if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} día(s)';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
