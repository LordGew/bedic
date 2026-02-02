import 'dart:convert';

import 'package:http/http.dart' as http;

import '../secrets.dart';
import 'auth_service.dart';

class ModerationItem {
  final String id;
  final String type; // e.g. report, rating, comment
  final String category;
  final String summary;
  final String username;
  final String userId;
  final String? placeName;
  final DateTime createdAt;
  final String status;

  ModerationItem({
    required this.id,
    required this.type,
    required this.category,
    required this.summary,
    required this.username,
    required this.userId,
    required this.placeName,
    required this.createdAt,
    required this.status,
  });

  factory ModerationItem.fromJson(Map<String, dynamic> json) {
    return ModerationItem(
      id: json['_id']?.toString() ?? '',
      type: json['type'] ?? 'report',
      category: json['category'] ?? 'General',
      summary: json['summary'] ?? json['description'] ?? '',
      username: json['user']?['username'] ?? json['username'] ?? 'Anónimo',
      userId: json['user']?['_id']?.toString() ?? json['userId']?.toString() ?? '',
      placeName: json['place']?['name'] ?? json['placeName'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? (json['is_moderated'] == true ? 'moderated' : 'pending'),
    );
  }
}

class AdminUser {
  final String id;
  final String name;
  final String username;
  final String email;
  final String role;
  final String language;
  final String theme;
  final String corporateColor;
  final int reputationScore;
  final String currentLevel;
  final bool isVerified;
  final DateTime? mutedUntil;

  AdminUser({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.role,
    required this.language,
    required this.theme,
    required this.corporateColor,
    required this.reputationScore,
    required this.currentLevel,
    required this.isVerified,
    required this.mutedUntil,
  });

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      language: json['language'] ?? 'es',
      theme: json['theme'] ?? 'light',
      corporateColor: json['corporate_color'] ?? '#007BFF',
      reputationScore: (json['reputation_score'] ?? 0) as int,
      currentLevel: json['current_level'] ?? 'Novato',
      isVerified: json['is_verified'] == true,
      mutedUntil: json['muted_until'] != null
          ? DateTime.tryParse(json['muted_until'] as String)
          : null,
    );
  }
}

class CategoryCount {
  final String category;
  final int count;

  CategoryCount({required this.category, required this.count});

  factory CategoryCount.fromJson(Map<String, dynamic> json) {
    return CategoryCount(
      category: (json['category'] ?? json['_id'] ?? 'Otro').toString(),
      count: (json['count'] ?? 0) as int,
    );
  }
}

class PlaceStat {
  final String id;
  final String name;
  final String? category;
  final int? count;
  final double? avgScore;

  PlaceStat({
    required this.id,
    required this.name,
    this.category,
    this.count,
    this.avgScore,
  });

  factory PlaceStat.fromJson(Map<String, dynamic> json) {
    return PlaceStat(
      id: (json['_id'] ?? json['placeId'] ?? '').toString(),
      name: (json['name'] ?? 'Lugar sin nombre').toString(),
      category: json['category']?.toString(),
      count: json['count'] != null ? (json['count'] as num).toInt() : null,
      avgScore: json['avgScore'] != null
          ? (json['avgScore'] as num).toDouble()
          : null,
    );
  }
}

class PlacesActivityStats {
  final int totalPlaces;
  final int totalReports;
  final int totalRatings;
  final List<CategoryCount> topCategories;
  final List<PlaceStat> topReportedPlaces;
  final List<PlaceStat> topRatedPlaces;

  PlacesActivityStats({
    required this.totalPlaces,
    required this.totalReports,
    required this.totalRatings,
    required this.topCategories,
    required this.topReportedPlaces,
    required this.topRatedPlaces,
  });

  factory PlacesActivityStats.fromJson(Map<String, dynamic> json) {
    final catsRaw = List<Map<String, dynamic>>.from(json['topCategories'] ?? []);
    final topReportsRaw =
        List<Map<String, dynamic>>.from(json['topReportedPlaces'] ?? []);
    final topRatedRaw =
        List<Map<String, dynamic>>.from(json['topRatedPlaces'] ?? []);

    return PlacesActivityStats(
      totalPlaces: (json['totalPlaces'] ?? 0) as int,
      totalReports: (json['totalReports'] ?? 0) as int,
      totalRatings: (json['totalRatings'] ?? 0) as int,
      topCategories: catsRaw.map(CategoryCount.fromJson).toList(),
      topReportedPlaces: topReportsRaw.map(PlaceStat.fromJson).toList(),
      topRatedPlaces: topRatedRaw.map(PlaceStat.fromJson).toList(),
    );
  }
}

class AdminOverviewStats {
  final int totalUsers;
  final int totalPlaces;
  final int totalReports;
  final int totalRatings;

  AdminOverviewStats({
    required this.totalUsers,
    required this.totalPlaces,
    required this.totalReports,
    required this.totalRatings,
  });

  factory AdminOverviewStats.fromJson(Map<String, dynamic> json) {
    return AdminOverviewStats(
      totalUsers: (json['totalUsers'] ?? 0) as int,
      totalPlaces: (json['totalPlaces'] ?? 0) as int,
      totalReports: (json['totalReports'] ?? 0) as int,
      totalRatings: (json['totalRatings'] ?? 0) as int,
    );
  }
}
class VerificationRequest {
  final String id;
  final String username;
  final String badge;
  final String evidence;
  final DateTime submittedAt;
  final String status;

  VerificationRequest({
    required this.id,
    required this.username,
    required this.badge,
    required this.evidence,
    required this.submittedAt,
    required this.status,
  });

  factory VerificationRequest.fromJson(Map<String, dynamic> json) {
    return VerificationRequest(
      id: json['_id']?.toString() ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Desconocido',
      badge: json['badge'] ?? 'Verificado',
      evidence: json['evidence'] ?? json['note'] ?? '',
      submittedAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'pending',
    );
  }
}

class AdminService {
  final AuthService _auth;

  AdminService(this._auth);

  Map<String, String> _headers() => {
        'Content-Type': 'application/json',
        if (_auth.token != null) 'Authorization': 'Bearer ${_auth.token}',
      };

  Future<AdminOverviewStats> fetchOverviewStats({
    DateTime? from,
    DateTime? to,
  }) async {
    final params = <String, String>{};
    if (from != null) params['from'] = from.toIso8601String();
    if (to != null) params['to'] = to.toIso8601String();

    final uri = Uri.parse('$API_BASE_URL/admin/stats/overview')
        .replace(queryParameters: params.isEmpty ? null : params);

    final resp = await http.get(
      uri,
      headers: _headers(),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend (HTTP ${resp.statusCode}) al cargar métricas.');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      return AdminOverviewStats.fromJson(
        Map<String, dynamic>.from(data['data'] ?? const {}),
      );
    }
    throw Exception(data['message'] ?? 'No se pudieron cargar las métricas generales');
  }

  Future<List<ModerationItem>> fetchModerationFeed({
    String? keyword,
    String? username,
    String? category,
    DateTime? from,
    DateTime? to,
    String? type,
  }) async {
    final params = <String, String>{};
    if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;
    if (username != null && username.isNotEmpty) params['user'] = username;
    if (category != null && category.isNotEmpty) params['category'] = category;
    if (type != null && type.isNotEmpty) params['type'] = type;
    if (from != null) params['from'] = from.toIso8601String();
    if (to != null) params['to'] = to.toIso8601String();

    final uri = Uri.parse('$API_BASE_URL/admin/moderation/feed')
        .replace(queryParameters: params.isEmpty ? null : params);

    final resp = await http.get(uri, headers: _headers());
    final data = jsonDecode(resp.body);

    if (resp.statusCode == 200 && data['success'] == true) {
      final list = List<Map<String, dynamic>>.from(data['data'] ?? []);
      return list.map(ModerationItem.fromJson).toList();
    }

    throw Exception(data['message'] ?? 'No se pudo cargar el panel de moderación');
  }

  Future<void> moderateReport(String reportId,
      {bool moderated = true, bool? verified}) async {
    final body = <String, dynamic>{'is_moderated': moderated};
    if (verified != null) body['verified'] = verified;

    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/reports/$reportId/moderate'),
      headers: _headers(),
      body: jsonEncode(body),
    );

    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'Error al moderar el reporte');
    }
  }

  Future<void> moderateRating(String ratingId, {bool remove = true}) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/ratings/$ratingId/moderate'),
      headers: _headers(),
      body: jsonEncode({'remove': remove}),
    );

    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'Error al moderar el comentario');
    }
  }

  Future<void> deleteUser(String userId) async {
    final resp = await http.delete(
      Uri.parse('$API_BASE_URL/admin/users/$userId'),
      headers: _headers(),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'No se pudo eliminar al usuario');
    }
  }

  Future<void> muteUser(String userId, {int days = 7}) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/users/$userId/mute'),
      headers: _headers(),
      body: jsonEncode({'days': days}),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'No se pudo silenciar al usuario');
    }
  }

  Future<void> updateUserEmail(String userId, String email) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/users/$userId/email'),
      headers: _headers(),
      body: jsonEncode({'email': email}),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'No se pudo actualizar el email');
    }
  }

  Future<void> adminResetPassword(String userId) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/users/$userId/reset-password'),
      headers: _headers(),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(
          data['message'] ?? 'No se pudo iniciar el restablecimiento de contraseña');
    }
  }

  Future<List<AdminUser>> fetchUsers() async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/admin/users'),
      headers: _headers(),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al cargar la lista de usuarios (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      final list = List<Map<String, dynamic>>.from(data['data'] ?? []);
      return list.map(AdminUser.fromJson).toList();
    }

    throw Exception(data['message'] ?? 'No se pudieron cargar los usuarios');
  }

  Future<List<VerificationRequest>> fetchVerificationRequests() async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/admin/verifications'),
      headers: _headers(),
    );
    final data = jsonDecode(resp.body);
    if (resp.statusCode == 200 && data['success'] == true) {
      final list = List<Map<String, dynamic>>.from(data['data'] ?? []);
      return list.map(VerificationRequest.fromJson).toList();
    }
    throw Exception(data['message'] ?? 'No se pudieron cargar las verificaciones');
  }

  Future<void> resolveVerification(String requestId, {required bool approve}) async {
    final resp = await http.put(
      Uri.parse('$API_BASE_URL/admin/verifications/$requestId'),
      headers: _headers(),
      body: jsonEncode({'approve': approve}),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'No se pudo actualizar la verificación');
    }
  }

  Future<void> publishAnnouncement({
    required String title,
    required String message,
    List<String>? categories,
    bool pinned = false,
  }) async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/announcements'),
      headers: _headers(),
      body: jsonEncode({
        'title': title,
        'message': message,
        'categories': categories,
        'pinned': pinned,
      }),
    );
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'No se pudo publicar el anuncio');
    }
  }

  Future<PlacesActivityStats> fetchPlacesActivityStats() async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/admin/stats/places-activity'),
      headers: _headers(),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al cargar métricas de lugares (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      return PlacesActivityStats.fromJson(
        Map<String, dynamic>.from(data['data'] ?? const {}),
      );
    }

    throw Exception(
        data['message'] ?? 'No se pudieron cargar las métricas de lugares y actividad');
  }

  Future<int> runImageEnrichment({int? limit}) async {
    final body = <String, dynamic>{};
    if (limit != null) {
      body['limit'] = limit;
    }

    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/enrich-images'),
      headers: _headers(),
      body: jsonEncode(body),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al ejecutar enriquecimiento de imágenes (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      final rawCount = data['count'] ?? 0;
      if (rawCount is int) return rawCount;
      if (rawCount is num) return rawCount.toInt();
      return 0;
    }

    throw Exception(
        data['message'] ?? 'No se pudo ejecutar el enriquecimiento de imágenes');
  }

  Future<String> exportOverviewCsv({
    DateTime? from,
    DateTime? to,
  }) async {
    final params = <String, String>{};
    if (from != null) params['from'] = from.toIso8601String();
    if (to != null) params['to'] = to.toIso8601String();

    final uri = Uri.parse('$API_BASE_URL/admin/stats/overview/export')
        .replace(queryParameters: params.isEmpty ? null : params);

    final resp = await http.get(uri, headers: _headers());
    if (resp.statusCode == 200) {
      return resp.body;
    }

    Map<String, dynamic>? data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }
    throw Exception(data != null
        ? (data['message'] ?? 'No se pudo exportar CSV')
        : 'No se pudo exportar CSV (HTTP ${resp.statusCode})');
  }

  // ================= PIN DE ADMIN (SEGURIDAD ADICIONAL) =================

  /// Obtiene el estado del PIN de admin para el usuario actual.
  /// Devuelve un mapa con { hasPin: bool, expiresAt: DateTime?, expired: bool }.
  Future<Map<String, dynamic>> getAdminPinStatus() async {
    final resp = await http.get(
      Uri.parse('$API_BASE_URL/admin/pin/status'),
      headers: _headers(),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al consultar estado de PIN (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      final raw = Map<String, dynamic>.from(data['data'] ?? const {});
      return {
        'hasPin': raw['hasPin'] == true,
        'expired': raw['expired'] == true,
        'expiresAt': raw['expiresAt'] != null
            ? DateTime.tryParse(raw['expiresAt'].toString())
            : null,
      };
    }

    throw Exception(
        data['message'] ?? 'No se pudo obtener el estado del PIN de administración');
  }

  /// Crea o actualiza el PIN de admin (6 dígitos).
  Future<void> setAdminPin(String pin) async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/pin'),
      headers: _headers(),
      body: jsonEncode({'pin': pin}),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al configurar PIN (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return;
    }

    throw Exception(data['message'] ?? 'No se pudo configurar el PIN de administración');
  }

  /// Verifica el PIN de admin actual.
  Future<void> verifyAdminPin(String pin) async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/pin/verify'),
      headers: _headers(),
      body: jsonEncode({'pin': pin}),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al verificar PIN (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode == 200 && data['success'] == true) {
      return;
    }

    // Propagar detalle útil para la UI (expirado, mensaje, etc.)
    final msg = data['message'] ?? 'No se pudo verificar el PIN de administración';
    throw Exception(msg);
  }

  /// Solicita un código de restablecimiento de PIN que se envía al correo.
  Future<void> requestAdminPinReset() async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/pin/reset-request'),
      headers: _headers(),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al solicitar restablecimiento de PIN (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return;
    }

    throw Exception(
        data['message'] ?? 'No se pudo solicitar el restablecimiento del PIN de administración');
  }

  /// Confirma el restablecimiento de PIN usando el código enviado por correo.
  Future<void> confirmAdminPinReset({
    required String code,
    required String newPin,
  }) async {
    final resp = await http.post(
      Uri.parse('$API_BASE_URL/admin/pin/reset-confirm'),
      headers: _headers(),
      body: jsonEncode({'code': code, 'newPin': newPin}),
    );

    Map<String, dynamic> data;
    try {
      data = jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Respuesta no válida del backend al confirmar restablecimiento de PIN (HTTP ${resp.statusCode}).');
    }

    if (resp.statusCode >= 200 && resp.statusCode < 300 && data['success'] == true) {
      return;
    }

    throw Exception(
        data['message'] ?? 'No se pudo confirmar el restablecimiento del PIN de administración');
  }
}
