import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/place_service.dart';
import '../components/report_item_widget.dart';

class AdminPlaceReportsScreen extends StatefulWidget {
  final String placeId;
  final String placeName;

  const AdminPlaceReportsScreen({super.key, required this.placeId, required this.placeName});

  @override
  State<AdminPlaceReportsScreen> createState() => _AdminPlaceReportsScreenState();
}

class _AdminPlaceReportsScreenState extends State<AdminPlaceReportsScreen> {
  late Future<List<Report>> _reportsFuture;
  final TextEditingController _searchCtrl = TextEditingController();
  String _selectedType = 'all'; // all, inseguridad, robo, etc.
  String _selectedStatus = 'all'; // all, pending, moderated, verified
  DateTime? _from;
  DateTime? _to;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _loadReports() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _reportsFuture = placeService.getReportsForPlace(widget.placeId);
    });
  }

  Future<void> _refresh() async {
    _loadReports();
    await _reportsFuture;
  }

  String _formatDate(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  Future<void> _pickFromDate() async {
    final now = DateTime.now();
    final initial = _from ?? now.subtract(const Duration(days: 30));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
    );
    if (picked != null) {
      setState(() {
        _from = picked;
      });
    }
  }

  Future<void> _pickToDate() async {
    final now = DateTime.now();
    final initial = _to ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
    );
    if (picked != null) {
      setState(() {
        _to = picked;
      });
    }
  }

  void _clearFilters() {
    _searchCtrl.clear();
    setState(() {
      _selectedType = 'all';
      _selectedStatus = 'all';
      _from = null;
      _to = null;
    });
  }

  List<Report> _applyFilters(List<Report> reports) {
    final keyword = _searchCtrl.text.trim().toLowerCase();
    final from = _from;
    final to = _to;
    final selectedType = _selectedType;
    final selectedStatus = _selectedStatus;

    return reports.where((r) {
      // Texto: en descripción o usuario
      if (keyword.isNotEmpty) {
        final combined = ('${r.description} ${r.username}').toLowerCase();
        if (!combined.contains(keyword)) return false;
      }

      // Tipo de reporte (categoría libre: inseguridad, robo, etc.)
      if (selectedType != 'all') {
        final type = (r.type).toLowerCase();
        if (type != selectedType.toLowerCase()) return false;
      }

      // Estado del reporte
      if (selectedStatus != 'all') {
        final isVerified = r.verified;
        final isModerated = r.isModerated;

        if (selectedStatus == 'pending') {
          // ni verificado ni moderado
          if (isVerified || isModerated) return false;
        } else if (selectedStatus == 'moderated') {
          // moderado pero no verificado
          if (!isModerated || isVerified) return false;
        } else if (selectedStatus == 'verified') {
          if (!isVerified) return false;
        }
      }

      // Rango de fechas
      if (from != null || to != null) {
        final created = r.createdAt;
        if (created == null) return false;
        if (from != null && created.isBefore(from)) return false;
        if (to != null && created.isAfter(to.add(const Duration(days: 1)))) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Reportes de ${widget.placeName}'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Report>>(
          future: _reportsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Text('Error al cargar reportes: ${snapshot.error}'),
                ],
              );
            }

            final allReports = snapshot.data ?? [];
            if (allReports.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(24),
                children: const [
                  SizedBox(height: 40),
                  Center(
                    child: Text(
                      'Este lugar no tiene reportes todavía.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              );
            }

            final visibleReports = _applyFilters(allReports);

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Builder(
                  builder: (context) {
                    final total = allReports.length;
                    final pending = allReports
                        .where((r) => !r.verified && !r.isModerated)
                        .length;
                    final moderated = allReports
                        .where((r) => r.isModerated && !r.verified)
                        .length;
                    final verified = allReports
                        .where((r) => r.verified)
                        .length;

                    return Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Chip(
                          avatar: const Icon(Icons.flag_outlined, size: 16),
                          label: Text('Total: $total'),
                        ),
                        Chip(
                          avatar: const Icon(Icons.hourglass_bottom, size: 16),
                          label: Text('Pendientes: $pending'),
                        ),
                        Chip(
                          avatar: const Icon(Icons.rule_folder_outlined, size: 16),
                          label: Text('Moderados: $moderated'),
                        ),
                        Chip(
                          avatar:
                              const Icon(Icons.verified_outlined, size: 16),
                          label: Text('Verificados: $verified'),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    labelText: 'Buscar por texto o usuario',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() {});
                      },
                    ),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('Tipo:'),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: _selectedType,
                      items: const [
                        DropdownMenuItem(
                          value: 'all',
                          child: Text('Todos'),
                        ),
                        DropdownMenuItem(
                          value: 'inseguridad',
                          child: Text('Inseguridad'),
                        ),
                        DropdownMenuItem(
                          value: 'robo',
                          child: Text('Robo'),
                        ),
                        DropdownMenuItem(
                          value: 'actividad sospechosa',
                          child: Text('Actividad sospechosa'),
                        ),
                        DropdownMenuItem(
                          value: 'servicios',
                          child: Text('Servicios'),
                        ),
                        DropdownMenuItem(
                          value: 'infraestructura',
                          child: Text('Infraestructura'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() {
                          _selectedType = value;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('Estado:'),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: _selectedStatus,
                      items: const [
                        DropdownMenuItem(
                          value: 'all',
                          child: Text('Todos'),
                        ),
                        DropdownMenuItem(
                          value: 'pending',
                          child: Text('Pendientes'),
                        ),
                        DropdownMenuItem(
                          value: 'moderated',
                          child: Text('Moderados'),
                        ),
                        DropdownMenuItem(
                          value: 'verified',
                          child: Text('Verificados'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() {
                          _selectedStatus = value;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _pickFromDate,
                      icon: const Icon(Icons.calendar_today),
                      label: Text(
                        _from != null
                            ? 'Desde: ${_formatDate(_from!)}'
                            : 'Desde: inicio',
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: _pickToDate,
                      icon: const Icon(Icons.calendar_today_outlined),
                      label: Text(
                        _to != null
                            ? 'Hasta: ${_formatDate(_to!)}'
                            : 'Hasta: hoy',
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _clearFilters,
                      icon: const Icon(Icons.filter_alt_off_outlined),
                      label: const Text('Limpiar filtros'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (visibleReports.isEmpty) ...[
                  const SizedBox(height: 16),
                  const Center(
                    child: Text(
                      'No hay reportes que coincidan con los filtros.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ] else ...[
                  ...visibleReports.map(
                    (r) => ReportItemWidget(report: r),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}
