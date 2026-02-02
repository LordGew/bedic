// lib/widgets/report_item_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';

import '../i18n/localization_service.dart';
import '../services/place_service.dart';
import '../screens/public_profile_screen.dart';
import '../screens/report_detail_screen.dart';
import '../screens/report_comments_screen.dart';

class ReportItemWidget extends StatefulWidget {
  final Report report;

  const ReportItemWidget({super.key, required this.report});

  @override
  State<ReportItemWidget> createState() => _ReportItemWidgetState();
}

class _ReportItemWidgetState extends State<ReportItemWidget> {
  late int _upvotes;
  late int _downvotes;
  late int _commentsCount;

  @override
  void initState() {
    super.initState();
    _upvotes = widget.report.upvotes;
    _downvotes = widget.report.downvotes;
    _commentsCount = widget.report.commentsCount;
  }

  String _localizedType(BuildContext context, String type) {
    final t = type.toLowerCase();
    if (t == 'inseguridad') {
      return context.tr('report.type.insecurity');
    }
    if (t == 'robo') {
      return context.tr('report.type.robbery');
    }
    if (t == 'mal estado') {
      return context.tr('report.type.bad_condition');
    }
    if (t == 'basura') {
      return context.tr('report.type.trash');
    }
    if (t == 'iluminación deficiente') {
      return context.tr('report.type.poor_lighting');
    }
    return context.tr('report.type.other');
  }

  // ------------------------------
  // ÍCONO SEGÚN TIPO DE REPORTE
  // ------------------------------
  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'inseguridad':
        return Icons.shield_moon_outlined;
      case 'robo':
        return Icons.no_encryption_gmailerrorred_outlined;
      case 'actividad sospechosa':
        return Icons.visibility_off_outlined;
      case 'servicios':
        return Icons.miscellaneous_services_outlined;
      case 'infraestructura':
        return Icons.construction_outlined;
      default:
        return Icons.info_outline;
    }
  }

  Color _colorForType(BuildContext ctx, String type) {
    final primary = Theme.of(ctx).colorScheme.primary;
    switch (type.toLowerCase()) {
      case 'inseguridad':
        return Colors.redAccent;
      case 'robo':
        return Colors.deepOrange;
      case 'actividad sospechosa':
        return Colors.amber.shade700;
      case 'servicios':
        return primary;
      case 'infraestructura':
        return Colors.blueGrey;
      default:
        return primary;
    }
  }

  // ------------------------------
  // WIDGET PRINCIPAL
  // ------------------------------
  Future<void> _voteReport(BuildContext context, bool isUpvote) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      final updated = isUpvote
          ? await placeService.upvoteReport(widget.report.id)
          : await placeService.downvoteReport(widget.report.id);

      if (!mounted) return;
      setState(() {
        _upvotes = updated.upvotes;
        _downvotes = updated.downvotes;
        _commentsCount = updated.commentsCount;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isUpvote
                ? 'Voto positivo registrado'
                : 'Voto negativo registrado',
          ),
        ),
      );
    } catch (e, st) {
      debugPrint('Error al votar reporte ${widget.report.id}: $e');
      debugPrint('Stacktrace: $st');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo registrar el voto. Inténtalo de nuevo.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final placeService = Provider.of<PlaceService>(context, listen: false);

    final typeColor = _colorForType(context, widget.report.type);
    final isModerator =
        widget.report.userRole == 'admin' || widget.report.userRole == 'moderator';
    Color? usernameColor;
    if (isModerator && widget.report.userRoleColor != null) {
      try {
        usernameColor = Color(
          int.parse('0xff${(widget.report.userRoleColor!).substring(1)}'),
        );
      } catch (_) {
        usernameColor = theme.colorScheme.primary;
      }
    }

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 4,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ReportDetailScreen(report: widget.report),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // -------------------------
              // CABECERA
              // -------------------------
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: typeColor.withOpacity(0.15),
                    backgroundImage: widget.report.userAvatarUrl != null
                        ? NetworkImage(widget.report.userAvatarUrl!)
                        : null,
                    child: widget.report.userAvatarUrl == null
                        ? Icon(
                            _iconForType(widget.report.type),
                            color: typeColor,
                            size: 18,
                          )
                        : null,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _localizedType(context, widget.report.type),
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: typeColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  // LINK A PERFIL
                  GestureDetector(
                    onTap: () {
                      if (widget.report.userId != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PublicProfileScreen(
                              userId: widget.report.userId!,
                            ),
                          ),
                        );
                      }
                    },
                    child: Text(
                      "@${widget.report.username}",
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: usernameColor ?? theme.colorScheme.primary,
                        decoration: TextDecoration.underline,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // -------------------------
              // DESCRIPCIÓN
              // -------------------------
              Text(
                widget.report.description,
                style: theme.textTheme.bodyMedium,
              ),

              if (widget.report.verified) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.verified,
                      size: 16,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Reporte verificado',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],

              // -------------------------
              // FOTO (opcional)
              // -------------------------
              if (widget.report.photoUrl != null && widget.report.photoUrl!.isNotEmpty) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Stack(
                    children: [
                      Image.network(
                        widget.report.photoUrl!,
                        fit: BoxFit.cover,
                        height: 180,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => Container(
                          height: 180,
                          color: Colors.grey[300],
                          child: const Center(
                            child: Icon(Icons.broken_image, size: 40),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 10,
                        bottom: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.groups, size: 14, color: Colors.white),
                              SizedBox(width: 6),
                              Text(
                                'Reporte de la comunidad',
                                style: TextStyle(
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
                  ),
                ),
              ],

              const SizedBox(height: 12),

              // -------------------------
              // ACCIONES: UPVOTE / DOWNVOTE
              // -------------------------
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.thumb_up_alt_outlined),
                    onPressed: () => _voteReport(context, true),
                  ),
                  Text(_upvotes.toString()),

                  const SizedBox(width: 18),

                  IconButton(
                    icon: const Icon(Icons.thumb_down_alt_outlined),
                    onPressed: () => _voteReport(context, false),
                  ),
                  Text(_downvotes.toString()),

                  const SizedBox(width: 8),

                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.comment_outlined),
                        tooltip: 'Ver comentarios',
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportCommentsScreen(report: widget.report),
                            ),
                          );
                        },
                      ),
                      Text(_commentsCount.toString()),
                    ],
                  ),

                  const Spacer(),

                  Text(
                    widget.report.createdAt != null
                        ? "${widget.report.createdAt!.day}/${widget.report.createdAt!.month}/${widget.report.createdAt!.year}"
                        : "",
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
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
}
