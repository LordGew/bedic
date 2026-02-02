import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  late Future<List<Report>> _reportsFuture;
  String _selectedStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  void _loadReports() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _reportsFuture = placeService.getMyReports();
    });
  }

  List<Report> _filterReports(List<Report> reports) {
    if (_selectedStatus == 'ALL') return reports;
    return reports.where((r) => r.status == _selectedStatus).toList();
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'UNDER_REVIEW':
        return 'En revisión';
      case 'RESOLVED':
        return 'Resuelto';
      case 'DISMISSED':
        return 'Desestimado';
      case 'ESCALATED':
        return 'Escalado';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'UNDER_REVIEW':
        return Colors.blue;
      case 'RESOLVED':
        return Colors.green;
      case 'DISMISSED':
        return Colors.grey;
      case 'ESCALATED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Reportes'),
        elevation: 0,
      ),
      body: FutureBuilder<List<Report>>(
        future: _reportsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadReports,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          final reports = snapshot.data ?? [];
          final filteredReports = _filterReports(reports);

          if (reports.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.assignment_outlined, size: 64, color: theme.disabledColor),
                  const SizedBox(height: 16),
                  Text(
                    'No tienes reportes',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Los reportes que envíes aparecerán aquí',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.disabledColor,
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Filtros
              Padding(
                padding: const EdgeInsets.all(16),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('ALL', 'Todos', reports.length),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'PENDING',
                        'Pendiente',
                        reports.where((r) => r.status == 'PENDING').length,
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'UNDER_REVIEW',
                        'En revisión',
                        reports.where((r) => r.status == 'UNDER_REVIEW').length,
                      ),
                      const SizedBox(width: 8),
                      _buildFilterChip(
                        'RESOLVED',
                        'Resuelto',
                        reports.where((r) => r.status == 'RESOLVED').length,
                      ),
                    ],
                  ),
                ),
              ),
              // Lista de reportes
              Expanded(
                child: filteredReports.isEmpty
                    ? Center(
                        child: Text(
                          'No hay reportes con este estado',
                          style: theme.textTheme.bodyMedium,
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filteredReports.length,
                        itemBuilder: (context, index) {
                          final report = filteredReports[index];
                          return _buildReportCard(report, theme);
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChip(String status, String label, int count) {
    final isSelected = _selectedStatus == status;
    return FilterChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedStatus = status;
        });
      },
      backgroundColor: Colors.transparent,
      selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
      side: BorderSide(
        color: isSelected ? Theme.of(context).primaryColor : Colors.grey,
      ),
    );
  }

  Widget _buildReportCard(Report report, ThemeData theme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        title: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getReportTitle(report),
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getReasonLabel(report.reason),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.disabledColor,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _getStatusColor(report.status).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getStatusLabel(report.status),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _getStatusColor(report.status),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDetailRow('Tipo:', _getContentTypeLabel(report.contentType), theme),
                const SizedBox(height: 12),
                _buildDetailRow('Razón:', _getReasonLabel(report.reason), theme),
                const SizedBox(height: 12),
                _buildDetailRow('Descripción:', report.description, theme),
                const SizedBox(height: 12),
                _buildDetailRow(
                  'Fecha:',
                  _formatDate(report.createdAt),
                  theme,
                ),
                if (report.moderationNotes != null && report.moderationNotes!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _buildDetailRow('Notas del moderador:', report.moderationNotes!, theme),
                ],
                if (report.actions.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Acciones tomadas:',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...report.actions.map((action) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: theme.dividerColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _getActionLabel(action['type']),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (action['reason'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Razón: ${action['reason']}',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                          const SizedBox(height: 4),
                          Text(
                            'Fecha: ${_formatDate(DateTime.parse(action['takenAt']))}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.disabledColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.disabledColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.bodyMedium,
        ),
      ],
    );
  }

  String _getReportTitle(Report report) {
    switch (report.contentType) {
      case 'USER':
        return 'Reporte de usuario';
      case 'PLACE':
        return 'Reporte de lugar';
      case 'REVIEW':
        return 'Reporte de reseña';
      case 'COMMENT':
        return 'Reporte de comentario';
      default:
        return 'Reporte';
    }
  }

  String _getContentTypeLabel(String type) {
    switch (type) {
      case 'USER':
        return 'Usuario';
      case 'PLACE':
        return 'Lugar';
      case 'REVIEW':
        return 'Reseña';
      case 'COMMENT':
        return 'Comentario';
      case 'PHOTO':
        return 'Foto';
      default:
        return type;
    }
  }

  String _getReasonLabel(String reason) {
    switch (reason) {
      case 'SPAM':
        return 'Spam';
      case 'HARASSMENT':
        return 'Acoso';
      case 'HATE_SPEECH':
        return 'Discurso de odio';
      case 'VIOLENCE':
        return 'Violencia';
      case 'SEXUAL_CONTENT':
        return 'Contenido sexual';
      case 'FALSE_INFO':
        return 'Información falsa';
      case 'COPYRIGHT':
        return 'Derechos de autor';
      case 'OTHER':
        return 'Otro';
      default:
        return reason;
    }
  }

  String _getActionLabel(String action) {
    switch (action) {
      case 'CONTENT_HIDDEN':
        return '🙈 Contenido ocultado';
      case 'CONTENT_DELETED':
        return '🗑️ Contenido eliminado';
      case 'USER_WARNED':
        return '⚠️ Usuario advertido';
      case 'USER_MUTED':
        return '🔇 Usuario silenciado';
      case 'USER_BANNED':
        return '🚫 Usuario baneado';
      case 'CONTENT_WARNING_ADDED':
        return '⚠️ Advertencia de contenido agregada';
      default:
        return action;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return 'Hace ${difference.inMinutes} minutos';
      }
      return 'Hace ${difference.inHours} horas';
    } else if (difference.inDays == 1) {
      return 'Ayer';
    } else if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} días';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class Report {
  final String id;
  final String contentType;
  final String reason;
  final String description;
  final String status;
  final DateTime createdAt;
  final String? moderationNotes;
  final List<Map<String, dynamic>> actions;

  Report({
    required this.id,
    required this.contentType,
    required this.reason,
    required this.description,
    required this.status,
    required this.createdAt,
    this.moderationNotes,
    this.actions = const [],
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['_id'] ?? '',
      contentType: json['contentType'] ?? 'OTHER',
      reason: json['reason'] ?? 'OTHER',
      description: json['description'] ?? '',
      status: json['status'] ?? 'PENDING',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      moderationNotes: json['moderationNotes'],
      actions: List<Map<String, dynamic>>.from(json['actions'] ?? []),
    );
  }
}
