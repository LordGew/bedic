// lib/services/place_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import '../secrets.dart';

String? _buildMediaUrlOrNull(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  if (raw.startsWith('http')) return raw;
  final baseWithoutApi = API_BASE_URL.replaceFirst('/api', '');
  if (raw.startsWith('/')) return '$baseWithoutApi$raw';
  return '$baseWithoutApi/$raw';
}

List<String> _buildMediaUrlList(List<String> rawList) {
  return rawList
      .map((u) => _buildMediaUrlOrNull(u) ?? '')
      .where((u) => u.isNotEmpty)
      .toList();
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Reportes
/// ─────────────────────────────────────────────────────────────────────────

int _asInt(dynamic value, [int defaultValue = 0]) {
  if (value is int) return value;
  if (value is String) return int.tryParse(value) ?? defaultValue;
  return defaultValue;
}

class Report {
  final String id;
  final String placeId;
  final String type;
  final String description;
  final String? photoUrl;
  final bool verified;
  final bool isModerated;

  final String username;
  final String? userId;
  final String? userLevel;
  final List<String> userBadges;
  final String? userRole;
  final String? userRoleColor;
  final String? userAvatarUrl;

  final int upvotes;
  final int downvotes;
  final DateTime? createdAt;
  final int commentsCount;

  Report({
    required this.id,
    required this.placeId,
    required this.type,
    required this.description,
    this.photoUrl,
    this.verified = false,
    this.isModerated = false,
    required this.username,
    this.userId,
    this.userLevel,
    this.userBadges = const [],
    this.userRole,
    this.userRoleColor,
    this.userAvatarUrl,
    this.upvotes = 0,
    this.downvotes = 0,
    this.createdAt,
    this.commentsCount = 0,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    final dynamic rawUser = json['user'];
    Map<String, dynamic> user = const {};
    String? userId;

    if (rawUser is Map<String, dynamic>) {
      user = rawUser;
      userId = rawUser['_id']?.toString();
    } else if (rawUser != null) {
      // Puede venir solo como ObjectId/string
      userId = rawUser.toString();
    }

    final dynamic rawAvatar = user['avatar_url'];
    final normalizedAvatar = _buildMediaUrlOrNull(
      rawAvatar is String ? rawAvatar : rawAvatar?.toString(),
    );
    final rawPhoto = json['photo_url'] as String?;
    final normalizedPhoto = _buildMediaUrlOrNull(rawPhoto);
    final upvotesRaw = json['upvotesCount'] ??
        (json['upvotes'] is List ? (json['upvotes'] as List).length : 0);
    final downvotesRaw = json['downvotesCount'] ??
        (json['downvotes'] is List ? (json['downvotes'] as List).length : 0);
    return Report(
      id: json['_id'] ?? '',
      placeId: json['place']?.toString() ?? '',
      type: json['type'] ?? '',
      description: json['description'] ?? '',
      photoUrl: normalizedPhoto,
      username: user['username'] ?? 'Anónimo',
      userId: userId,
      userLevel: user['current_level'],
      userBadges: List<String>.from(user['badges'] ?? const []),
      userRole: user['role'],
      userRoleColor: user['corporate_color'],
      userAvatarUrl: normalizedAvatar,
      upvotes: _asInt(upvotesRaw, 0),
      downvotes: _asInt(downvotesRaw, 0),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      commentsCount: _asInt(json['commentsCount'], 0),
      verified: json['verified'] == true,
      isModerated: json['is_moderated'] == true,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Comentarios de Calificaciones
/// ─────────────────────────────────────────────────────────────────────────

class RatingComment {
  final String id;
  final String ratingId;
  final String text;
  final String username;
  final String? userId;
  final DateTime? createdAt;
  final bool hidden;
  final bool censored;

  RatingComment({
    required this.id,
    required this.ratingId,
    required this.text,
    required this.username,
    this.userId,
    this.createdAt,
    this.hidden = false,
    this.censored = false,
  });

  factory RatingComment.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    return RatingComment(
      id: json['_id'] ?? '',
      ratingId: json['rating']?.toString() ?? '',
      text: json['text'] ?? '',
      username: user['username'] ?? 'Anónimo',
      userId: user['_id']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      hidden: json['hidden'] == true,
      censored: json['censored'] == true,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Comentarios de Reportes
/// ─────────────────────────────────────────────────────────────────────────

class ReportComment {
  final String id;
  final String reportId;
  final String text;
  final String username;
  final String? userId;
  final DateTime? createdAt;
  final String? parentCommentId;
  final int upvotes;
  final int downvotes;
  final String? userAvatarUrl;
  final bool hidden;
  final bool censored;

  ReportComment({
    required this.id,
    required this.reportId,
    required this.text,
    required this.username,
    this.userId,
    this.createdAt,
    this.parentCommentId,
    this.upvotes = 0,
    this.downvotes = 0,
    this.userAvatarUrl,
    this.hidden = false,
    this.censored = false,
  });

  factory ReportComment.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    final dynamic avatarRaw = user['avatar_url'];
    final avatarUrl = _buildMediaUrlOrNull(
      avatarRaw is String ? avatarRaw : avatarRaw?.toString(),
    );
    final upvotesList = (json['upvotes'] as List<dynamic>?) ?? const [];
    final downvotesList = (json['downvotes'] as List<dynamic>?) ?? const [];
    return ReportComment(
      id: json['_id'] ?? '',
      reportId: json['report']?.toString() ?? '',
      text: json['text'] ?? '',
      username: user['username'] ?? 'Anónimo',
      userId: user['_id']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      parentCommentId: json['parentComment']?.toString(),
      upvotes:
          _asInt(json['upvotesCount'] ?? upvotesList.length, upvotesList.length),
      downvotes: _asInt(
          json['downvotesCount'] ?? downvotesList.length, downvotesList.length),
      userAvatarUrl: avatarUrl,
      hidden: json['hidden'] == true,
      censored: json['censored'] == true,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Ratings
/// ─────────────────────────────────────────────────────────────────────────

class PlaceRating {
  final String id;
  final String placeId;
  final double score;
  final String comment;

  final String username;
  final String? userId;
  final String? userRole;
  final String? userLevel;
  final List<String> userBadges;
  final String? userRoleColor;
  final int reputationScore;
  final String? userAvatarUrl;

  final int upvotes;
  final int downvotes;
  final DateTime? createdAt;

  PlaceRating({
    required this.id,
    required this.placeId,
    required this.score,
    required this.comment,
    required this.username,
    this.userId,
    this.userRole,
    this.userLevel,
    this.userBadges = const [],
    this.userRoleColor,
    this.reputationScore = 0,
    this.userAvatarUrl,
    this.upvotes = 0,
    this.downvotes = 0,
    this.createdAt,
  });

  factory PlaceRating.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    final dynamic rawAvatar = user['avatar_url'];
    final normalizedAvatar = _buildMediaUrlOrNull(
      rawAvatar is String ? rawAvatar : rawAvatar?.toString(),
    );
    return PlaceRating(
      id: json['_id'] ?? '',
      placeId: json['place']?.toString() ?? '',
      score: (json['score'] ?? 0).toDouble(),
      comment: json['comment'] ?? '',
      username: user['username'] ?? 'Anónimo',
      userId: user['_id']?.toString(),
      userRole: user['role'],
      userLevel: user['current_level'],
      userBadges: List<String>.from(user['badges'] ?? const []),
      userRoleColor: user['corporate_color'],
      reputationScore: (user['reputation_score'] ?? 0).toInt(),
      userAvatarUrl: normalizedAvatar,
      upvotes: (json['upvotes'] is List) ? json['upvotes'].length : 0,
      downvotes: (json['downvotes'] is List) ? json['downvotes'].length : 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Place
/// ─────────────────────────────────────────────────────────────────────────

class Place {
  final String id;
  final String name;
  final double rating;
  final String category;
  final double latitude;
  final double longitude;
  final List<String> officialImages;
  final bool verified;

  Place({
    required this.id,
    required this.name,
    required this.rating,
    required this.category,
    required this.latitude,
    required this.longitude,
    required this.officialImages,
    this.verified = false,
  });

  factory Place.fromJson(Map<String, dynamic> json) {
    final imgsRaw = List<String>.from(json['officialImages'] ?? []);
    final normalizedImages = _buildMediaUrlList(imgsRaw);

    return Place(
      id: json['_id'],
      name: json['name'],
      rating: (json['rating'] ?? 0).toDouble(),
      category: json['category'],
      latitude: (json['coordinates']?['coordinates']?[1] ?? 0).toDouble(),
      longitude: (json['coordinates']?['coordinates']?[0] ?? 0).toDouble(),
      officialImages: normalizedImages,
      verified: json['verified'] == true,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Eventos de lugar
/// ─────────────────────────────────────────────────────────────────────────

class PlaceEvent {
  final String id;
  final String placeId;
  final String title;
  final String description;
  final DateTime? date;
  final String username;
  final String? userId;
  final int interestedCount;
  final int notInterestedCount;
  final int maybeCount;
  final int goingCount;

  PlaceEvent({
    required this.id,
    required this.placeId,
    required this.title,
    required this.description,
    required this.date,
    required this.username,
    this.userId,
    this.interestedCount = 0,
    this.notInterestedCount = 0,
    this.maybeCount = 0,
    this.goingCount = 0,
  });

  factory PlaceEvent.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    final participants = (json['participants'] as List<dynamic>?) ?? const [];
    int interested = 0;
    int notInterested = 0;
    int maybe = 0;
    int going = 0;

    for (final p in participants) {
      if (p is Map<String, dynamic>) {
        final status = (p['status'] ?? '').toString();
        if (status == 'interested') interested++;
        if (status == 'not_interested') notInterested++;
        if (status == 'maybe') maybe++;
        if (status == 'going') going++;
      }
    }
    return PlaceEvent(
      id: json['_id'] ?? '',
      placeId: json['place']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      date: json['date'] != null
          ? DateTime.tryParse(json['date'])
          : null,
      username: user['username'] ?? 'Anónimo',
      userId: user['_id']?.toString(),
      interestedCount: interested,
      notInterestedCount: notInterested,
      maybeCount: maybe,
      goingCount: going,
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// MODELO: Recomendaciones
/// ─────────────────────────────────────────────────────────────────────────

class UserRecommendations {
  final List<String> preferredCategories;
  final double avgDistance;
  final String? activeTime;

  UserRecommendations({
    required this.preferredCategories,
    required this.avgDistance,
    this.activeTime,
  });

  factory UserRecommendations.fromJson(Map<String, dynamic> json) {
    return UserRecommendations(
      preferredCategories:
          List<String>.from(json['preferredCategories'] ?? const []),
      avgDistance: (json['avgDistance'] ?? 1000).toDouble(),
      activeTime: json['activeTime'],
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// SERVICIO PRINCIPAL
/// ─────────────────────────────────────────────────────────────────────────

class PlaceService {
  final AuthService _auth;

  PlaceService(this._auth);

  Map<String, String> _headersJson({bool withAuth = true}) => {
        'Content-Type': 'application/json',
        if (withAuth && _auth.token != null)
          'Authorization': 'Bearer ${_auth.token}',
      };

  // ========================================================================
  //  BUSCAR LUGARES
  // ========================================================================

  Future<List<Place>> searchPlaces({
    required double lat,
    required double lon,
    String? keyword,
    List<String>? categories,
    int radius = 10000,
  }) async {
    String url =
        '$API_BASE_URL/places/search?lat=$lat&lon=$lon&radius=$radius';

    if (keyword != null && keyword.isNotEmpty) {
      url += '&q=${Uri.encodeComponent(keyword)}';
    }
    if (categories != null && categories.isNotEmpty) {
      url += '&category=${categories.join(',')}';
    }

    final resp = await http.get(Uri.parse(url), headers: _headersJson());
    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      return List<Place>.from(data['data'].map((p) => Place.fromJson(p)));
    }

    throw Exception(data['message'] ?? "Error al buscar lugares");
  }

  // ========================================================================
  //  DETALLES DEL LUGAR
  // ========================================================================

  Future<Map<String, dynamic>> getPlaceDetails(String placeId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/places/$placeId'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      return data['data']; 
    }

    throw Exception(data['message'] ?? "Error al cargar detalles");
  }

  /// Obtiene solo el objeto Place por ID (usado para refrescar imágenes oficiales)
  Future<Place> fetchPlaceById(String placeId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/places/$placeId'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      final placeJson = Map<String, dynamic>.from(
        data['data']?['placeDetails'] ?? data['data'],
      );
      return Place.fromJson(placeJson);
    }

    throw Exception(data['message'] ?? 'Error al cargar lugar');
  }

  // ========================================================================
  //  LUGARES FAVORITOS / GUARDADOS
  // ========================================================================

  Future<List<Place>> getFavoritePlaces() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para ver lugares guardados.');
    }

    final resp = await http.get(
      Uri.parse('$API_BASE_URL/auth/favorites'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      final rawList = List<Map<String, dynamic>>.from(data['data'] ?? []);
      final places = rawList.map(Place.fromJson).toList();
      final ids = places.map((p) => p.id).toList();
      _auth.updateFavoritePlaces(ids);
      return places;
    }

    throw Exception(data['message'] ?? 'Error al cargar lugares guardados');
  }

  Future<void> addPlaceToFavorites(String placeId) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para guardar lugares.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/auth/favorites/$placeId'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      final raw = data['data'] ?? [];
      final ids = List<String>.from(
        (raw as List).map((e) => e.toString()),
      );
      _auth.updateFavoritePlaces(ids);
      return;
    }

    throw Exception(data['message'] ?? 'Error al guardar lugar en favoritos');
  }

  Future<void> removePlaceFromFavorites(String placeId) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para guardar lugares.');
    }

    final resp = await http.delete(
      Uri.parse('$API_BASE_URL/auth/favorites/$placeId'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      final raw = data['data'] ?? [];
      final ids = List<String>.from(
        (raw as List).map((e) => e.toString()),
      );
      _auth.updateFavoritePlaces(ids);
      return;
    }

    throw Exception(data['message'] ?? 'Error al quitar lugar de favoritos');
  }

  // ========================================================================
  //  EVENTOS
  // ========================================================================

  Future<List<PlaceEvent>> getEventsForPlace(String placeId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/events/$placeId'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List)
          .map((e) => PlaceEvent.fromJson(e))
          .toList();
    }

    throw Exception(data['message'] ?? 'Error al cargar eventos');
  }

  Future<void> createEventForPlace({
    required String placeId,
    required String title,
    required String description,
    required DateTime date,
    XFile? imageFile,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para crear eventos.');
    }

    final uri = Uri.parse('$API_BASE_URL/events');
    final request = http.MultipartRequest('POST', uri);
    
    // Agregar headers (sin Content-Type, MultipartRequest lo establece automáticamente)
    if (_auth.token != null) {
      request.headers['Authorization'] = 'Bearer ${_auth.token}';
    }
    
    // Agregar campos del formulario
    request.fields['place'] = placeId;
    request.fields['title'] = title;
    request.fields['description'] = description;
    request.fields['date'] = date.toIso8601String();
    
    print('Enviando solicitud a: $uri');
    print('Headers: ${request.headers}');
    print('Fields: ${request.fields}');
    
    // Agregar imagen si existe
    if (imageFile != null) {
      if (kIsWeb) {
        // Para Web: leer bytes directamente
        final bytes = await imageFile.readAsBytes();
        final multipartFile = http.MultipartFile.fromBytes(
          'image',
          bytes,
          filename: imageFile.name,
        );
        request.files.add(multipartFile);
        print('Imagen agregada (Web): ${imageFile.name}, tamaño: ${bytes.length}');
      } else {
        // Para Mobile/Desktop: usar el archivo local
        final file = File(imageFile.path);
        if (await file.exists()) {
          final stream = file.openRead();
          final length = await file.length();
          final multipartFile = http.MultipartFile(
            'image',
            stream,
            length,
            filename: imageFile.name,
          );
          request.files.add(multipartFile);
          print('Imagen agregada (Mobile): ${imageFile.path}, tamaño: $length');
        }
      }
    }

    print('Enviando solicitud...');
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    print('Respuesta recibida: ${response.statusCode}');
    print('Body: ${response.body}');

    final data = json.decode(response.body);
    if (response.statusCode < 200 ||
        response.statusCode > 299 ||
        data['success'] != true) {
      throw Exception(data['message'] ?? 'Error al crear evento');
    }
  }

  Future<void> respondToEvent({
    required String eventId,
    required String status,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para responder a eventos.');
    }

    final resp = await http.put(
      Uri.parse('$API_BASE_URL/events/$eventId/rsvp'),
      headers: _headersJson(),
      body: json.encode({'status': status}),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode < 200 ||
        resp.statusCode > 299 ||
        data['success'] != true) {
      throw Exception(data['message'] ?? 'Error al registrar respuesta al evento');
    }
  }

  // ========================================================================
  //  FOTOS OFICIALES DE LUGAR (ADMIN)
  // ========================================================================

  Future<void> uploadOfficialPlacePhoto({
    required String placeId,
    required Uint8List bytes,
    required String filename,
  }) async {
    if (!_auth.isAuthenticated || _auth.token == null) {
      throw Exception('Debe iniciar sesión como admin/mod para subir fotos.');
    }

    final uri = Uri.parse('$API_BASE_URL/admin/places/$placeId/photos');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer ${_auth.token}';

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      ),
    );

    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
        'Error al subir foto del lugar (HTTP ${resp.statusCode}). Respuesta no válida del servidor.',
      );
    }

    if (resp.statusCode < 200 || resp.statusCode >= 300 || data['success'] != true) {
      throw Exception(data['message'] ?? 'No se pudo subir la foto del lugar');
    }
  }

  // ========================================================================
  //  REPORTES
  // ========================================================================

  Future<List<Report>> getReportsForPlace(String placeId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/reports/place/$placeId'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List).map((e) => Report.fromJson(e)).toList();
    }

    throw Exception(data['message'] ?? "Error al cargar reportes del lugar");
  }

  /// 🔵 NUEVO — Obtener reportes hechos por un usuario (para PublicProfile)
  Future<List<Report>> getReportsByUser(String userId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/reports/user/$userId'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List).map((e) => Report.fromJson(e)).toList();
    }

    throw Exception(data['message'] ?? "Error al cargar reportes del usuario");
  }

  /// Comentarios de reportes
  Future<List<ReportComment>> getCommentsForReport(
    String reportId, {
    String sort = 'newest',
  }) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/reports/$reportId/comments?sort=$sort'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List)
          .map((e) => ReportComment.fromJson(e))
          .toList();
    }

    throw Exception(
        data['message'] ?? 'Error al cargar comentarios del reporte');
  }

  Future<void> addCommentToReport({
    required String reportId,
    required String text,
    String? parentCommentId,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para comentar.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/reports/$reportId/comments'),
      headers: _headersJson(),
      body: json.encode({
        'text': text,
        if (parentCommentId != null) 'parentCommentId': parentCommentId,
      }),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode < 200 || resp.statusCode > 299 || data['success'] != true) {
      throw Exception(data['message'] ?? 'Error al agregar comentario');
    }
  }

  Future<RatingComment> moderateRatingComment({
    required String commentId,
    required String action,
  }) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/rating-comments/$commentId'),
      headers: _headersJson(),
      body: json.encode({'action': action}),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return RatingComment.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'Error al moderar comentario de calificación');
  }

  Future<void> submitReport({
    required String placeId,
    required String type,
    required String description,
    String? photoUrl,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception("Debe iniciar sesión para reportar.");
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/reports'),
      headers: _headersJson(),
      body: json.encode({
        "place": placeId,
        "type": type,
        "description": description,
        "photo_url": photoUrl,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    // Errores de moderación (400/403) devuelven { error, reason, strikes }
    if (resp.statusCode == 400 || resp.statusCode == 403) {
      final msg = data != null
          ? (data['error'] ?? data['message'] ?? 'Contenido rechazado por moderación')
          : 'Contenido rechazado por moderación (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    if (resp.statusCode != 201 || data == null || data['success'] != true) {
      throw Exception(data?['message'] ?? "Error al enviar reporte");
    }
  }

  Future<void> reportUser({
    required String targetUserId,
    required String reason,
    required String description,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para reportar.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/reports'),
      headers: _headersJson(),
      body: json.encode({
        'contentType': 'USER',
        'contentId': targetUserId,
        'reason': reason,
        'description': description,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (resp.statusCode == 400 || resp.statusCode == 403) {
      final msg = data != null
          ? (data['error'] ?? data['message'] ?? 'Contenido rechazado por moderación')
          : 'Contenido rechazado por moderación (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    if (resp.statusCode != 201 || data == null || data['success'] != true) {
      throw Exception(data?['message'] ?? 'Error al enviar reporte');
    }
  }

  Future<void> reportRating({
    required String ratingId,
    required String reason,
    required String description,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para reportar.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/reports'),
      headers: _headersJson(),
      body: json.encode({
        'contentType': 'REVIEW',
        'contentId': ratingId,
        'reason': reason,
        'description': description,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (resp.statusCode == 400 || resp.statusCode == 403) {
      final msg = data != null
          ? (data['error'] ?? data['message'] ?? 'Contenido rechazado por moderación')
          : 'Contenido rechazado por moderación (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    if (resp.statusCode != 201 || data == null || data['success'] != true) {
      throw Exception(data?['message'] ?? 'Error al enviar reporte');
    }
  }

  Future<void> reportComment({
    required String commentId,
    required String reason,
    required String description,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para reportar.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/reports'),
      headers: _headersJson(),
      body: json.encode({
        'contentType': 'COMMENT',
        'contentId': commentId,
        'reason': reason,
        'description': description,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (resp.statusCode == 400 || resp.statusCode == 403) {
      final msg = data != null
          ? (data['error'] ?? data['message'] ?? 'Contenido rechazado por moderación')
          : 'Contenido rechazado por moderación (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    if (resp.statusCode != 201 || data == null || data['success'] != true) {
      throw Exception(data?['message'] ?? 'Error al enviar reporte');
    }
  }

  /// Sube una foto de reporte. El backend aplica la marca de agua.
  /// Devuelve la URL relativa (por ejemplo `/uploads/reports/....png`).
  Future<String> uploadReportPhoto({
    required Uint8List bytes,
    required String filename,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para subir fotos');
    }

    final uri = Uri.parse('$API_BASE_URL/reports/upload-photo');
    final request = http.MultipartRequest('POST', uri);
    if (_auth.token != null) {
      request.headers['Authorization'] = 'Bearer ${_auth.token}';
    }

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      ),
    );

    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);
    final data = json.decode(resp.body);

    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return (data['data']?['url'] as String?) ?? '';
    }
    throw Exception(data['message'] ?? 'No se pudo subir la foto del reporte');
  }

  Future<Report> upvoteReport(String reportId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/reports/$reportId/upvote'),
      headers: _headersJson(),
    );
    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return Report.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? "Error al votar (upvote)");
  }

  Future<Report> downvoteReport(String reportId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/reports/$reportId/downvote'),
      headers: _headersJson(),
    );
    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return Report.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? "Error al votar (downvote)");
  }

  Future<ReportComment> upvoteReportComment(String commentId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/reports/comments/$commentId/upvote'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return ReportComment.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'Error al votar comentario');
  }

  Future<ReportComment> moderateReportComment({
    required String commentId,
    required String action,
  }) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/report-comments/$commentId'),
      headers: _headersJson(),
      body: json.encode({'action': action}),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return ReportComment.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'Error al moderar comentario de reporte');
  }

  Future<ReportComment> downvoteReportComment(String commentId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/reports/comments/$commentId/downvote'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return ReportComment.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'Error al votar comentario');
  }

  // ========================================================================
  //  RATINGS
  // ========================================================================

  Future<void> submitRating({
    required String placeId,
    required double score,
    String? comment,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception("Debe iniciar sesión para calificar.");
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/ratings'),
      headers: _headersJson(),
      body: json.encode({
        "placeId": placeId,
        "score": score,
        "comment": comment ?? "",
      }),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode < 200 || resp.statusCode > 299 || data['success'] != true) {
      throw Exception(data['message'] ?? "Error al enviar calificación");
    }
  }

  Future<List<PlaceRating>> getRatingsForPlace(String placeId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/ratings/$placeId'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List)
          .map((e) => PlaceRating.fromJson(e))
          .toList();
    }

    throw Exception(data['message'] ?? "Error al cargar calificaciones del lugar");
  }

  /// 🔵 NUEVO — Obtener ratings hechos por un usuario
  Future<List<PlaceRating>> getRatingsByUser(String userId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/ratings/user/$userId'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List)
          .map((e) => PlaceRating.fromJson(e))
          .toList();
    }

    throw Exception(data['message'] ?? "Error al cargar ratings del usuario");
  }

  /// Comentarios de calificaciones
  Future<List<RatingComment>> getCommentsForRating(String ratingId) async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/ratings/$ratingId/comments'),
      headers: _headersJson(withAuth: false),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return (data['data'] as List)
          .map((e) => RatingComment.fromJson(e))
          .toList();
    }

    throw Exception(
        data['message'] ?? 'Error al cargar comentarios de la calificación');
  }

  Future<void> addCommentToRating({
    required String ratingId,
    required String text,
  }) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para comentar.');
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/ratings/$ratingId/comments'),
      headers: _headersJson(),
      body: json.encode({'text': text}),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode < 200 || resp.statusCode > 299 || data['success'] != true) {
      throw Exception(data['message'] ?? 'Error al agregar comentario');
    }
  }

  Future<void> upvoteRating(String ratingId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/ratings/$ratingId/upvote'),
      headers: _headersJson(),
    );
    if (resp.statusCode < 200 || resp.statusCode > 299) {
      throw Exception("Error al votar calificación");
    }
  }

  Future<void> downvoteRating(String ratingId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/ratings/$ratingId/downvote'),
      headers: _headersJson(),
    );
    if (resp.statusCode < 200 || resp.statusCode > 299) {
      throw Exception("Error al votar calificación");
    }
  }

  // ========================================================================
  //  RECOMENDACIONES
  // ========================================================================

  Future<UserRecommendations?> getRecommendationsForCurrentUser() async {
    if (!_auth.isAuthenticated || _auth.currentUser == null) return null;

    final resp = await http.get(
      Uri.parse('$API_BASE_URL/recommendations/user/${_auth.currentUser!.id}'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);

    if (resp.statusCode >= 200 &&
        resp.statusCode < 300 &&
        data['success'] == true) {
      return UserRecommendations.fromJson(data['data']);
    }

    return null;
  }

  Future<void> sendInteraction({
    required String category,
    required double distance,
  }) async {
    if (!_auth.isAuthenticated) return;

    await http.post(
      Uri.parse('$API_BASE_URL/recommendations/update'),
      headers: _headersJson(),
      body: json.encode({
        'category': category,
        'distance': distance,
        'time': DateTime.now().toIso8601String(),
      }),
    );
  }

  // ========================================================================
  //  ADMIN: CREAR / EDITAR LUGARES Y SUBIR FOTOS
  // ========================================================================

  Future<Place> createPlaceAsAdmin({
    required String name,
    required String category,
    String? description,
    String? address,
    required double latitude,
    required double longitude,
  }) async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/places'),
      headers: _headersJson(),
      body: json.encode({
        'name': name,
        'category': category,
        if (description != null) 'description': description,
        if (address != null) 'address': address,
        'latitude': latitude,
        'longitude': longitude,
      }),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return Place.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'No se pudo crear el lugar');
  }

  Future<Place> updatePlaceAsAdmin({
    required String placeId,
    String? name,
    String? category,
    String? description,
    String? address,
    double? latitude,
    double? longitude,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (category != null) body['category'] = category;
    if (description != null) body['description'] = description;
    if (address != null) body['address'] = address;
    if (latitude != null && longitude != null) {
      body['latitude'] = latitude;
      body['longitude'] = longitude;
    }

    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/places/$placeId'),
      headers: _headersJson(),
      body: json.encode(body),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return Place.fromJson(data['data']);
    }
    throw Exception(data['message'] ?? 'No se pudo actualizar el lugar');
  }

  /// Sube una foto de lugar como admin. El backend agrega la marca de agua.
  /// Devuelve la URL relativa (por ejemplo `/uploads/places/....png`).
  Future<String> uploadPlacePhotoAsAdmin({
    required String placeId,
    required Uint8List bytes,
    required String filename,
  }) async {
    final uri = Uri.parse('$API_BASE_URL/admin/places/$placeId/photos');

    final request = http.MultipartRequest('POST', uri);
    if (_auth.token != null) {
      request.headers['Authorization'] = 'Bearer ${_auth.token}';
    }

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      ),
    );

    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);
    final data = json.decode(resp.body);

    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return (data['data']?['url'] as String?) ?? '';
    }
    throw Exception(data['message'] ?? 'No se pudo subir la foto del lugar');
  }

  /// Elimina una foto oficial de un lugar como admin.
  Future<void> deletePlacePhotoAsAdmin({
    required String placeId,
    required String photoUrl,
  }) async {
    final resp = await http.delete(
      Uri.parse('$API_BASE_URL/admin/places/$placeId/photos'),
      headers: _headersJson(),
      body: json.encode({'photoUrl': photoUrl}),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode < 200 || resp.statusCode > 299 || data['success'] != true) {
      throw Exception(data['message'] ?? 'No se pudo eliminar la foto del lugar');
    }
  }

  // ========================================================================
  //  CATEGORÍAS
  // ========================================================================

  /// Obtiene todas las categorías disponibles desde la BD
  Future<List<String>> getAllCategories() async {
    try {
      final resp = await http.get(
        Uri.parse('$API_BASE_URL/places/categories'),
        headers: _headersJson(),
      );

      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        if (data['success'] == true && data['data'] is List) {
          return List<String>.from(data['data'].map((c) => c.toString()));
        }
      }
      return [];
    } catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }

  // ========================================================================
  //  NOTIFICACIONES
  // ========================================================================

  /// Obtiene las notificaciones no leídas del usuario
  Future<List<dynamic>?> getUnreadNotifications() async {
    if (!_auth.isAuthenticated) return null;

    try {
      final resp = await http.get(
        Uri.parse('$API_BASE_URL/notifications/unread'),
        headers: _headersJson(),
      );

      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        if (data['success'] == true && data['data'] is List) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      return null;
    }
  }

  /// Obtiene todas las notificaciones del usuario
  Future<List<dynamic>> getAllNotifications() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para ver notificaciones.');
    }

    final resp = await http.get(
      Uri.parse('$API_BASE_URL/notifications'),
      headers: _headersJson(),
    );

    final data = json.decode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      return List<dynamic>.from(data['data'] ?? []);
    }

    throw Exception(data['message'] ?? 'Error al cargar notificaciones');
  }

  /// Marca una notificación como leída
  Future<void> markNotificationAsRead(String notificationId) async {
    if (!_auth.isAuthenticated) return;

    await http.put(
      Uri.parse('$API_BASE_URL/notifications/$notificationId/read'),
      headers: _headersJson(),
    );
  }

  /// Obtiene todas las notificaciones del usuario (alias para getAllNotifications)
  Future<List<dynamic>> getNotifications() async {
    return getAllNotifications();
  }

  // ========================================================================
  //  RECOMENDACIONES PERSONALIZADAS
  // ========================================================================

  /// Obtiene una recomendación personalizada
  Future<Map<String, dynamic>> getPersonalizedRecommendation() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para obtener recomendaciones.');
    }

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/recommendations/personalized'),
        headers: _headersJson(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return Map<String, dynamic>.from(data['data'] ?? {});
        }
      }
      return {};
    } catch (e) {
      debugPrint('Error fetching personalized recommendation: $e');
      return {};
    }
  }

  /// Registra una búsqueda del usuario
  Future<void> recordSearch(String query) async {
    if (!_auth.isAuthenticated) return;

    try {
      await http.post(
        Uri.parse('$API_BASE_URL/recommendations/record-search'),
        headers: _headersJson(),
        body: json.encode({'query': query}),
      );
    } catch (e) {
      debugPrint('Error recording search: $e');
    }
  }

  /// Registra un filtro del usuario
  Future<void> recordFilter(String? filter, String? category) async {
    if (!_auth.isAuthenticated) return;

    try {
      await http.post(
        Uri.parse('$API_BASE_URL/recommendations/record-filter'),
        headers: _headersJson(),
        body: json.encode({
          'filter': filter,
          'category': category,
        }),
      );
    } catch (e) {
      debugPrint('Error recording filter: $e');
    }
  }

  /// Registra que el usuario ocultó un lugar
  Future<void> hidePlace(String placeId) async {
    if (!_auth.isAuthenticated) return;

    try {
      await http.post(
        Uri.parse('$API_BASE_URL/recommendations/hide-place'),
        headers: _headersJson(),
        body: json.encode({'placeId': placeId}),
      );
    } catch (e) {
      debugPrint('Error hiding place: $e');
    }
  }

  // ========================================
  // REPORTES - SEGUIMIENTO DEL USUARIO
  // ========================================

  Future<List<dynamic>> getMyReports() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para ver sus reportes.');
    }

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/reports/my-reports'),
        headers: _headersJson(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return List<dynamic>.from(data['data']);
        }
        return [];
      } else {
        throw Exception('Error al cargar reportes: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error en getMyReports: $e');
      throw Exception('Error al cargar reportes: $e');
    }
  }

  // ========================================
  // REFERIDOS - SISTEMA DE REFERIDOS
  // ========================================

  Future<Map<String, dynamic>> getReferralInfo() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para ver información de referidos.');
    }

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/referrals/info'),
        headers: _headersJson(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Map<String, dynamic>.from(data['data']);
        }
        return {};
      } else {
        throw Exception('Error al cargar información de referidos: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error en getReferralInfo: $e');
      throw Exception('Error al cargar información de referidos: $e');
    }
  }

  Future<Map<String, dynamic>> getExclusiveRewards() async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para ver recompensas exclusivas.');
    }

    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/referrals/exclusive-rewards'),
        headers: _headersJson(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Map<String, dynamic>.from(data['data']);
        }
        return {};
      } else {
        throw Exception('Error al cargar recompensas exclusivas: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error en getExclusiveRewards: $e');
      throw Exception('Error al cargar recompensas exclusivas: $e');
    }
  }

  Future<Map<String, dynamic>> applyReferralCode(String code) async {
    if (!_auth.isAuthenticated) {
      throw Exception('Debe iniciar sesión para aplicar un código de referido.');
    }

    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/referrals/apply'),
        headers: _headersJson(),
        body: json.encode({'code': code}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return Map<String, dynamic>.from(data['data'] ?? {});
        }
        throw Exception(data['error'] ?? 'Error al aplicar código');
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error en applyReferralCode: $e');
      throw Exception('Error al aplicar código: $e');
    }
  }

  Future<List<dynamic>> getReferralLeaderboard() async {
    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/referrals/leaderboard'),
        headers: _headersJson(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return List<dynamic>.from(data['data']);
        }
        return [];
      } else {
        throw Exception('Error al cargar leaderboard: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error en getReferralLeaderboard: $e');
      throw Exception('Error al cargar leaderboard: $e');
    }
  }
}
