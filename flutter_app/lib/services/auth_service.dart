import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../secrets.dart';
import '../app_state.dart';
import '../main.dart'; // navigatorKey

String? _buildAvatarUrlOrNull(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  if (raw.startsWith('http')) return raw;
  final baseWithoutApi = API_BASE_URL.replaceFirst('/api', '');
  if (raw.startsWith('/')) return '$baseWithoutApi$raw';
  return '$baseWithoutApi/$raw';
}

// ======== MODELO PERFIL COMPLETO ========
class UserProfile {
  final String id;
  final String name;
  final String username;
  final String email;
  final String role;
  final int reputationScore;
  final String currentLevel;
  final List<String> badges;
  final String roleColor;
  final String language;
  final String theme;
  final String corporateColor;
  final String? avatarUrl;
  final List<String> favoritePlaces;
  final bool showLevel;
  final bool showBadges;
  final String selectedTitle;
  final String referralCode;
  final int referralsCount;

  UserProfile({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.role,
    required this.reputationScore,
    required this.currentLevel,
    required this.badges,
    required this.roleColor,
    required this.language,
    required this.theme,
    required this.corporateColor,
    this.avatarUrl,
    required this.favoritePlaces,
    required this.showLevel,
    required this.showBadges,
    required this.selectedTitle,
    required this.referralCode,
    required this.referralsCount,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final dynamic rawAvatar = json['avatar_url'];
    final normalizedAvatar = _buildAvatarUrlOrNull(
      rawAvatar is String ? rawAvatar : rawAvatar?.toString(),
    );

    final settings = json['profile_settings'] as Map<String, dynamic>?;
    final sl = (settings != null && settings['showLevel'] is bool)
        ? settings['showLevel'] as bool
        : true;
    final sb = (settings != null && settings['showBadges'] is bool)
        ? settings['showBadges'] as bool
        : true;
    final selTitle = (settings != null && settings['selectedTitle'] is String)
        ? settings['selectedTitle'] as String
        : '';

    return UserProfile(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      reputationScore: json['reputation_score'] ?? 0,
      currentLevel: json['current_level'] ?? 'Novato',
      badges: List<String>.from(json['badges'] ?? []),
      roleColor: json['roleColor'] ?? '#6C757D',
      language: json['language'] ?? 'es',
      theme: json['theme'] ?? 'light',
      corporateColor: json['corporate_color'] ?? '#007BFF',
      avatarUrl: normalizedAvatar,
      favoritePlaces:
          List<String>.from(json['favoritePlaces'] ?? const <String>[]),
      showLevel: sl,
      showBadges: sb,
      selectedTitle: selTitle,
      referralCode: json['referralCode'] ?? '',
      referralsCount: json['referralsCount'] ?? 0,
    );
  }
}

// ======== MODELO APELACIÓN DE MODERACIÓN ========
class ModerationAppeal {
  final String id;
  final String type; // SUSPENSION o STRIKES
  final String status; // PENDING, APPROVED, REJECTED
  final String reason;
  final String? adminResponse;
  final int strikesAtCreation;
  final DateTime? suspendedUntilAtCreation;
  final DateTime createdAt;

  ModerationAppeal({
    required this.id,
    required this.type,
    required this.status,
    required this.reason,
    this.adminResponse,
    required this.strikesAtCreation,
    this.suspendedUntilAtCreation,
    required this.createdAt,
  });

  factory ModerationAppeal.fromJson(Map<String, dynamic> json) {
    return ModerationAppeal(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? 'SUSPENSION',
      status: json['status'] ?? 'PENDING',
      reason: json['reason'] ?? '',
      adminResponse: json['adminResponse'] as String?,
      strikesAtCreation: (json['strikesAtCreation'] ?? 0) as int,
      suspendedUntilAtCreation: json['suspendedUntilAtCreation'] != null
          ? DateTime.tryParse(json['suspendedUntilAtCreation'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

// ======== MODELO USUARIO BÁSICO ========
class User {
  final String id;
  final String name;
  final String username;
  final String email;
  final String role;
  final String language;
  final String theme;
  final String corporateColor;

  User({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.role,
    required this.language,
    required this.theme,
    required this.corporateColor,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      language: json['language'] ?? 'es',
      theme: json['theme'] ?? 'light',
      corporateColor: json['corporate_color'] ?? '#007BFF',
    );
  }
}

// ======== SERVICIO PRINCIPAL ========
class AuthService extends ChangeNotifier {
  User? _currentUser;
  UserProfile? _userProfile;
  UserProfile? _visitedProfile; // 👈 perfil público de otro usuario
  String? _token;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null;
  String? get token => _token;
  UserProfile? get userProfile => _userProfile;
  UserProfile? get visitedProfile => _visitedProfile;

  bool isPlaceFavorite(String placeId) {
    final favs = _userProfile?.favoritePlaces;
    if (favs == null || favs.isEmpty) return false;
    return favs.contains(placeId);
  }

  void updateFavoritePlaces(List<String> ids) {
    if (_userProfile == null) return;
    _userProfile!.favoritePlaces
      ..clear()
      ..addAll(ids.map((e) => e.toString()));
    notifyListeners();
  }

  AuthService() {
    _loadUserFromStorage();
  }

  static const _sessionExpiryKey = 'sessionExpiry';
  static const Duration _sessionDuration = Duration(days: 30);

  // ======== SESIÓN LOCAL ========
  void _loadUserFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    if (_token != null) {
      final expiryString = prefs.getString(_sessionExpiryKey);
      if (expiryString != null) {
        final expiry = DateTime.tryParse(expiryString);
        if (expiry != null && DateTime.now().isAfter(expiry)) {
          await logout();
          return;
        }
      }
      await _extendSession();
      notifyListeners();
      await getProfile();
    }
  }

  Future<void> _saveAuthData(String token, User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    _token = token;
    _currentUser = user;
    await _extendSession();
    await getProfile();
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove(_sessionExpiryKey);
    _token = null;
    _currentUser = null;
    _userProfile = null;
    _visitedProfile = null;
    notifyListeners();
  }

  // ======== PERFIL DEL USUARIO ACTUAL ========
  Future<void> getProfile() async {
    if (_token == null) return;
    final url = Uri.parse('$API_BASE_URL/auth/profile');
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
      );

      if (response.statusCode != 200) throw Exception('Error al cargar perfil');
      final data = json.decode(response.body)['data'];
      _userProfile = UserProfile.fromJson(data);
      await _extendSession();

      final context = navigatorKey.currentContext;
      if (context != null) {
        await Provider.of<AppState>(context, listen: false).loadUserPreferences(
          language: _userProfile!.language,
          theme: _userProfile!.theme,
          corporateColorHex: _userProfile!.corporateColor,
        );
      }

      notifyListeners();
    } catch (e) {
      print('Error getProfile: $e');
    }
  }

  // ======== PERFIL PÚBLICO DE OTRO USUARIO ========
  Future<void> getPublicProfile(String userId) async {
    final url = Uri.parse('$API_BASE_URL/auth/public/$userId');
    try {
      final response = await http.get(url, headers: {'Content-Type': 'application/json'});
      if (response.statusCode != 200) {
        throw Exception('No se pudo cargar el perfil público');
      }

      final data = json.decode(response.body)['data'];
      _visitedProfile = UserProfile.fromJson(data);
      notifyListeners();
    } catch (e) {
      print('Error getPublicProfile: $e');
      _visitedProfile = null;
      notifyListeners();
    }
  }

  // ======== VERIFICACIÓN DE PERFIL ========
  Future<void> requestVerification({
    String badge = 'Verificado',
    required String evidence,
  }) async {
    if (_token == null) {
      throw Exception('No autenticado');
    }

    final url = Uri.parse('$API_BASE_URL/auth/verification');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode({
        'badge': badge,
        'evidence': evidence,
      }),
    );

    if (response.statusCode != 201) {
      Map<String, dynamic>? data;
      try {
        data = json.decode(response.body) as Map<String, dynamic>;
      } catch (_) {
        data = null;
      }
      throw Exception(
        data != null
            ? (data['message'] ?? 'No se pudo enviar la solicitud de verificación')
            : 'No se pudo enviar la solicitud de verificación (HTTP ${response.statusCode})',
      );
    }
  }

  // ======== AUTENTICACIÓN ========
  Future<void> register(
    String name,
    String username,
    String email,
    String password, {
    String? referralCode,
  }) async {
    final context = navigatorKey.currentContext;
    if (context == null) throw Exception('Contexto no disponible');

    final appState = Provider.of<AppState>(context, listen: false);
    final url = Uri.parse('$API_BASE_URL/auth/register');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'name': name,
        'username': username,
        'email': email,
        'password': password,
        'language': appState.locale.languageCode,
        'theme': appState.themeMode == ThemeMode.dark ? 'dark' : 'light',
        'corporate_color':
            '#${appState.corporateColor.value.toRadixString(16).substring(2, 8).toUpperCase()}',
        if (referralCode != null && referralCode.trim().isNotEmpty)
          'referralCode': referralCode.trim(),
      }),
    );

    if (response.statusCode != 201) {
      throw Exception(json.decode(response.body)['message']);
    }

    final data = json.decode(response.body);
    final user = User.fromJson(data['data']);
    await _saveAuthData(data['token'], user);
  }

  Future<void> login(String email, String password) async {
    final url = Uri.parse('$API_BASE_URL/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    if (response.statusCode != 200) {
      throw Exception(json.decode(response.body)['message']);
    }

    final data = json.decode(response.body);
    final user = User.fromJson(data['data']);
    await _saveAuthData(data['token'], user);
  }

  // ======== GESTIÓN DE CUENTA ========
  Future<void> deleteAccount({
    required String password,
    required String confirmation,
  }) async {
    if (_token == null) throw Exception('No autenticado');

    final url = Uri.parse('$API_BASE_URL/auth/delete-account');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'password': password,
        'confirmation': confirmation,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(response.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (response.statusCode != 200 || data == null || data['success'] != true) {
      final msg = data != null
          ? (data['message'] ?? 'No se pudo eliminar la cuenta')
          : 'No se pudo eliminar la cuenta (HTTP ${response.statusCode})';
      throw Exception(msg);
    }

    await logout();
  }

  Future<void> forgotPassword(String email) async {
    final url = Uri.parse('$API_BASE_URL/auth/forgotpassword');
    final response =
        await http.post(url, body: json.encode({'email': email}));
    if (response.statusCode != 200) throw Exception('Error al enviar email');
  }

  Future<void> resetPassword(String token, String password) async {
    final url = Uri.parse('$API_BASE_URL/auth/resetpassword/$token');
    final response =
        await http.put(url, body: json.encode({'password': password}));
    if (response.statusCode != 200) throw Exception('Error al restablecer');
  }

  Future<void> updateProfileVisibility({
    bool? showLevel,
    bool? showBadges,
    String? selectedTitle,
  }) async {
    if (_token == null) {
      throw Exception('No autenticado');
    }

    final url = Uri.parse('$API_BASE_URL/auth/profile');
    final body = <String, dynamic>{};
    if (showLevel != null) body['showLevel'] = showLevel;
    if (showBadges != null) body['showBadges'] = showBadges;
    if (selectedTitle != null) body['selectedTitle'] = selectedTitle;

    if (body.isEmpty) return;

    final resp = await http.put(
      url,
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
      body: json.encode(body),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (resp.statusCode != 200 || data == null || data['success'] != true) {
      final msg = data != null
          ? (data['message'] ?? 'No se pudo actualizar la visibilidad del perfil')
          : 'No se pudo actualizar la visibilidad del perfil (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    await getProfile();
  }

  Future<void> updatePreferences() async {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    final appState = Provider.of<AppState>(context, listen: false);
    final url = Uri.parse('$API_BASE_URL/auth/profile');
    final resp = await http.put(
      url,
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'language': appState.locale.languageCode,
        'theme': appState.themeMode == ThemeMode.dark ? 'dark' : 'light',
        'corporate_color':
            '#${appState.corporateColor.value.toRadixString(16).substring(2, 8).toUpperCase()}',
      }),
    );

    // Solo recargar perfil si el backend responde OK; si falla, mantenemos las
    // preferencias locales en AppState para que la UI no "rebote".
    if (resp.statusCode == 200) {
      await getProfile();
    }
  }

  // ======== APELACIONES DE MODERACIÓN ========
  Future<ModerationAppeal> createAppeal({
    required String reason,
    String? type,
  }) async {
    if (_token == null) {
      throw Exception('Debe iniciar sesión para apelar.');
    }

    final url = Uri.parse('$API_BASE_URL/appeals');
    final resp = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode({
        'reason': reason,
        if (type != null) 'type': type,
      }),
    );

    Map<String, dynamic>? data;
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }

    if (resp.statusCode != 201 || data == null || data['success'] != true) {
      final msg = data != null
          ? (data['message'] ?? data['error'] ?? 'No se pudo crear la apelación')
          : 'No se pudo crear la apelación (HTTP ${resp.statusCode})';
      throw Exception(msg);
    }

    return ModerationAppeal.fromJson(data['data'] as Map<String, dynamic>);
  }

  Future<List<ModerationAppeal>> getMyAppeals() async {
    if (_token == null) {
      throw Exception('Debe iniciar sesión para ver tus apelaciones.');
    }

    final url = Uri.parse('$API_BASE_URL/appeals/me');
    final resp = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
    );

    final data = json.decode(resp.body) as Map<String, dynamic>;
    if (resp.statusCode != 200 || data['success'] != true) {
      throw Exception(data['message'] ?? 'No se pudieron cargar tus apelaciones');
    }

    final List<dynamic> list = data['data'] as List<dynamic>;
    return list
        .whereType<Map<String, dynamic>>()
        .map(ModerationAppeal.fromJson)
        .toList();
  }

  // ======== NOTIFICACIONES PUSH ========
  Future<void> registerDeviceToken({
    required String deviceToken,
    required String platform,
  }) async {
    if (_token == null) return;

    final url = Uri.parse('$API_BASE_URL/notifications/token');
    await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_token',
      },
      body: json.encode({
        'deviceToken': deviceToken,
        'platform': platform,
      }),
    );
  }

  // ======== AVATAR ========
  Future<void> uploadAvatar(Uint8List bytes, String filename) async {
    if (_token == null) {
      throw Exception('No autenticado');
    }

    final uri = Uri.parse('$API_BASE_URL/auth/profile/avatar');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $_token';

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
      // Respuesta no JSON (por ejemplo HTML con <!DOCTYPE ...>)
      throw Exception(
        'Error al actualizar el avatar (HTTP ${resp.statusCode}). Respuesta no válida del servidor.',
      );
    }

    if (resp.statusCode < 200 || resp.statusCode >= 300 || data['success'] != true) {
      throw Exception(data['message'] ?? 'No se pudo actualizar el avatar');
    }

    await getProfile();
  }

  Future<void> keepSessionAlive() async {
    await _extendSession();
  }

  Future<void> _extendSession() async {
    final prefs = await SharedPreferences.getInstance();
    final expiry = DateTime.now().add(_sessionDuration);
    await prefs.setString(_sessionExpiryKey, expiry.toIso8601String());
  }
}
