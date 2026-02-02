import 'dart:convert';
import 'package:http/http.dart' as http;
import '../secrets.dart';

class Announcement {
  final String id;
  final String title;
  final String message;
  final List<String> categories;
  final bool pinned;
  final DateTime? createdAt;

  Announcement({
    required this.id,
    required this.title,
    required this.message,
    required this.categories,
    required this.pinned,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    final rawCategories = json['categories'] as List<dynamic>?;
    return Announcement(
      id: json['_id']?.toString() ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      categories: rawCategories != null
          ? rawCategories.map((e) => e.toString()).toList()
          : const [],
      pinned: json['pinned'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }
}

class AnnouncementService {
  Future<List<Announcement>> fetchAnnouncements({String? category}) async {
    String url = '$API_BASE_URL/announcements';
    if (category != null && category.isNotEmpty) {
      url += '?category=${Uri.encodeComponent(category)}';
    }

    final resp = await http.get(Uri.parse(url));
    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      final list = (data['data'] as List<dynamic>)
          .map((e) => Announcement.fromJson(
                Map<String, dynamic>.from(e as Map),
              ))
          .toList();
      return list;
    }

    throw Exception(data['message'] ?? 'Error al obtener anuncios');
  }
}
