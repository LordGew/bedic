import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/admin_service.dart';

class AdminOverviewTab extends StatefulWidget {
  final AdminService adminService;
  final void Function(String metricKey)? onMetricTap;

  const AdminOverviewTab({
    required this.adminService,
    this.onMetricTap,
  });

  @override
  State<AdminOverviewTab> createState() => _AdminOverviewTabState();
}

class _AdminOverviewTabState extends State<AdminOverviewTab> {
  late Future<AdminOverviewStats> _statsFuture;
  DateTime? _from;
  DateTime? _to;
  bool _exporting = false;
  bool _runningImageEnrichment = false;

  @override
  void initState() {
    super.initState();
    _statsFuture = widget.adminService.fetchOverviewStats(
      from: _from,
      to: _to,
    );
  }

  String _formatDate(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  Future<void> _pickFrom() async {
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
        _statsFuture = widget.adminService.fetchOverviewStats(
          from: _from,
          to: _to,
        );
      });
    }
  }

  Future<void> _pickTo() async {
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
        _statsFuture = widget.adminService.fetchOverviewStats(
          from: _from,
          to: _to,
        );
      });
    }
  }

  Future<void> _exportCsv(AdminOverviewStats stats) async {
    setState(() {
      _exporting = true;
    });
    try {
      final csv = await widget.adminService.exportOverviewCsv(
        from: _from,
        to: _to,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('CSV generado'),
          content: SingleChildScrollView(
            child: SelectableText(csv),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cerrar'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo exportar CSV: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _exporting = false;
        });
      }
    }
  }

  Future<void> _runImageEnrichment() async {
    setState(() {
      _runningImageEnrichment = true;
    });

    try {
      final count = await widget.adminService.runImageEnrichment();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            count > 0
                ? 'Se enriquecieron $count lugares con imágenes oficiales.'
                : 'No había lugares pendientes de enriquecer con imágenes.',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No se pudo ejecutar el enriquecimiento de imágenes: $e'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _runningImageEnrichment = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FutureBuilder<AdminOverviewStats>(
      future: _statsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Error al cargar métricas:',
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _statsFuture = widget.adminService.fetchOverviewStats(
                          from: _from,
                          to: _to,
                        );
                      });
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reintentar'),
                  ),
                ],
              ),
            ),
          );
        }

        final stats = snapshot.data!;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Resumen general',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: _pickFrom,
                    icon: const Icon(Icons.calendar_today),
                    label: Text(
                      _from != null
                          ? 'Desde: ${_formatDate(_from!)}'
                          : 'Desde: inicio',
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: _pickTo,
                    icon: const Icon(Icons.calendar_today_outlined),
                    label: Text(
                      _to != null
                          ? 'Hasta: ${_formatDate(_to!)}'
                          : 'Hasta: hoy',
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _exporting ? null : () => _exportCsv(stats),
                    icon: _exporting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.download),
                    label: Text(_exporting ? 'Exportando...' : 'Exportar CSV'),
                  ),
                  TextButton.icon(
                    onPressed:
                        _runningImageEnrichment ? null : _runImageEnrichment,
                    icon: _runningImageEnrichment
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.image_outlined),
                    label: Text(_runningImageEnrichment
                        ? 'Enriqueciendo...'
                        : 'Enriquecer imágenes ahora'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _StatCard(
                    title: 'Usuarios totales',
                    value: stats.totalUsers.toString(),
                    icon: Icons.people_alt_outlined,
                    color: Colors.blueAccent,
                    onTap: widget.onMetricTap == null
                        ? null
                        : () => widget.onMetricTap!('users'),
                    tooltip: 'Ver y gestionar usuarios registrados',
                  ),
                  _StatCard(
                    title: 'Lugares activos',
                    value: stats.totalPlaces.toString(),
                    icon: Icons.place_outlined,
                    color: Colors.orangeAccent,
                    onTap: widget.onMetricTap == null
                        ? null
                        : () => widget.onMetricTap!('places'),
                    tooltip: 'Ver métricas y detalles de lugares',
                  ),
                  _StatCard(
                    title: 'Reportes',
                    value: stats.totalReports.toString(),
                    icon: Icons.flag_outlined,
                    color: Colors.redAccent,
                    onTap: widget.onMetricTap == null
                        ? null
                        : () => widget.onMetricTap!('reports'),
                    tooltip: 'Ir al feed de moderación filtrado por reportes',
                  ),
                  _StatCard(
                    title: 'Calificaciones',
                    value: stats.totalRatings.toString(),
                    icon: Icons.star_rate_outlined,
                    color: Colors.amber,
                    onTap: widget.onMetricTap == null
                        ? null
                        : () => widget.onMetricTap!('ratings'),
                    tooltip: 'Ir al feed de moderación filtrado por calificaciones',
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _OverviewBars(stats: stats),
            ],
          ),
        );
      },
    );
  }
}

class _OverviewBars extends StatelessWidget {
  final AdminOverviewStats stats;

  const _OverviewBars({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final values = [
      stats.totalUsers,
      stats.totalPlaces,
      stats.totalReports,
      stats.totalRatings,
    ];
    final maxValInt = values.isEmpty
        ? 0
        : values.reduce((a, b) => a > b ? a : b);
    final maxVal = maxValInt == 0 ? 1.0 : maxValInt.toDouble();

    Widget buildBar(String label, int value, Color color) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Row(
          children: [
            SizedBox(
              width: 130,
              child: Text(
                label,
                style: theme.textTheme.bodySmall,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: value / maxVal,
                  color: color,
                  backgroundColor: color.withOpacity(0.15),
                  minHeight: 10,
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 40,
              child: Text(
                '$value',
                textAlign: TextAlign.end,
                style: theme.textTheme.bodySmall,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Distribución visual',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        buildBar('Usuarios', stats.totalUsers, Colors.blueAccent),
        buildBar('Lugares', stats.totalPlaces, Colors.orangeAccent),
        buildBar('Reportes', stats.totalReports, Colors.redAccent),
        buildBar('Calificaciones', stats.totalRatings, Colors.amber),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final String? tooltip;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 210,
      child: Tooltip(
        message: tooltip ?? title,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Card(
            elevation: 4,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(icon, color: color),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          title,
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    value,
                    style: theme.textTheme.headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
