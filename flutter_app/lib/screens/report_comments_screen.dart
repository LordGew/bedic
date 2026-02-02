import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/place_service.dart';

class ReportCommentsScreen extends StatefulWidget {
  final Report report;

  const ReportCommentsScreen({super.key, required this.report});

  @override
  State<ReportCommentsScreen> createState() => _ReportCommentsScreenState();
}

class _ReportCommentsScreenState extends State<ReportCommentsScreen> {
  late Future<List<ReportComment>> _commentsFuture;
  final TextEditingController _controller = TextEditingController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _reportComment(ReportComment comment) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    final controller = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reportar comentario'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Descripción',
            hintText: 'Explica por qué consideras inadecuado este comentario',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Enviar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final description = controller.text.trim();
    if (description.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La descripción del reporte es obligatoria.')),
      );
      return;
    }

    try {
      await placeService.reportComment(
        commentId: comment.id,
        reason: 'OTHER',
        description: description,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reporte enviado para revisión.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo enviar el reporte: $e')),
      );
    }
  }

  Future<void> _moderateComment(ReportComment comment, String action) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      await placeService.moderateReportComment(
        commentId: comment.id,
        action: action,
      );
      _loadComments();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Acción aplicada al comentario ($action).')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo moderar el comentario: $e')),
      );
    }
  }

  void _loadComments() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _commentsFuture = placeService.getCommentsForReport(widget.report.id);
    });
  }

  Future<void> _sendComment() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _isSending = true;
    });
    try {
      await placeService.addCommentToReport(
        reportId: widget.report.id,
        text: text,
      );
      _controller.clear();
      _loadComments();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo enviar el comentario: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = Provider.of<AuthService>(context, listen: false);
    final isAdminOrModerator = auth.currentUser?.role == 'admin' ||
        auth.currentUser?.role == 'moderator';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Comentarios del reporte'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.report.type,
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(widget.report.description),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: FutureBuilder<List<ReportComment>>(
              future: _commentsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text('Error al cargar comentarios: ${snapshot.error}'),
                  );
                }
                final comments = snapshot.data ?? [];
                if (comments.isEmpty) {
                  return const Center(
                    child:
                        Text('Aún no hay comentarios. Sé el primero en opinar.'),
                  );
                }
                return ListView.builder(
                  itemCount: comments.length,
                  itemBuilder: (context, index) {
                    final c = comments[index];
                    final isHidden = c.hidden;
                    final isCensored = c.censored;

                    Widget textWidget;
                    if (isHidden && !isAdminOrModerator) {
                      textWidget = const Text(
                        '[Comentario oculto por moderación]',
                      );
                    } else {
                      final visibleText = c.text;
                      if (isCensored) {
                        textWidget = ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Stack(
                            children: [
                              Container(
                                width: double.infinity,
                                color: Colors.grey.shade800,
                                padding: const EdgeInsets.all(8.0),
                                child: Text(
                                  visibleText,
                                  style: theme.textTheme.bodyMedium
                                      ?.copyWith(color: Colors.white),
                                ),
                              ),
                              Positioned.fill(
                                child: IgnorePointer(
                                  child: BackdropFilter(
                                    filter:
                                        ImageFilter.blur(sigmaX: 6, sigmaY: 6),
                                    child: Container(
                                      color: Colors.black.withOpacity(0.0),
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                right: 4,
                                bottom: 4,
                                child: Icon(
                                  Icons.visibility_off,
                                  size: 14,
                                  color: Colors.redAccent.shade200,
                                ),
                              ),
                            ],
                          ),
                        );
                      } else {
                        textWidget = Text(visibleText);
                      }
                    }
                    return ListTile(
                      title: Text('@${c.username}'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          textWidget,
                          if (c.createdAt != null)
                            Text(
                              '${c.createdAt}',
                              style: theme.textTheme.bodySmall,
                            ),
                        ],
                      ),
                      trailing: isAdminOrModerator
                          ? PopupMenuButton<String>(
                              onSelected: (value) {
                                _moderateComment(c, value);
                              },
                              itemBuilder: (context) => [
                                if (!isHidden)
                                  const PopupMenuItem(
                                    value: 'hide',
                                    child: Text('Ocultar'),
                                  ),
                                if (isHidden)
                                  const PopupMenuItem(
                                    value: 'unhide',
                                    child: Text('Mostrar'),
                                  ),
                                if (!isCensored)
                                  const PopupMenuItem(
                                    value: 'censor',
                                    child: Text('Aplicar blur/censura'),
                                  ),
                                if (isCensored)
                                  const PopupMenuItem(
                                    value: 'uncensor',
                                    child: Text('Quitar censura'),
                                  ),
                              ],
                            )
                          : IconButton(
                              icon: const Icon(Icons.flag_outlined, size: 20),
                              tooltip: 'Reportar comentario',
                              onPressed: () => _reportComment(c),
                            ),
                    );
                  },
                );
              },
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Escribe un comentario...',
                    ),
                    minLines: 1,
                    maxLines: 4,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  onPressed: _isSending ? null : _sendComment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
