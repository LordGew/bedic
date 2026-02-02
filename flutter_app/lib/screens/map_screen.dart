import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
// import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart'; // Ya no se usa
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geolocator_platform_interface/geolocator_platform_interface.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_app/services/place_service.dart';
import 'package:flutter_app/services/recommendation_service.dart';
import 'package:flutter_app/services/auth_service.dart';
import 'package:flutter_app/services/announcement_service.dart';
import 'package:flutter_app/screens/place_detail_screen.dart';
import 'package:flutter_app/screens/profile_screen.dart';
import 'package:flutter_app/screens/setup_screen.dart';
import 'package:flutter_app/screens/announcement_detail_screen.dart';
import 'package:flutter_app/screens/notifications_screen.dart';
import 'package:flutter_app/providers/notification_provider.dart';
import '../i18n/localization_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> with TickerProviderStateMixin {
  // -------------------------------------------------
  // CONTROLLERS & SERVICES
  // -------------------------------------------------
  final MapController _mapController = MapController();
  final TextEditingController _searchCtrl = TextEditingController();
  final AuthService _auth = AuthService();
  late final PlaceService _placeService;
  late final RecommendationService _recommendationService;
  late final AnnouncementService _announcementService;
  Timer? _announcementTimer;
  Timer? _notificationTimer;
  int _unreadNotificationsCount = 0;
  
  @override
  void initState() {
    super.initState();
    _placeService = PlaceService(_auth);
    _recommendationService = RecommendationService(_auth);
    _announcementService = AnnouncementService();
    
    // Actualizar anuncios cada 30 segundos
    _announcementTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadAnnouncements(),
    );
    
    // Actualizar notificaciones cada 30 segundos
    _notificationTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _checkNotifications(),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_autoLoadedRecommendations) {
      // Usar post-frame callback para evitar error de showSnackBar durante build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadCategories();
        _loadInitialData(showErrorSnack: false);
        _loadAnnouncements();
      });
    }
  }

  // -------------------------------------------------
  // STATE VARIABLES
  // -------------------------------------------------
  List<Place> _results = [];
  List<String> _allCategories = [];
  List<String> _selectedCategories = [];
  bool _isLoading = false;
  bool _isLocating = false;
  String _locatingMsg = 'Getting location...';
  Position? _userPos;
  double _mapRotationRad = 0.0;
  Place? _selectedPlace;
  int _selectedRadiusKm = 5;
  double _radiusSliderValue = 5;
  List<Place> _recommended = [];
  final Set<String> _dismissedRecommendationIds = <String>{};
  bool _showFilters = false;
  String? _recommendationCategory;
  LatLng? _customSearchPin;
  bool _isSearchingArea = false;
  bool _autoLoadedRecommendations = false;
  DateTime? _placeViewStartTime;
  bool _recommendationsMinimized = false;
  bool _isDraggingPin = false;
  List<Announcement> _announcements = [];
  final Set<String> _dismissedAnnouncementIds = <String>{};
  bool _loadingAnnouncements = false;
  bool _tipsEnabled = true;

  LocalizationService? get _loc => LocalizationService.of(context);

  List<String> get _availableCategories {
    if (_allCategories.isNotEmpty) return _allCategories;

    // Lista extendida de categorías por defecto (en español, compatibles con los datos existentes)
    const fallback = [
      'Bar',
      'Restaurante',
      'Cafetería',
      'Parque',
      'Hotel',
      'Cine',
      'Tienda',
      'Estación de Taxis',
      'Estación de Buses',
      'Punto de Interés',
      'Museo',
      'Biblioteca',
      'Gimnasio',
      'Hospital',
      'Farmacia',
      'Banco',
      'Oficina de Correos',
      'Supermercado',
      'Centro Comercial',
      'Parque de Diversiones',
    ];

    final cats = _results
        .map((p) => p.category)
        .where((c) => c.isNotEmpty)
        .toSet();

    if (cats.isNotEmpty) {
      final merged = {...cats, ...fallback};
      _allCategories = merged.toList()..sort();
      return _allCategories;
    }

    _allCategories = [...fallback];
    return _allCategories;
  }

  String _categoryLabel(String category) {
    final loc = _loc;
    final lower = category.toLowerCase();
    if (loc == null) return category;

    if (lower.contains('bar')) {
      return loc.translate('map.category.bar');
    }
    if (lower.contains('rest')) {
      return loc.translate('map.category.restaurant');
    }
    if (lower.contains('caf')) {
      return loc.translate('map.category.cafe');
    }
    if (lower.contains('parq') || lower.contains('park')) {
      return loc.translate('map.category.park');
    }
    if (lower.contains('hotel')) {
      return loc.translate('map.category.hotel');
    }
    if (lower.contains('tienda') || lower.contains('shop')) {
      return loc.translate('map.category.shop');
    }
    if (lower.contains('segur') || lower.contains('safety')) {
      return loc.translate('map.category.security');
    }
    if (lower.contains('cine')) {
      return loc.translate('map.category.cinema');
    }
    if (lower.contains('estación de taxis') || lower.contains('taxi')) {
      return loc.translate('map.category.taxi_station');
    }
    if (lower.contains('estación de buses') || lower.contains('bus')) {
      return loc.translate('map.category.bus_station');
    }
    if (lower.contains('punto de interés') || lower.contains('interest')) {
      return loc.translate('map.category.point_of_interest');
    }
    if (lower.contains('museo')) {
      return loc.translate('map.category.museum');
    }
    if (lower.contains('biblioteca')) {
      return loc.translate('map.category.library');
    }
    if (lower.contains('gimnasio') || lower.contains('gym')) {
      return loc.translate('map.category.gym');
    }
    if (lower.contains('hospital')) {
      return loc.translate('map.category.hospital');
    }
    if (lower.contains('farmacia')) {
      return loc.translate('map.category.pharmacy');
    }
    if (lower.contains('banco')) {
      return loc.translate('map.category.bank');
    }
    if (lower.contains('correos') || lower.contains('post')) {
      return loc.translate('map.category.post_office');
    }
    if (lower.contains('supermercado') || lower.contains('supermarket')) {
      return loc.translate('map.category.supermarket');
    }
    if (lower.contains('centro comercial') || lower.contains('mall')) {
      return loc.translate('map.category.shopping_mall');
    }
    if (lower.contains('parque de diversiones') || lower.contains('amusement')) {
      return loc.translate('map.category.amusement_park');
    }

    return category;
  }

  Widget _userLocationMarker(ThemeData theme) {
    final goldColor = const Color(0xFFD4AF37); // Color dorado/oro
    final bg = theme.colorScheme.surface;
    return GestureDetector(
      onLongPress: () {
        _showLocationTip();
      },
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bg,
          border: Border.all(color: goldColor, width: 2),
          boxShadow: [
            BoxShadow(color: goldColor.withOpacity(0.5), blurRadius: 10),
            BoxShadow(color: goldColor.withOpacity(0.3), blurRadius: 18, spreadRadius: 4),
          ],
        ),
        child: Icon(
          Icons.person_pin_circle,
          color: goldColor,
          size: 22,
        ),
      ),
    );
  }

  void _showLocationTip() {
    if (!_tipsEnabled) return;

    final tips = [
      '¿Sabías que puedes arrastrar tu ubicación para ver los lugares alrededor?',
      '¿Sabías que puedes reportar eventos o condiciones especiales en los lugares?',
      '¿Sabías que la información de los lugares es compartida por usuarios reales?',
      '¿Sabías que los lugares están verificados por la comunidad?',
    ];
    
    final randomTip = tips[DateTime.now().millisecond % tips.length];
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(randomTip),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'No mostrar más',
          onPressed: () {
            setState(() {
              _tipsEnabled = false;
            });
          },
        ),
      ),
    );
  }

  IconData _categoryIcon(String category) {
    final lower = category.toLowerCase();
    if (lower.contains('bar')) return Icons.local_bar;
    if (lower.contains('rest')) return Icons.restaurant;
    if (lower.contains('caf')) return Icons.coffee;
    if (lower.contains('parq') || lower.contains('park')) return Icons.park;
    if (lower.contains('hotel')) return Icons.hotel;
    if (lower.contains('tienda') || lower.contains('shop')) return Icons.storefront;
    if (lower.contains('cine')) return Icons.movie;
    if (lower.contains('estación de taxis') || lower.contains('taxi')) return Icons.local_taxi;
    if (lower.contains('estación de buses') || lower.contains('bus')) return Icons.directions_bus;
    if (lower.contains('punto de interés') || lower.contains('interest')) return Icons.place;
    if (lower.contains('museo')) return Icons.museum;
    if (lower.contains('biblioteca')) return Icons.library_books;
    if (lower.contains('gimnasio') || lower.contains('gym')) return Icons.fitness_center;
    if (lower.contains('hospital')) return Icons.local_hospital;
    if (lower.contains('farmacia')) return Icons.local_pharmacy;
    if (lower.contains('banco')) return Icons.account_balance;
    if (lower.contains('correos') || lower.contains('post')) return Icons.mail;
    if (lower.contains('supermercado') || lower.contains('supermarket')) return Icons.shopping_cart;
    if (lower.contains('centro comercial') || lower.contains('mall')) return Icons.shopping_bag;
    if (lower.contains('parque de diversiones') || lower.contains('amusement')) return Icons.attractions;
    return Icons.place_outlined;
  }

  Future<void> _loadRecommendations() async {
    try {
      final center = _mapController.camera.center;
      
      // NUEVO: Usar algoritmo avanzado
      final advancedRecs = await _recommendationService.getAdvancedRecommendations(
        lat: center.latitude,
        lon: center.longitude,
        radius: _selectedRadiusKm * 1000,
        count: 20,
      );
      
      if (advancedRecs.isNotEmpty && mounted) {
        // Convertir a objetos Place
        final places = advancedRecs.map((json) => Place.fromJson(json)).toList();
        
        setState(() {
          _recommended = places
              .where((p) => !_dismissedRecommendationIds.contains(p.id))
              .take(6)
              .toList();
          _recommendationCategory = places.first.category;
        });
        return;
      }
      
      // Fallback: Si no hay recomendaciones avanzadas, usar lógica anterior
      List<Place> data = [];

      // 1) Si el usuario eligió categorías manualmente, priorizamos esas.
      if (_selectedCategories.isNotEmpty) {
        data = await _placeService.searchPlaces(
          lat: center.latitude,
          lon: center.longitude,
          categories: _selectedCategories,
          radius: _selectedRadiusKm * 1000,
        );
        if (mounted) {
          setState(() {
            _recommended = data
                .where((p) => !_dismissedRecommendationIds.contains(p.id))
                .take(6)
                .toList();
            _recommendationCategory = null;
          });
        }
        return;
      }

      // 2) Usar resultados generales
      if (_results.isNotEmpty) {
        if (mounted) {
          setState(() {
            _recommended = _results
                .where((p) => !_dismissedRecommendationIds.contains(p.id))
                .take(6)
                .toList();
            _recommendationCategory = null;
          });
        }
        return;
      }

      data = await _placeService.searchPlaces(
        lat: center.latitude,
        lon: center.longitude,
        radius: _selectedRadiusKm * 1000,
      );
      if (mounted) {
        setState(() {
          _recommended = data
              .where((p) => !_dismissedRecommendationIds.contains(p.id))
              .take(6)
              .toList();
          _recommendationCategory = null;
        });
      }
    } catch (e) {
      print('Error loading recommendations: $e');
    }
  }

  Future<void> _loadAnnouncements() async {
    setState(() {
      _loadingAnnouncements = true;
    });

    try {
      final items = await _announcementService.fetchAnnouncements();
      if (!mounted) return;
      setState(() {
        _announcements = items;
        _loadingAnnouncements = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingAnnouncements = false;
      });
    }
  }

  Future<void> _checkNotifications() async {
    try {
      if (!_auth.isAuthenticated) return;

      final response = await _placeService.getUnreadNotifications();
      if (!mounted) return;
      
      if (response != null && response is List) {
        setState(() {
          _unreadNotificationsCount = response.length;
        });
      }
    } catch (e) {
      // Silenciar errores de notificaciones para no molestar al usuario
      debugPrint('Error checking notifications: $e');
    }
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _placeService.getAllCategories();
      if (!mounted) return;
      if (categories.isNotEmpty) {
        setState(() {
          _allCategories = categories..sort();
        });
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
    }
  }

  void _toggleCategory(String category) {
    setState(() {
      if (_selectedCategories.contains(category)) {
        _selectedCategories =
            _selectedCategories.where((c) => c != category).toList();
      } else {
        _selectedCategories = [..._selectedCategories, category];
      }
    });
    // Actualizar resultados en vivo según las categorías seleccionadas
    _loadInitialData(showErrorSnack: false);
  }

  void _changeRadius(int km) {
    if (_selectedRadiusKm == km) return;
    setState(() {
      _selectedRadiusKm = km;
      _radiusSliderValue = km.toDouble();
    });
    // Actualizar resultados en vivo cuando cambia la distancia
    _loadInitialData(showErrorSnack: false);
  }

  void _clearFilters() {
    if (_selectedCategories.isEmpty && _selectedRadiusKm == 5) return;
    setState(() {
      _selectedCategories = [];
      _selectedRadiusKm = 5;
      _radiusSliderValue = 5;
    });
    _loadInitialData();
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (!mounted) return false;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loc?.translate('map.enable_location') ?? 'Enable location services.',
          ),
        ),
      );
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      if (!mounted) return false;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loc?.translate('map.permission_required') ?? 'Grant location permissions to center the map.',
          ),
        ),
      );
      return false;
    }

    return true;
  }

  void _toggleFilters() {
    setState(() {
      _showFilters = !_showFilters;
    });
  }

  void _hideRecommendation(Place place) {
    setState(() {
      _dismissedRecommendationIds.add(place.id);
      _recommended = _recommended
          .where((p) => !_dismissedRecommendationIds.contains(p.id))
          .toList();
    });
  }

  void _snoozeRecommendation(Place place) {
    setState(() {
      _recommended = _recommended.where((p) => p.id != place.id).toList();
    });
  }

  Widget _buildAnnouncementBanner(ThemeData theme) {
    if (_loadingAnnouncements) {
      return Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    theme.colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _loc?.translate('map.announcements.loading') ??
                    'Cargando anuncios...',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final visible = _announcements
        .where((a) => !_dismissedAnnouncementIds.contains(a.id))
        .toList();

    if (visible.isEmpty) {
      return const SizedBox.shrink();
    }

    visible.sort((a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      final aTime = a.createdAt?.millisecondsSinceEpoch ?? 0;
      final bTime = b.createdAt?.millisecondsSinceEpoch ?? 0;
      return bTime.compareTo(aTime);
    });

    final ann = visible.first;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AnnouncementDetailScreen(announcement: ann),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.primary.withOpacity(0.4),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.campaign,
              color: theme.colorScheme.primary,
              size: 24,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          ann.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                      ),
                      if (ann.pinned) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            _loc?.translate('map.announcements.pinned') ??
                                'Fijado',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onPrimary,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ann.message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close),
              tooltip:
                  _loc?.translate('map.announcements.dismiss') ?? 'Descartar',
              onPressed: () {
                setState(() {
                  _dismissedAnnouncementIds.add(ann.id);
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendedSection(ThemeData theme) {
    if (_recommended.isEmpty) {
      return const SizedBox.shrink();
    }

    String _titleText() {
      if (_recommendationCategory != null && _recommendationCategory!.isNotEmpty) {
        final prefix =
            _loc?.translate('map.recommended_because_prefix') ??
                'Porque sueles buscar ';
        final suffix =
            _loc?.translate('map.recommended_because_suffix') ??
                ', quizá te interesen estos lugares';
        return '$prefix${_recommendationCategory!}$suffix';
      }
      return _loc?.translate('map.recommended_for_you') ?? 'Recomendados para ti';
    }

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        _titleText(),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: theme.colorScheme.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(Icons.auto_awesome, size: 18, color: theme.colorScheme.primary),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  _recommendationsMinimized ? Icons.expand_more : Icons.expand_less,
                  color: theme.colorScheme.primary,
                ),
                onPressed: () {
                  setState(() {
                    _recommendationsMinimized = !_recommendationsMinimized;
                  });
                },
                tooltip: _recommendationsMinimized ? 'Expandir' : 'Minimizar',
              ),
            ],
          ),
          if (!_recommendationsMinimized) ...[
            const SizedBox(height: 10),
            SizedBox(
              // Altura ligeramente mayor para evitar BOTTOM OVERFLOWED en tarjetas
              height: 210,
              child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _recommended.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, index) {
                final place = _recommended[index];
                final isFavorite = _auth.isPlaceFavorite(place.id);
                return GestureDetector(
                  onTap: () {
                    // Track engagement (silenciar error si falla)
                    _recommendationService.trackEngagement(place.id, 'VIEW').catchError((_) {});
                    _placeViewStartTime = DateTime.now();
                    
                    setState(() => _selectedPlace = place);
                    _mapController.move(
                      LatLng(place.latitude, place.longitude),
                      _mapController.camera.zoom < 14
                          ? _mapController.camera.zoom + 1
                          : _mapController.camera.zoom,
                    );
                  },
                  child: Container(
                    width: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: theme.colorScheme.surfaceVariant,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(16),
                            topRight: Radius.circular(16),
                          ),
                          child: place.officialImages.isNotEmpty
                              ? Image.network(
                                  place.officialImages.first,
                                  height: 90,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    height: 90,
                                    width: double.infinity,
                                    color: theme.colorScheme.primary.withOpacity(0.15),
                                    child: Icon(
                                      Icons.image,
                                      size: 32,
                                      color: theme.colorScheme.primary.withOpacity(0.5),
                                    ),
                                  ),
                                )
                              : Container(
                                  height: 90,
                                  width: double.infinity,
                                  color: theme.colorScheme.primary.withOpacity(0.15),
                                  child: Icon(
                                    Icons.image,
                                    size: 32,
                                    color: theme.colorScheme.primary.withOpacity(0.5),
                                  ),
                                ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                place.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.star, size: 14, color: Colors.amber),
                                  const SizedBox(width: 4),
                                  Text(
                                    place.rating.toStringAsFixed(1),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  if (isFavorite)
                                    Icon(
                                      Icons.bookmark,
                                      size: 14,
                                      color: theme.colorScheme.primary,
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: TextButton(
                                onPressed: () => _hideRecommendation(place),
                                child: Text(
                                  _loc?.translate('map.recommendation.hide') ?? 'Ocultar',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.primary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            Flexible(
                              child: TextButton(
                                onPressed: () => _snoozeRecommendation(place),
                                child: Text(
                                  _loc?.translate('map.recommendation.later') ?? 'Recordar más tarde',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.primary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
            ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterPanel(ThemeData theme, {bool isSheet = false}) {
    final categories = _availableCategories;
    final surface = theme.colorScheme.surface;
    final onSurface = theme.colorScheme.onSurface;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        color: surface.withOpacity(isSheet ? 1 : 0.92),
        borderRadius: BorderRadius.circular(isSheet ? 28 : 24),
        border: Border.all(color: theme.dividerColor.withOpacity(0.2)),
        boxShadow: isSheet
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      padding: EdgeInsets.symmetric(
        horizontal: isSheet ? 20 : 16,
        vertical: isSheet ? 18 : 14,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                _loc?.translate('map.filters.smart') ?? 'Filtros inteligentes',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: (_selectedCategories.isEmpty && _selectedRadiusKm == 5)
                    ? null
                    : _clearFilters,
                icon: const Icon(Icons.refresh, size: 18),
                label: Text(
                  _loc?.translate('map.filters.reset') ?? 'Restablecer',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: categories.isEmpty
                ? Center(
                    child: Text(
                      _loc?.translate('map.filters.no_categories') ??
                          'Sin categorías disponibles',
                      style: theme.textTheme.bodySmall,
                    ),
                  )
                : ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, index) {
                      final category = categories[index];
                      final selected = _selectedCategories.contains(category);
                      return FilterChip(
                        avatar: Icon(
                          _categoryIcon(category),
                          size: 16,
                          color: selected ? theme.colorScheme.onPrimary : theme.colorScheme.primary,
                        ),
                        label: Text(_categoryLabel(category)),
                        selected: selected,
                        onSelected: (_) => _toggleCategory(category),
                        showCheckmark: false,
                        labelStyle: theme.textTheme.bodySmall?.copyWith(
                          color: selected ? theme.colorScheme.onPrimary : onSurface,
                        ),
                        backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                        selectedColor: theme.colorScheme.primary,
                      );
                    },
                  ),
          ),
          const SizedBox(height: 18),
          Text(
            _loc?.translate('map.filters.distance') != null
                ? '${_loc!.translate('map.filters.distance')} (${_selectedRadiusKm} km)'
                : 'Distancia (${_selectedRadiusKm} km)',
            style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          Slider.adaptive(
            min: 1,
            max: 20,
            divisions: 19,
            label: '${_radiusSliderValue.round()} km',
            value: _radiusSliderValue.clamp(1, 20),
            onChanged: (value) {
              setState(() => _radiusSliderValue = value);
            },
            onChangeEnd: (value) => _changeRadius(value.round()),
          ),
          if (isSheet) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                // Aquí solo cerramos la hoja; la recarga ya se hizo al cambiar chips/slider
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.check_circle_outline),
                label: Text(
                  _loc?.translate('map.filters.apply') ?? 'Aplicar filtros',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // -------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------
  @override
  void dispose() {
    _searchCtrl.dispose();
    _announcementTimer?.cancel();
    _notificationTimer?.cancel();
    super.dispose();
  }

  // -------------------------------------------------
  // METHODS
  // -------------------------------------------------
  Future<void> _loadInitialData({bool showErrorSnack = true}) async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final center = _userPos != null
          ? LatLng(_userPos!.latitude, _userPos!.longitude)
          : _mapController.camera.center;
      List<Place> data = await _placeService.searchPlaces(
        lat: center.latitude,
        lon: center.longitude,
        radius: _selectedRadiusKm * 1000,
        categories: _selectedCategories.isEmpty ? null : _selectedCategories,
      );

      // Si no hay resultados y no hay filtros activos, intentamos con un radio mayor
      if (data.isEmpty && _selectedCategories.isEmpty) {
        data = await _placeService.searchPlaces(
          lat: center.latitude,
          lon: center.longitude,
          radius: 12000,
        );
      }
      final newCats =
          data.map((p) => p.category).where((c) => c.isNotEmpty).toSet();
      if (mounted) {
        setState(() {
          _results = data;
          if (newCats.isNotEmpty) {
            final merged = {..._allCategories, ...newCats};
            _allCategories = merged.toList()..sort();
          }
          _isLoading = false;
          _selectedPlace = null;
        });
        
        // Cargar recomendaciones automáticamente al entrar
        if (!_autoLoadedRecommendations) {
          _autoLoadedRecommendations = true;
          _loadRecommendations();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        if (showErrorSnack) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_loc?.translate('map.error_loading') ?? 'Error loading places')),
          );
        }
      }
    }
  }

  Future<void> _searchPlaces(String query) async {
    if (query.trim().isEmpty) {
      _loadInitialData();
      return;
    }
    setState(() => _isLoading = true);
    try {
      // Usar coordenadas actuales o por defecto
      final center = _mapController.camera.center;
      final data = await _placeService.searchPlaces(
        lat: center.latitude,
        lon: center.longitude,
        keyword: query,
        categories: _selectedCategories.isEmpty ? null : _selectedCategories,
        radius: _selectedRadiusKm * 1000,
      );
      if (mounted) {
        setState(() {
          _results = data;
          final newCats =
              data.map((p) => p.category).where((c) => c.isNotEmpty).toSet();
          if (newCats.isNotEmpty) {
            final merged = {..._allCategories, ...newCats};
            _allCategories = merged.toList()..sort();
          }
          _isLoading = false;
          _selectedPlace = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_loc?.translate('map.error') ?? 'Error')),
        );
      }
    }
  }

  Future<void> _searchInCustomArea() async {
    if (_customSearchPin == null) return;
    
    setState(() => _isSearchingArea = true);
    
    try {
      final data = await _placeService.searchPlaces(
        lat: _customSearchPin!.latitude,
        lon: _customSearchPin!.longitude,
        radius: _selectedRadiusKm * 1000,
        categories: _selectedCategories.isEmpty ? null : _selectedCategories,
      );
      
      if (mounted) {
        setState(() {
          _results = data;
          _isSearchingArea = false;
          _selectedPlace = null;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              (_loc?.translate('map.search_area.found') ?? 'Found {count} places')
                  .replaceAll('{count}', data.length.toString()),
            ),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSearchingArea = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_loc?.translate('map.error') ?? 'Error')),
        );
      }
    }
  }

  Future<void> _centerOnUser() async {
    // Si no hay permisos de ubicación, usamos modo demo centrado en Barranquilla
    final hasPermission = await _ensureLocationPermission();
    if (!hasPermission) {
      const barranquilla = LatLng(10.9685, -74.7813);
      if (!mounted) return;
      setState(() {
        _userPos = Position(
          latitude: barranquilla.latitude,
          longitude: barranquilla.longitude,
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
          floor: null,
          isMocked: true,
        );
        _locatingMsg = _loc?.translate('map.demo_barranquilla') ?? 'Demo mode: Barranquilla center';
      });
      _mapController.move(barranquilla, 15);
      return;
    }
    setState(() {
      _isLocating = true;
      _locatingMsg = _loc?.translate('map.getting_location') ?? 'Getting location...';
    });

    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 8));
      
      if (!mounted) return;
      setState(() {
        _userPos = pos;
        _isLocating = false;
        _locatingMsg = _loc?.translate('map.location_found') ?? 'Location found';
      });
      _mapController.move(LatLng(pos.latitude, pos.longitude), 15);
      _loadInitialData(showErrorSnack: false);
      _loadRecommendations();
    } on TimeoutException {
      await _useFallbackPosition(_loc?.translate('map.timeout') ?? 'Timeout exceeded');
    } catch (e) {
      try {
        final alt = await GeolocatorPlatform.instance
            .getCurrentPosition()
            .timeout(const Duration(seconds: 8));
        
        if (!mounted) return;
        setState(() {
          _userPos = alt;
          _isLocating = false;
          _locatingMsg = _loc?.translate('map.location_found') ?? 'Location found';
        });
        _mapController.move(LatLng(alt.latitude, alt.longitude), 15);
        _loadInitialData(showErrorSnack: false);
        _loadRecommendations();
      } catch (secondError) {
        await _useFallbackPosition('${e.toString()} | ${secondError.toString()}');
      }
    }
  }

  Future<void> _useFallbackPosition(String reason) async {
    Position? last;
    try {
      last = await Geolocator.getLastKnownPosition();
    } catch (_) {
      // Algunas implementaciones web lanzan UnsupportedError; ignoramos.
      if (!kIsWeb) rethrow;
    }
    if (last != null) {
      if (!mounted) return;
      setState(() {
        _userPos = last;
        _isLocating = false;
        _locatingMsg = _loc?.translate('map.last_known_location') ?? 'Showing last known location';
      });
      _mapController.move(LatLng(last.latitude, last.longitude), 15);
      _loadInitialData(showErrorSnack: false);
      _loadRecommendations();
      return;
    }
    if (!mounted) return;
    setState(() {
      _isLocating = false;
      _locatingMsg = _loc?.translate('map.location_error') ?? 'Could not get location';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _loc?.translate('map.gps_error') ?? 'Enable GPS and verify permissions.',
        ),
      ),
    );
  }

  Widget _buildPopupFor(Place place) {
    final theme = Theme.of(context);
    final neon = theme.colorScheme.primary;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 400;
    final maxWidth = isSmallScreen ? screenWidth - 40 : 350.0;

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: maxWidth,
        minWidth: isSmallScreen ? screenWidth - 40 : 320.0,
      ),
      child: Card(
        elevation: 8,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: theme.colorScheme.surface,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: place.officialImages.isNotEmpty
                        ? Stack(
                            children: [
                              Image.network(
                                place.officialImages.last,
                                width: isSmallScreen ? 45 : 50,
                                height: isSmallScreen ? 45 : 50,
                                fit: BoxFit.cover,
                              ),
                              Positioned(
                                left: 2,
                                bottom: 2,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.6),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    _loc?.translate('place.detail.official_badge') ?? 'Oficial Bedic',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 8,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Container(
                            width: isSmallScreen ? 45 : 50,
                            height: isSmallScreen ? 45 : 50,
                            color: theme.colorScheme.primary.withOpacity(0.15),
                            child: Icon(
                              Icons.image_not_supported,
                              size: isSmallScreen ? 20 : 24,
                              color: theme.colorScheme.primary.withOpacity(0.5),
                            ),
                          ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          place.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            fontSize: isSmallScreen ? 13 : 14,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(Icons.star, size: 12, color: Colors.amber),
                            const SizedBox(width: 2),
                            Text(
                              place.rating.toStringAsFixed(1),
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: isSmallScreen ? 11 : 12,
                                fontWeight: FontWeight.w600,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: neon.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  place.category,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: neon,
                                    fontSize: isSmallScreen ? 10 : 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () async {
                        double distanceMeters = 0;
                        if (_userPos != null) {
                          final userLatLng = LatLng(_userPos!.latitude, _userPos!.longitude);
                          final placeLatLng = LatLng(place.latitude, place.longitude);
                          distanceMeters = const Distance().as(
                            LengthUnit.Meter,
                            userLatLng,
                            placeLatLng,
                          );
                        }

                        try {
                          await _placeService.sendInteraction(
                            category: place.category,
                            distance: distanceMeters,
                          );
                        } catch (_) {
                          // si falla el tracking, no bloqueamos la navegación
                        }

                        if (!mounted) return;
                        
                        // Track engagement - Detail View
                        final duration = _placeViewStartTime != null
                            ? DateTime.now().difference(_placeViewStartTime!).inSeconds
                            : 0;
                        _recommendationService.trackEngagement(
                          place.id,
                          'DETAIL_VIEW',
                          duration: duration,
                        );
                        
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PlaceDetailScreen(place: place),
                          ),
                        );
                      },
                      icon: Icon(Icons.info_outline, size: isSmallScreen ? 16 : 18),
                      label: Text(
                        _loc?.translate('place.detail.see_more') ?? 'Ver más',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 11 : 12,
                          color: neon,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: neon,
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () {
                        _mapController.move(
                          LatLng(place.latitude, place.longitude),
                          _mapController.camera.zoom,
                        );
                      },
                      icon: Icon(Icons.center_focus_strong, size: isSmallScreen ? 16 : 18),
                      label: Text(
                        _loc?.translate('place.detail.center') ?? 'Centrar',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 11 : 12,
                          color: neon,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: neon,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _neonPulse({required Color neon, IconData icon = Icons.location_on}) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: neon.withOpacity(0.1),
        border: Border.all(color: neon, width: 2),
        boxShadow: [
          BoxShadow(color: neon.withOpacity(0.6), blurRadius: 10),
          BoxShadow(color: neon.withOpacity(0.3), blurRadius: 20, spreadRadius: 5),
        ],
      ),
      child: Icon(icon, color: neon, size: 20),
    );
  }

  void _openUserMenu() {
    // Navegar directamente al perfil, sin mostrar menú extra
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const ProfileScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final neon = theme.colorScheme.primary;
    final l = LocalizationService.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Mapa con GestureDetector para cerrar filtros y popup
          GestureDetector(
            onTap: () {
              if (_showFilters || _selectedPlace != null) {
                setState(() {
                  _showFilters = false;
                  _selectedPlace = null;
                });
              }
            },
            child: FlutterMap(
              key: ValueKey('map_${isDark}'),
              mapController: _mapController,
              options: MapOptions(
                initialCenter: const LatLng(10.9685, -74.7813),
                initialZoom: 13,
                onPositionChanged: (pos, reason) {
                  if (reason == MapEventSource.mapController) {
                    setState(() {
                      _mapRotationRad = pos.rotation ?? 0;
                    });
                  }
                },
              ),
            children: [
              TileLayer(
                key: ValueKey('tile_${isDark}'),
                urlTemplate: isDark
                    ? 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
                    : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c'],
                userAgentPackageName: 'com.example.app',
              ),
              // Círculo de radio visible
              if (_userPos != null)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: LatLng(_userPos!.latitude, _userPos!.longitude),
                      radius: _selectedRadiusKm * 1000, // metros
                      useRadiusInMeter: true,
                      color: neon.withOpacity(0.1),
                      borderColor: neon.withOpacity(0.4),
                      borderStrokeWidth: 2,
                    ),
                  ],
                ),
              // Marcadores individuales (sin clusters)
              MarkerLayer(
                markers: _results.map((p) {
                  final isSelected = _selectedPlace?.id == p.id;
                  final markerColor = isSelected
                      ? theme.colorScheme.secondary
                      : neon;
                  return Marker(
                    width: 44,
                    height: 44,
                    point: LatLng(p.latitude, p.longitude),
                    child: GestureDetector(
                      onTap: () {
                        // Track engagement (silenciar error si falla)
                        _recommendationService
                            .trackEngagement(p.id, 'POPUP_OPEN')
                            .catchError((_) {});
                        _placeViewStartTime = DateTime.now();

                        setState(() {
                          _selectedPlace = p;
                        });
                      },
                      child: _neonPulse(neon: markerColor),
                    ),
                  );
                }).toList(),
              ),
              MarkerLayer(
                markers: [
                  if (_userPos != null)
                    Marker(
                      width: 60,
                      height: 60,
                      point: LatLng(_userPos!.latitude, _userPos!.longitude),
                      child: Draggable(
                        feedback: Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFD4AF37).withOpacity(0.7),
                            border: Border.all(color: const Color(0xFFD4AF37), width: 2),
                          ),
                          child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 28),
                        ),
                        onDragEnd: (details) {
                          final RenderBox renderBox = context.findRenderObject() as RenderBox;
                          final localPosition = renderBox.globalToLocal(details.offset);
                          final mapSize = renderBox.size;
                          final bounds = _mapController.camera.visibleBounds;
                          final lat = bounds.north - (localPosition.dy / mapSize.height) * (bounds.north - bounds.south);
                          final lon = bounds.west + (localPosition.dx / mapSize.width) * (bounds.east - bounds.west);
                          setState(() {
                            _userPos = Position(
                              latitude: lat,
                              longitude: lon,
                              timestamp: DateTime.now(),
                              accuracy: _userPos!.accuracy,
                              altitude: _userPos!.altitude,
                              altitudeAccuracy: _userPos!.altitudeAccuracy,
                              heading: _userPos!.heading,
                              headingAccuracy: _userPos!.headingAccuracy,
                              speed: _userPos!.speed,
                              speedAccuracy: _userPos!.speedAccuracy,
                            );
                            _customSearchPin = LatLng(lat, lon);
                          });
                          _searchInCustomArea();
                        },
                        child: _userLocationMarker(theme),
                      ),
                    ),
                ],
              ),
            ],
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 100,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, animation) {
                return FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.1),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                );
              },
              child: _selectedPlace != null
                  ? _buildPopupFor(_selectedPlace!)
                  : const SizedBox.shrink(),
            ),
          ),

          // UI Overlay
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(40),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchCtrl,
                            decoration: InputDecoration(
                              hintText: _loc?.translate('map.search_hint') ??
                                  'Buscar lugares...',
                              prefixIcon: const Icon(Icons.search),
                              suffixIcon: IconButton(
                                icon: const Icon(Icons.tune),
                                onPressed: _toggleFilters,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(40),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                            ),
                            onTap: _toggleFilters,
                            onSubmitted: _searchPlaces,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Botón de notificaciones con badge en tiempo real
                      Consumer<NotificationProvider>(
                        builder: (context, notificationProvider, _) {
                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const NotificationsScreen(),
                                ),
                              );
                              notificationProvider.markAsRead();
                            },
                            borderRadius: BorderRadius.circular(24),
                            child: Stack(
                              children: [
                                CircleAvatar(
                                  radius: 22,
                                  backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
                                  child: Icon(Icons.notifications, color: theme.colorScheme.primary),
                                ),
                                if (notificationProvider.hasUnread)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 2),
                                      ),
                                      constraints: const BoxConstraints(
                                        minWidth: 20,
                                        minHeight: 20,
                                      ),
                                      child: Text(
                                        notificationProvider.unreadCount > 99 ? '99+' : '${notificationProvider.unreadCount}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 12),
                      InkWell(
                        onTap: _openUserMenu,
                        borderRadius: BorderRadius.circular(24),
                        child: CircleAvatar(
                          radius: 22,
                          backgroundColor: theme.colorScheme.primary,
                          child: const Icon(Icons.person, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  if (_showFilters) ...[
                    const SizedBox(height: 12),
                    _buildFilterPanel(theme),
                    const SizedBox(height: 12),
                  ],
                  _buildAnnouncementBanner(theme),
                  const SizedBox(height: 8),
                  _buildRecommendedSection(theme),

                  const SizedBox(height: 12),

                  // Pin de búsqueda eliminado - funcionalidad integrada en el marcador de ubicación
                ],
              ),
            ),
          ),

          // Panel de ubicación (parte inferior fijo)
          Positioned(
            bottom: 80,
            right: 16,
            child: _isLocating
                ? Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _locatingMsg,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  )
                : FloatingActionButton(
                    heroTag: 'my_location',
                    onPressed: _centerOnUser,
                    tooltip: _loc?.translate('map.my_location') ?? 'Mi ubicación',
                    child: const Icon(Icons.my_location),
                  ),
          ),

          // Loading overlay
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
      floatingActionButton: null,
    );
  }
}

class _RadiusChip extends StatelessWidget {
  final int km;
  const _RadiusChip({required this.km});

  @override
  Widget build(BuildContext context) {
    final state = context.findAncestorStateOfType<_MapScreenState>();
    final selected = state?._selectedRadiusKm == km;
    return ChoiceChip(
      label: Text('${km} km'),
      selected: selected,
      onSelected: (_) => state?._changeRadius(km),
    );
  }
}

// -------------------------------------------------
// NEON LOADER
// -------------------------------------------------
class NeonLogoLoader extends StatefulWidget {
  final double size;
  const NeonLogoLoader({super.key, this.size = 84});

  @override
  State<NeonLogoLoader> createState() => _NeonLogoLoaderState();
}

class _NeonLogoLoaderState extends State<NeonLogoLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _dot(double s, double sc, Color neon) {
    return Transform.scale(
      scale: sc,
      child: Container(
        width: s,
        height: s,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: neon.withOpacity(0.2),
          border: Border.all(color: neon.withOpacity(0.9), width: 2),
          boxShadow: [
            BoxShadow(color: neon.withOpacity(0.9), blurRadius: 22),
            BoxShadow(
              color: neon.withOpacity(0.4),
              blurRadius: 30,
              spreadRadius: 8,
            ),
          ],
        ),
      ),
    );
  }

  Widget _ring(double s, double sc, Color neon, double rotate) {
    return Transform.rotate(
      angle: rotate,
      child: Transform.scale(
        scale: sc,
        child: Container(
          width: s,
          height: s,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(s * 0.22),
            border: Border.all(color: neon.withOpacity(0.9), width: 2),
            boxShadow: [
              BoxShadow(color: neon.withOpacity(0.9), blurRadius: 18),
              BoxShadow(
                color: neon.withOpacity(0.4),
                blurRadius: 32,
                spreadRadius: 8,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final neon = Theme.of(context).colorScheme.primary;
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final t = _ctrl.value;
        final s1 = 0.85 + 0.15 * sin(t * 2 * pi);
        final s2 = 0.85 + 0.15 * sin((t + 0.33) * 2 * pi);
        final s3 = 0.85 + 0.15 * sin((t + 0.66) * 2 * pi);

        return SizedBox(
          width: widget.size,
          height: widget.size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              _ring(widget.size * 0.55, s1, neon, t * 2 * pi),
              _ring(widget.size * 0.36, s2, neon, -t * 2 * pi),
              _dot(widget.size * 0.14, s3, neon),
            ],
          ),
        );
      },
    );
  }
}
