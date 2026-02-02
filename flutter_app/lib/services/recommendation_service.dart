import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../secrets.dart';
import 'auth_service.dart';

class RecommendationService {
  final AuthService _auth;
  RecommendationService(this._auth);

  /// Guarda o actualiza las preferencias locales y las sincroniza con el backend
  Future<void> updatePreference(String category, double distance) async {
    final prefs = await SharedPreferences.getInstance();

    final now = DateTime.now();
    final data = {
      "category": category,
      "distance": distance,
      "time": now.toIso8601String(),
    };

    // Guardar localmente historial básico
    final List<String> history = prefs.getStringList('user_history') ?? [];
    history.add(jsonEncode(data));
    if (history.length > 30) history.removeAt(0);
    await prefs.setStringList('user_history', history);

    // Intentar sincronizar con backend
    if (_auth.isAuthenticated) {
      try {
        final resp = await http.post(
          Uri.parse('$API_BASE_URL/recommendations/update'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${_auth.token}',
          },
          body: jsonEncode(data),
        );
        if (resp.statusCode < 200 || resp.statusCode > 299) {
          throw Exception('Error al sincronizar recomendaciones: ${resp.body}');
        }
      } catch (_) {
        // Si no hay conexión, se mantiene localmente
      }
    }
  }

  /// Registra un evento de engagement
  Future<void> trackEngagement(String placeId, String eventType, {int duration = 0}) async {
    if (!_auth.isAuthenticated) return;
    
    try {
      await http.post(
        Uri.parse('$API_BASE_URL/recommendations/track'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_auth.token}',
        },
        body: jsonEncode({
          'placeId': placeId,
          'eventType': eventType,
          'duration': duration,
        }),
      );
    } catch (e) {
      // Silenciar errores de tracking
    }
  }

  /// Obtiene recomendaciones avanzadas personalizadas
  Future<List<dynamic>> getAdvancedRecommendations({
    required double lat,
    required double lon,
    int radius = 5000,
    int count = 20,
  }) async {
    if (!_auth.isAuthenticated) {
      return [];
    }
    
    try {
      final resp = await http.get(
        Uri.parse('$API_BASE_URL/recommendations/advanced?lat=$lat&lon=$lon&radius=$radius&count=$count'),
        headers: {'Authorization': 'Bearer ${_auth.token}'},
      );
      
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        return data['data'] as List<dynamic>;
      }
    } catch (e) {
      print('Error getting advanced recommendations: $e');
    }
    
    return [];
  }

  /// Carga las recomendaciones locales o remotas
  Future<Map<String, dynamic>> getRecommendations() async {
    final prefs = await SharedPreferences.getInstance();

    // Verifica si AuthService tiene un userProfile válido
    final profile = _auth.userProfile;
    final String? userId = profile?.id; // usa el getter real del modelo UserProfile

    if (_auth.isAuthenticated && userId != null && userId.isNotEmpty) {
      try {
        final resp = await http.get(
          Uri.parse('$API_BASE_URL/recommendations/user/$userId'),
          headers: {'Authorization': 'Bearer ${_auth.token}'},
        );
        if (resp.statusCode == 200) {
          return jsonDecode(resp.body)['data'];
        }
      } catch (_) {}
    }

    // fallback local si no hay conexión
    final history = prefs.getStringList('user_history') ?? [];
    if (history.isEmpty) {
      return {"preferredCategories": [], "avgDistance": 1000};
    }

    final decoded = history.map((e) => jsonDecode(e)).toList();
    final categories = <String, int>{};
    double totalDist = 0;

    for (final h in decoded) {
      final c = h['category'];
      categories[c] = (categories[c] ?? 0) + 1;
      totalDist += h['distance'] ?? 0;
    }

    final sortedCats = categories.keys.toList()
      ..sort((a, b) => categories[b]!.compareTo(categories[a]!));

    return {
      "preferredCategories": sortedCats.take(3).toList(),
      "avgDistance": totalDist / decoded.length,
    };
  }
  
  /// Obtiene estadísticas de engagement
  Future<Map<String, dynamic>> getEngagementStats() async {
    if (!_auth.isAuthenticated) return {};
    
    try {
      final resp = await http.get(
        Uri.parse('$API_BASE_URL/recommendations/engagement-stats'),
        headers: {'Authorization': 'Bearer ${_auth.token}'},
      );
      
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        return data['data'];
      }
    } catch (e) {
      print('Error getting engagement stats: $e');
    }
    
    return {};
  }
}
