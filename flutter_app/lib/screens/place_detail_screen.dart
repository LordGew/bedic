// lib/screens/place_detail_screen.dart

import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../i18n/localization_service.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/place_service.dart';
import '../services/auth_service.dart';
import 'admin_place_editor_screen.dart';
import 'report_form_screen.dart';
import '../components/report_item_widget.dart';
import 'events_screen.dart';
import 'rating_form_screen.dart';
import 'public_profile_screen.dart';
import 'rating_comments_screen.dart';
import 'profile_screen.dart';
import '../i18n/localization_service.dart';

class PlaceDetailScreen extends StatefulWidget {
  final Place place;

  const PlaceDetailScreen({super.key, required this.place});

  @override
  State<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends State<PlaceDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  late PageController _photoPageController;
  int _currentPhotoIndex = 0;

  late Place _place;
  final ImagePicker _picker = ImagePicker();
  bool _uploadingPlacePhoto = false;
  bool _isFavorite = false;

  Future<List<Report>>? _reportsFuture;
  Future<List<PlaceRating>>? _ratingsFuture;
  Future<List<PlaceEvent>>? _eventsFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _photoPageController = PageController();
    _place = widget.place;
    final auth = Provider.of<AuthService>(context, listen: false);
    _isFavorite = auth.isPlaceFavorite(widget.place.id);
    _loadData();
  }

  void _loadData() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _reportsFuture = placeService.getReportsForPlace(widget.place.id);
      _ratingsFuture = placeService.getRatingsForPlace(widget.place.id);
      _eventsFuture = placeService.getEventsForPlace(widget.place.id);
    });
  }

  Future<void> _toggleFavorite() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final placeService = Provider.of<PlaceService>(context, listen: false);

    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('saved_places.login_required'))),
      );
      return;
    }

    final wasFavorite = _isFavorite;
    setState(() {
      _isFavorite = !wasFavorite;
    });

    try {
      if (!wasFavorite) {
        await placeService.addPlaceToFavorites(widget.place.id);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('place.detail.saved_to_favorites')),
          ),
        );
      } else {
        await placeService.removePlaceFromFavorites(widget.place.id);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('place.detail.removed_from_favorites')),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isFavorite = wasFavorite;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${context.tr('place.detail.favorite_error')}: $e',
          ),
        ),
      );
    }
  }

  Future<void> _pickOfficialPlacePhoto(String placeId) async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
    );
    if (picked == null) return;

    Uint8List bytes;
    if (kIsWeb) {
      bytes = await picked.readAsBytes();
    } else {
      bytes = await File(picked.path).readAsBytes();
    }

    setState(() {
      _uploadingPlacePhoto = true;
    });

    try {
      final placeService = Provider.of<PlaceService>(context, listen: false);
      final filename = 'place_${placeId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await placeService.uploadOfficialPlacePhoto(
        placeId: placeId,
        bytes: bytes,
        filename: filename,
      );

      final refreshed = await placeService.fetchPlaceById(placeId);
      if (!mounted) return;
      setState(() {
        _place = refreshed;
        _uploadingPlacePhoto = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _uploadingPlacePhoto = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo subir la foto del lugar: $e')),
      );
    }
  }

  Future<void> _voteRating(String ratingId, bool isHelpful) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      if (isHelpful) {
        await placeService.upvoteRating(ratingId);
      } else {
        await placeService.downvoteRating(ratingId);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isHelpful
                ? 'Has marcado la opinión como útil'
                : 'Has marcado la opinión como no útil',
          ),
        ),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo registrar tu voto: $e')),
      );
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _photoPageController.dispose();
    super.dispose();
  }

  Future<void> _launchMapsUrl(double lat, double lon) async {
    final Uri url =
        Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lon');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception('No se pudo abrir $url');
    }
  }

  Future<void> _sharePlace() async {
    final name = _place.name;
    final lat = _place.latitude.toString();
    final lon = _place.longitude.toString();
    final base = context.tr('place.detail.share_message').replaceAll('{name}', name);
    final mapsUrl = 'https://www.google.com/maps/search/?api=1&query=$lat,$lon';
    final text = '$base\n$mapsUrl';

    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.tr('place.detail.share_copied')),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context, listen: false);
    final isAdmin = auth.currentUser?.role == 'admin' || auth.currentUser?.role == 'moderator';

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                _place.name,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (_place.verified)
              Padding(
                padding: const EdgeInsets.only(left: 6),
                child: Icon(
                  Icons.verified,
                  size: 20,
                  color: Colors.blue.shade400,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isFavorite ? Icons.bookmark : Icons.bookmark_border,
            ),
            tooltip: _isFavorite
                ? context.tr('place.detail.unfavorite_tooltip')
                : context.tr('place.detail.favorite_tooltip'),
            onPressed: _toggleFavorite,
          ),
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: context.tr('place.detail.share_tooltip'),
            onPressed: _sharePlace,
          ),
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.edit_location_alt),
              tooltip: context.tr('place.detail.edit_tooltip'),
              onPressed: () async {
                final placeService =
                    Provider.of<PlaceService>(context, listen: false);
                // Usamos los datos actuales del widget.place; si vuelves con un Place
                // actualizado, podrías actualizar el estado local si lo necesitas.
                final updated = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => AdminPlaceEditorScreen(place: widget.place),
                  ),
                );
                if (updated != null && updated is Place) {
                  // Opcional: recargar detalles y listas
                  _loadData();
                }
              },
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(icon: const Icon(Icons.info_outline), text: context.tr('place.detail.tabs.info')),
            Tab(icon: const Icon(Icons.comment), text: context.tr('place.detail.tabs.reports')),
            Tab(icon: const Icon(Icons.event), text: context.tr('place.detail.tabs.events')),
            Tab(icon: const Icon(Icons.star_border), text: context.tr('place.detail.tabs.ratings')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildInfoTab(_place, isAdmin),
          _buildReportsTab(),
          _buildEventsTab(),
          _buildRatingsTab(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        ReportFormScreen(placeId: widget.place.id),
                  ),
                ).then((_) {
                  _loadData();
                });
              },
              icon: const Icon(Icons.add_comment),
              label: Text(context.tr('place.detail.contribute')),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoTab(Place place, bool isAdmin) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 250,
            color: Colors.grey[300],
            child: (place.officialImages.isEmpty)
                ? const Center(
                    child: Icon(Icons.image_not_supported,
                        size: 50, color: Colors.grey),
                  )
                : Stack(
                    children: [
                      PageView.builder(
                        controller: _photoPageController,
                        itemCount: place.officialImages.length,
                        onPageChanged: (index) {
                          setState(() {
                            _currentPhotoIndex = index;
                          });
                        },
                        itemBuilder: (context, index) {
                          final url = place.officialImages[index];
                          return Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.network(
                                url,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, progress) {
                                  return progress == null
                                      ? child
                                      : const Center(
                                          child: CircularProgressIndicator());
                                },
                                errorBuilder: (context, error, stackTrace) {
                                  return const Center(
                                      child: Icon(Icons.error_outline,
                                          color: Colors.red));
                                },
                              ),
                              Positioned(
                                left: 12,
                                bottom: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.55),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.verified, size: 14, color: Colors.white),
                                      const SizedBox(width: 6),
                                      Text(
                                        context.tr('place.detail.official_photo'),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                      if (isAdmin)
                        Positioned(
                          right: 12,
                          top: 12,
                          child: IconButton(
                            icon: _uploadingPlacePhoto
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.add_a_photo, color: Colors.white),
                            tooltip: 'Añadir foto oficial',
                            onPressed:
                                _uploadingPlacePhoto ? null : () => _pickOfficialPlacePhoto(place.id),
                          ),
                        ),
                    ],
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  place.name,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                ActionChip(
                  label: Text(place.category),
                  onPressed: () {},
                ),
                const Divider(height: 32),
                GestureDetector(
                  onTap: () =>
                      _launchMapsUrl(place.latitude, place.longitude),
                  child: ListTile(
                    leading: const Icon(Icons.location_on),
                    title: Text(context.tr('place.detail.address')),
                    subtitle: Text(
                        context.tr('place.detail.tap_navigate').replaceAll('{lat}', place.latitude.toString()).replaceAll('{lon}', place.longitude.toString())),
                    trailing: const Icon(Icons.navigation),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.star),
                  title: Text(context.tr('place.detail.avg_rating')),
                  subtitle: Text(place.rating.toStringAsFixed(1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildReportsTab() {
    return FutureBuilder<List<Report>>(
      future: _reportsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
              child: Text('Error al cargar reportes: ${snapshot.error}'));
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
              child: Text('Aún no hay reportes para este lugar. ¡Sé el primero!'));
        }

        final reports = snapshot.data!;
        return ListView.builder(
          itemCount: reports.length,
          itemBuilder: (context, index) {
            return ReportItemWidget(report: reports[index]);
          },
        );
      },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EVENTOS
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildEventsTab() {
    return FutureBuilder<List<PlaceEvent>>(
      future: _eventsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Text('Error al cargar eventos: ${snapshot.error}'),
          );
        }

        final events = snapshot.data ?? [];

        if (events.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.event, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  context.tr('events.empty_title'),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  context.tr('events.empty_subtitle'),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            EventsScreen(placeId: widget.place.id),
                      ),
                    ).then((created) {
                      if (created == true) {
                        _loadData();
                      }
                    });
                  },
                  child: Text(context.tr('events.empty_button')),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.event_available),
              title: Text(context.tr('events.tab_title')),
              subtitle: Text(() {
                final count = events.length;
                final key = count == 1
                    ? 'events.list_subtitle_single'
                    : 'events.list_subtitle_plural';
                return context
                    .tr(key)
                    .replaceFirst('{count}', count.toString());
              }()),
              trailing: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          EventsScreen(placeId: widget.place.id),
                    ),
                  ).then((created) {
                    if (created == true) {
                      _loadData();
                    }
                  });
                },
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final ev = events[index];
                  final dateText = ev.date != null
                      ? '${ev.date!.toLocal()}'.split('.')[0]
                      : context.tr('events.date_undefined');
                  return Card(
                    margin:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(Icons.event_note),
                            title: Text(ev.title),
                            subtitle: Text(
                              '$dateText\n${ev.description}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            isThreeLine: true,
                            trailing: Text('@${ev.username}'),
                          ),
                          const SizedBox(height: 4),
                          if (ev.interestedCount > 0 ||
                              ev.notInterestedCount > 0 ||
                              ev.maybeCount > 0 ||
                              ev.goingCount > 0) ...[
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8.0),
                              child: Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  if (ev.goingCount > 0)
                                    Text(
                                        '${ev.goingCount} ${context.tr('events.actions.going')}'),
                                  if (ev.interestedCount > 0)
                                    Text(
                                        '${ev.interestedCount} ${context.tr('events.actions.interested')}'),
                                  if (ev.maybeCount > 0)
                                    Text(
                                        '${ev.maybeCount} ${context.tr('events.actions.maybe')}'),
                                  if (ev.notInterestedCount > 0)
                                    Text(
                                        '${ev.notInterestedCount} ${context.tr('events.actions.not_interested')}'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                          ],
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 8.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  context.tr('events.response.title'),
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                // Opciones de respuesta con diseño mejorado
                                GridView.count(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisCount: 2,
                                  childAspectRatio: 2.5,
                                  mainAxisSpacing: 8,
                                  crossAxisSpacing: 8,
                                  children: [
                                    _buildResponseButton(
                                      context,
                                      'going',
                                      context.tr('events.response.going'),
                                      context.tr('events.response.going_desc'),
                                      Colors.green,
                                      ev.id,
                                    ),
                                    _buildResponseButton(
                                      context,
                                      'interested',
                                      context.tr('events.response.interested'),
                                      context.tr('events.response.interested_desc'),
                                      Colors.blue,
                                      ev.id,
                                    ),
                                    _buildResponseButton(
                                      context,
                                      'maybe',
                                      context.tr('events.response.maybe'),
                                      context.tr('events.response.maybe_desc'),
                                      Colors.orange,
                                      ev.id,
                                    ),
                                    _buildResponseButton(
                                      context,
                                      'not_interested',
                                      context.tr('events.response.not_interested'),
                                      context.tr('events.response.not_interested_desc'),
                                      Colors.grey,
                                      ev.id,
                                    ),
                                  ],
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
        );
      },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CALIFICACIONES (RATINGS)
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildRatingsTab() {
    return FutureBuilder<List<PlaceRating>>(
      future: _ratingsFuture,
      builder: (context, snapshot) {
        final theme = Theme.of(context);

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
              child: Text('Error al cargar calificaciones: ${snapshot.error}'));
        }
        final ratings = snapshot.data ?? [];

        final double avgScore = ratings.isEmpty
            ? widget.place.rating
            : ratings
                    .map((r) => r.score)
                    .fold<double>(0, (a, b) => a + b) /
                ratings.length;

        return Column(
          children: [
            const SizedBox(height: 16),
            Text(
              'Calificación promedio',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.star, color: Colors.amber.shade600, size: 28),
                const SizedBox(width: 4),
                Text(
                  avgScore.toStringAsFixed(1),
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(width: 8),
                Text('(${ratings.length} opiniones)'),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        RatingFormScreen(placeId: widget.place.id),
                  ),
                ).then((_) => _loadData());
              },
              icon: const Icon(Icons.rate_review),
              label: const Text('Dejar una calificación'),
            ),
            const Divider(height: 24),
            Expanded(
              child: ratings.isEmpty
                  ? const Center(
                      child: Text('Aún no hay calificaciones. ¡Sé el primero!'),
                    )
                  : ListView.builder(
                      itemCount: ratings.length,
                      itemBuilder: (context, index) {
                        final r = ratings[index];
                        final isModerator =
                            (r.userRole == 'moderator' || r.userRole == 'admin');

                        final Color roleColor = Color(
                          int.parse('0xff${(r.userRoleColor ?? '#1DA1F2').substring(1)}'),
                        );
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isModerator
                                ? roleColor.withOpacity(0.15)
                                : theme.colorScheme.primary.withOpacity(0.1),
                            backgroundImage: r.userAvatarUrl != null
                                ? NetworkImage(r.userAvatarUrl!)
                                : null,
                            child: r.userAvatarUrl == null
                                ? const Icon(Icons.person)
                                : null,
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    if ((r.userId ?? '').isNotEmpty) {
                                      final auth = Provider.of<AuthService>(context, listen: false);
                                      final currentUserId = auth.currentUser?.id;
                                      
                                      // Si es el mismo usuario, ir al perfil propio
                                      if (currentUserId == r.userId) {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => const ProfileScreen(),
                                          ),
                                        );
                                      } else {
                                        // Si es diferente, ir al perfil público
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => PublicProfileScreen(
                                              userId: r.userId!,
                                            ),
                                          ),
                                        );
                                      }
                                    }
                                  },
                                  child: Text(
                                    r.username,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: isModerator
                                          ? theme.colorScheme.primary
                                          : null,
                                      decoration: TextDecoration.underline,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(Icons.star,
                                  size: 16, color: Colors.amber.shade600),
                              const SizedBox(width: 2),
                              Text(r.score.toStringAsFixed(1)),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (r.comment.isNotEmpty) Text(r.comment),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  if (r.userLevel != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(10),
                                        color: theme.colorScheme.primary
                                            .withOpacity(0.08),
                                      ),
                                      child: Text(
                                        r.userLevel!,
                                        style: const TextStyle(fontSize: 11),
                                      ),
                                    ),
                                  const SizedBox(width: 8),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.thumb_up_alt_outlined,
                                            size: 20),
                                        onPressed: () => _voteRating(r.id, true),
                                        tooltip: 'Útil',
                                      ),
                                      Text('${r.upvotes}'),
                                      const SizedBox(width: 6),
                                      IconButton(
                                        icon: const Icon(Icons.thumb_down_alt_outlined,
                                            size: 20),
                                        onPressed: () => _voteRating(r.id, false),
                                        tooltip: 'No útil',
                                      ),
                                      Text('${r.downvotes}'),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        icon: const Icon(Icons.comment_outlined,
                                            size: 20),
                                        tooltip: 'Ver comentarios',
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => RatingCommentsScreen(
                                                rating: r,
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildResponseButton(
    BuildContext context,
    String status,
    String title,
    String description,
    Color color,
    String eventId,
  ) {
    return ElevatedButton(
      onPressed: () async {
        final placeService = Provider.of<PlaceService>(context, listen: false);
        try {
          await placeService.respondToEvent(
            eventId: eventId,
            status: status,
          );
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.tr('events.actions.saved')),
            ),
          );
          _loadData();
        } catch (e) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(e.toString()),
            ),
          );
        }
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.1),
        foregroundColor: color,
        elevation: 0,
        side: BorderSide(color: color.withOpacity(0.3)),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            description,
            style: TextStyle(
              fontSize: 10,
              color: color.withOpacity(0.8),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

