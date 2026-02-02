import 'package:flutter/material.dart';

import '../services/admin_service.dart';
import '../services/place_service.dart';
import 'public_profile_screen.dart';
import 'rating_comments_screen.dart';
import 'report_comments_screen.dart';

class AdminModerationDetailScreen extends StatelessWidget {
  final AdminService adminService;
  final ModerationItem item;

  const AdminModerationDetailScreen({
    super.key,
    required this.adminService,
    required this.item,
  });

  bool get _isReport => item.type == 'report';
  bool get _isRating => item.type == 'rating';

  Future<void> _moderate(BuildContext context) async {
    try {
      if (_isReport) {
        await adminService.moderateReport(item.id, moderated: true);
      } else if (_isRating) {
        await adminService.moderateRating(item.id, remove: false);
      }
      if (context.mounted) {
        final msg = _isReport
            ? 'Reporte marcado como revisado por moderación.'
            : 'Valoración marcada como revisada por moderación.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al moderar: $e')),
        );
      }
    }
  }

  Future<void> _toggleVerified(BuildContext context) async {
    if (!_isReport) return;
    final currentlyVerified = item.status == 'verified';
    try {
      await adminService.moderateReport(
        item.id,
        moderated: true,
        verified: !currentlyVerified,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              !currentlyVerified
                  ? 'Reporte confirmado como válido.'
                  : 'Confirmación del reporte retirada.',
            ),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al actualizar verificación: $e')),
        );
      }
    }
  }

  Future<void> _deleteRating(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar rating'),
        content: const Text(
          'Esta acción no se puede deshacer. ¿Eliminar definitivamente esta valoración?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await adminService.moderateRating(item.id, remove: true);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rating eliminado.')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al eliminar rating: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isReport ? 'Detalle de reporte' : 'Detalle de valoración'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _isReport ? Icons.flag_outlined : Icons.star_rate_outlined,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.summary.isNotEmpty
                        ? item.summary
                        : (_isRating ? 'Valoración' : 'Reporte'),
                    style: theme.textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (item.placeName != null)
              Text(
                'Lugar: ${item.placeName}',
                style: theme.textTheme.bodyMedium,
              ),
            const SizedBox(height: 8),
            Text(
              'Autor: @${item.username}',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Fecha: ${item.createdAt.toLocal().toString().split('.').first}',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  'Estado: ${item.status}',
                  style: theme.textTheme.bodySmall,
                ),
                if (item.status == 'verified') ...[
                  const SizedBox(width: 8),
                  Icon(Icons.verified, size: 16, color: theme.colorScheme.primary),
                  const SizedBox(width: 4),
                  Text(
                    'Verificado',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PublicProfileScreen(userId: item.userId),
                      ),
                    );
                  },
                  icon: const Icon(Icons.person_outline),
                  label: const Text('Ver perfil'),
                ),
                if (_isReport)
                  ElevatedButton.icon(
                    onPressed: () {
                      final report = Report(
                        id: item.id,
                        placeId: '',
                        type: item.category,
                        description: item.summary,
                        photoUrl: null,
                        username: item.username,
                        userId: item.userId,
                        userLevel: null,
                        userBadges: const [],
                        userRole: null,
                        userRoleColor: null,
                        userAvatarUrl: null,
                        upvotes: 0,
                        downvotes: 0,
                        createdAt: item.createdAt,
                      );

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ReportCommentsScreen(report: report),
                        ),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: const Text('Comentarios del reporte'),
                  ),
                if (_isRating)
                  ElevatedButton.icon(
                    onPressed: () {
                      final rating = PlaceRating(
                        id: item.id,
                        placeId: '',
                        score: 0,
                        comment: item.summary,
                        username: item.username,
                        userId: item.userId,
                        userRole: null,
                        userLevel: null,
                        userBadges: const [],
                        userRoleColor: null,
                        reputationScore: 0,
                        userAvatarUrl: null,
                        upvotes: 0,
                        downvotes: 0,
                        createdAt: item.createdAt,
                      );

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => RatingCommentsScreen(rating: rating),
                        ),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: const Text('Comentarios del rating'),
                  ),
              ],
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Text(
                _isReport
                    ? 'Usa "Cerrar como revisado" cuando ya analizaste el reporte. Marca "Confirmar reporte" solo si has verificado que es válido.'
                    : 'Usa "Cerrar como revisado" para indicar que esta valoración ya fue atendida por moderación.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.75),
                ),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _moderate(context),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Cerrar como revisado'),
                  ),
                ),
                const SizedBox(width: 12),
                if (_isReport)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _toggleVerified(context),
                      icon: const Icon(Icons.verified_outlined),
                      label: Text(
                        item.status == 'verified'
                            ? 'Quitar confirmación'
                            : 'Confirmar reporte',
                      ),
                    ),
                  ),
                if (_isRating) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                      ),
                      onPressed: () => _deleteRating(context),
                      icon: const Icon(Icons.delete_outline),
                      label: const Text('Eliminar rating'),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
