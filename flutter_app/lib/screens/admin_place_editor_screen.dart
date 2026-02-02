import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/place_service.dart';
import '../secrets.dart';
import 'admin_place_reports_screen.dart';

class AdminPlaceEditorScreen extends StatefulWidget {
  final Place? place;

  const AdminPlaceEditorScreen({super.key, this.place});

  @override
  State<AdminPlaceEditorScreen> createState() => _AdminPlaceEditorScreenState();
}

class _AdminPlaceEditorScreenState extends State<AdminPlaceEditorScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameCtrl;
  late TextEditingController _categoryCtrl;
  late TextEditingController _descriptionCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _latCtrl;
  late TextEditingController _lonCtrl;

  bool _saving = false;
  List<Uint8List> _pendingPhotos = [];
  List<String> _currentOfficialImages = [];

  int? _reportCount;
  int? _ratingCount;
  bool _loadingStats = false;
  String? _statsError;

  late MapController _mapController;
  LatLng? _selectedLatLng;

  @override
  void initState() {
    super.initState();
    final p = widget.place;
    _nameCtrl = TextEditingController(text: p?.name ?? '');
    _categoryCtrl = TextEditingController(text: p?.category ?? '');
    _descriptionCtrl = TextEditingController();
    _addressCtrl = TextEditingController();
    _latCtrl = TextEditingController(
      text: p != null ? p.latitude.toStringAsFixed(6) : '',
    );
    _lonCtrl = TextEditingController(
      text: p != null ? p.longitude.toStringAsFixed(6) : '',
    );

    _currentOfficialImages = List<String>.from(p?.officialImages ?? const []);

    _mapController = MapController();

    if (p != null) {
      _selectedLatLng = LatLng(p.latitude, p.longitude);
      _loadPlaceStats(p.id);
    } else {
      // Centro por defecto en Bogotá
      _selectedLatLng = const LatLng(4.6097, -74.0817);
      _latCtrl.text = _selectedLatLng!.latitude.toStringAsFixed(6);
      _lonCtrl.text = _selectedLatLng!.longitude.toStringAsFixed(6);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _categoryCtrl.dispose();
    _descriptionCtrl.dispose();
    _addressCtrl.dispose();
    _latCtrl.dispose();
    _lonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    if (_currentOfficialImages.length + _pendingPhotos.length >= 5) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Máximo 5 fotos oficiales por lugar')),
        );
      }
      return;
    }

    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    setState(() {
      _pendingPhotos.add(bytes);
    });
  }

  String _normalizePlacePhotoUrl(String raw) {
    if (raw.isEmpty) return raw;
    if (raw.startsWith('http')) return raw;
    final baseWithoutApi = API_BASE_URL.replaceFirst('/api', '');
    if (raw.startsWith('/')) return '$baseWithoutApi$raw';
    return '$baseWithoutApi/$raw';
  }

  Future<void> _deleteExistingPhoto(String url) async {
    if (widget.place == null) return;

    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() => _saving = true);
    try {
      await placeService.deletePlacePhotoAsAdmin(
        placeId: widget.place!.id,
        photoUrl: url,
      );

      if (!mounted) return;
      setState(() {
        _currentOfficialImages.remove(url);
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto eliminada correctamente')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo eliminar la foto: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  void _openPlaceReports() {
    final p = widget.place;
    if (p == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AdminPlaceReportsScreen(
          placeId: p.id,
          placeName: p.name,
        ),
      ),
    );
  }

  void _removePendingPhoto(int index) {
    setState(() {
      _pendingPhotos.removeAt(index);
    });
  }

  Future<void> _loadPlaceStats(String placeId) async {
    setState(() {
      _loadingStats = true;
      _statsError = null;
    });

    final placeService = Provider.of<PlaceService>(context, listen: false);

    try {
      final reports = await placeService.getReportsForPlace(placeId);
      final ratings = await placeService.getRatingsForPlace(placeId);

      if (!mounted) return;
      setState(() {
        _reportCount = reports.length;
        _ratingCount = ratings.length;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _statsError = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingStats = false;
        });
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final placeService = Provider.of<PlaceService>(context, listen: false);

    final name = _nameCtrl.text.trim();
    final category = _categoryCtrl.text.trim();
    final description = _descriptionCtrl.text.trim().isEmpty
        ? null
        : _descriptionCtrl.text.trim();
    final address = _addressCtrl.text.trim().isEmpty
        ? null
        : _addressCtrl.text.trim();

    final lat = double.tryParse(_latCtrl.text.trim());
    final lon = double.tryParse(_lonCtrl.text.trim());
    if (lat == null || lon == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Latitud y longitud no son válidas')),
      );
      return;
    }

    _selectedLatLng = LatLng(lat, lon);

    setState(() => _saving = true);

    Place place;
    try {
      if (widget.place == null) {
        place = await placeService.createPlaceAsAdmin(
          name: name,
          category: category,
          description: description,
          address: address,
          latitude: lat,
          longitude: lon,
        );
      } else {
        place = await placeService.updatePlaceAsAdmin(
          placeId: widget.place!.id,
          name: name,
          category: category,
          description: description,
          address: address,
          latitude: lat,
          longitude: lon,
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo guardar el lugar: $e')),
      );
      return;
    }

    // Subir fotos pendientes, sin impedir que el lugar quede guardado si alguna falla
    if (_pendingPhotos.isNotEmpty) {
      try {
        for (int i = 0; i < _pendingPhotos.length; i++) {
          final bytes = _pendingPhotos[i];
          final filename = 'place_${place.id}_$i.jpg';
          final relativeUrl = await placeService.uploadPlacePhotoAsAdmin(
            placeId: place.id,
            bytes: bytes,
            filename: filename,
          );
          final fullUrl = _normalizePlacePhotoUrl(relativeUrl);
          if (mounted) {
            setState(() {
              _currentOfficialImages.add(fullUrl);
            });
          }
        }
        _pendingPhotos.clear();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'El lugar se guardó pero hubo un error al subir alguna foto: $e'),
            ),
          );
        }
      }
    }

    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.place == null
              ? 'Lugar creado correctamente'
              : 'Lugar actualizado correctamente',
        ),
      ),
    );
    Navigator.pop(context, place);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context, listen: false);
    final isAdmin = auth.currentUser?.role == 'admin' || auth.currentUser?.role == 'moderator';

    if (!isAdmin) {
      return const Scaffold(
        body: Center(child: Text('Solo administradores pueden editar lugares.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.place == null ? 'Nuevo lugar' : 'Editar lugar'),
        actions: [
          IconButton(
            onPressed: _saving ? null : _save,
            icon: const Icon(Icons.save),
          ),
        ],
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(labelText: 'Nombre del lugar'),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'El nombre es obligatorio' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _categoryCtrl,
                  decoration: const InputDecoration(labelText: 'Categoría'),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'La categoría es obligatoria' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionCtrl,
                  decoration: const InputDecoration(labelText: 'Descripción (opcional)'),
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _addressCtrl,
                  decoration: const InputDecoration(labelText: 'Dirección (opcional)'),
                ),
                const SizedBox(height: 16),
                if (widget.place != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Actividad del lugar',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          if (_loadingStats)
                            Row(
                              children: const [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 8),
                                Text('Cargando actividad...'),
                              ],
                            )
                          else ...[
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: [
                                ActionChip(
                                  avatar: const Icon(Icons.flag_outlined, size: 16),
                                  label: Text('${_reportCount ?? 0} reportes'),
                                  onPressed: _openPlaceReports,
                                ),
                                Chip(
                                  avatar: const Icon(Icons.star_rate_outlined,
                                      size: 16),
                                  label: Text(
                                      '${_ratingCount ?? 0} calificaciones'),
                                ),
                              ],
                            ),
                            if (_statsError != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                'No se pudo cargar toda la actividad.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: Colors.redAccent),
                              ),
                            ],
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  'Ubicación en el mapa',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 220,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter:
                            _selectedLatLng ?? const LatLng(4.6097, -74.0817),
                        initialZoom: 15,
                        onTap: (tapPosition, latLng) {
                          setState(() {
                            _selectedLatLng = latLng;
                            _latCtrl.text = latLng.latitude.toStringAsFixed(6);
                            _lonCtrl.text = latLng.longitude.toStringAsFixed(6);
                          });
                        },
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.example.app',
                        ),
                        if (_selectedLatLng != null)
                          MarkerLayer(
                            markers: [
                              Marker(
                                width: 40,
                                height: 40,
                                point: _selectedLatLng!,
                                child: const Icon(
                                  Icons.location_on,
                                  size: 36,
                                  color: Colors.redAccent,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _latCtrl,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true, signed: true),
                        decoration: const InputDecoration(labelText: 'Latitud'),
                        onChanged: (value) {
                          final lat = double.tryParse(value.trim());
                          final lon = double.tryParse(_lonCtrl.text.trim());
                          if (lat != null && lon != null) {
                            setState(() {
                              _selectedLatLng = LatLng(lat, lon);
                              _mapController.move(_selectedLatLng!, 15);
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _lonCtrl,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true, signed: true),
                        decoration: const InputDecoration(labelText: 'Longitud'),
                        onChanged: (value) {
                          final lat = double.tryParse(_latCtrl.text.trim());
                          final lon = double.tryParse(value.trim());
                          if (lat != null && lon != null) {
                            setState(() {
                              _selectedLatLng = LatLng(lat, lon);
                              _mapController.move(_selectedLatLng!, 15);
                            });
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Fotos oficiales',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    TextButton.icon(
                      onPressed: _saving ? null : _pickPhoto,
                      icon: const Icon(Icons.add_a_photo),
                      label: const Text('Agregar foto'),
                    )
                  ],
                ),
                const SizedBox(height: 8),
                if (_currentOfficialImages.isNotEmpty)
                  SizedBox(
                    height: 100,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (context, index) {
                        final url = _currentOfficialImages[index];
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                url,
                                width: 140,
                                height: 100,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: InkWell(
                                onTap:
                                    _saving ? null : () => _deleteExistingPhoto(url),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: Colors.black54,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemCount: _currentOfficialImages.length,
                    ),
                  ),
                if (_pendingPhotos.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 100,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (context, index) {
                        final bytes = _pendingPhotos[index];
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: kIsWeb
                                  ? Image.memory(
                                      bytes,
                                      width: 140,
                                      height: 100,
                                      fit: BoxFit.cover,
                                    )
                                  : Image.memory(
                                      bytes,
                                      width: 140,
                                      height: 100,
                                      fit: BoxFit.cover,
                                    ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: InkWell(
                                onTap: () => _removePendingPhoto(index),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: Colors.black54,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemCount: _pendingPhotos.length,
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: const Icon(Icons.save),
                    label: Text(widget.place == null ? 'Crear lugar' : 'Guardar cambios'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
