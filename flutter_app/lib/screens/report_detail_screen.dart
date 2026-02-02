import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/place_service.dart';

class ReportDetailScreen extends StatefulWidget {
  final Report report;

  const ReportDetailScreen({super.key, required this.report});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  late Future<List<ReportComment>> _commentsFuture;
  final TextEditingController _controller = TextEditingController();
  bool _isSending = false;
  int _upvotes = 0;
  int _downvotes = 0;
  String _currentSort = 'newest';
  ReportComment? _replyTo;

  @override
  void initState() {
    super.initState();
    _upvotes = widget.report.upvotes;
    _downvotes = widget.report.downvotes;
    _loadComments();
  }

  Future<void> _voteComment(ReportComment comment, bool isUpvote) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      if (isUpvote) {
        await placeService.upvoteReportComment(comment.id);
      } else {
        await placeService.downvoteReportComment(comment.id);
      }
      if (!mounted) return;
      _loadComments();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo registrar el voto en el comentario: $e')),
      );
    }
  }

  Widget _buildCommentTile(
    ThemeData theme,
    ReportComment comment, {
    bool isReply = false,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.only(
        left: isReply ? 32 : 0,
        right: 0,
      ),
      leading: CircleAvatar(
        radius: 16,
        backgroundImage: comment.userAvatarUrl != null
            ? NetworkImage(comment.userAvatarUrl!)
            : null,
        child: comment.userAvatarUrl == null
            ? const Icon(Icons.person, size: 18)
            : null,
      ),
      title: Text('@${comment.username}'),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(comment.text),
          const SizedBox(height: 4),
          Row(
            children: [
              if (comment.createdAt != null)
                Text(
                  '${comment.createdAt}',
                  style: theme.textTheme.bodySmall,
                ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.thumb_up_alt_outlined, size: 18),
                onPressed: () => _voteComment(comment, true),
              ),
              Text('${comment.upvotes}'),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.thumb_down_alt_outlined, size: 18),
                onPressed: () => _voteComment(comment, false),
              ),
              Text('${comment.downvotes}'),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () {
                  setState(() {
                    _replyTo = comment;
                  });
                },
                child: const Text('Responder'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _loadComments() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _commentsFuture =
          placeService.getCommentsForReport(widget.report.id, sort: _currentSort);
    });
  }

  void _changeSort(String value) {
    if (value == _currentSort) return;
    _currentSort = value;
    _loadComments();
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
        parentCommentId: _replyTo?.id,
      );
      _controller.clear();
      _replyTo = null;
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

  Future<void> _voteReport(bool isUpvote) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      if (isUpvote) {
        await placeService.upvoteReport(widget.report.id);
      } else {
        await placeService.downvoteReport(widget.report.id);
      }
      if (!mounted) return;
      setState(() {
        if (isUpvote) {
          _upvotes++;
        } else {
          _downvotes++;
        }
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
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo registrar el voto: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle del reporte'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.flag, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  widget.report.type,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (widget.report.verified) ...[
                  const SizedBox(width: 8),
                  Icon(
                    Icons.verified,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Verificado',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Por @${widget.report.username}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: usernameColor ?? theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            if (widget.report.createdAt != null)
              Text(
                '${widget.report.createdAt}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
            const SizedBox(height: 16),
            Text(
              widget.report.description,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            if (widget.report.photoUrl != null && widget.report.photoUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  widget.report.photoUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 200,
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.broken_image, size: 40),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 24),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.thumb_up_alt_outlined, size: 20),
                  onPressed: () => _voteReport(true),
                ),
                const SizedBox(width: 4),
                Text('$_upvotes'),
                const SizedBox(width: 16),
                IconButton(
                  icon: const Icon(Icons.thumb_down_alt_outlined, size: 20),
                  onPressed: () => _voteReport(false),
                ),
                const SizedBox(width: 4),
                Text('$_downvotes'),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Comentarios',
                  style: theme.textTheme.titleMedium,
                ),
                DropdownButton<String>(
                  value: _currentSort,
                  onChanged: (value) {
                    if (value != null) _changeSort(value);
                  },
                  items: const [
                    DropdownMenuItem(
                      value: 'newest',
                      child: Text('Más nuevos'),
                    ),
                    DropdownMenuItem(
                      value: 'oldest',
                      child: Text('Más antiguos'),
                    ),
                    DropdownMenuItem(
                      value: 'most_upvotes',
                      child: Text('Más votos +'),
                    ),
                    DropdownMenuItem(
                      value: 'most_downvotes',
                      child: Text('Más votos -'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            FutureBuilder<List<ReportComment>>(
              future: _commentsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }
                if (snapshot.hasError) {
                  return Text(
                    'Error al cargar comentarios: ${snapshot.error}',
                    style: theme.textTheme.bodySmall,
                  );
                }
                final comments = snapshot.data ?? [];
                if (comments.isEmpty) {
                  return const Text(
                    'Aún no hay comentarios. Sé el primero en opinar.',
                  );
                }
                final roots = comments
                    .where((c) => c.parentCommentId == null)
                    .toList();
                final Map<String, List<ReportComment>> repliesByParent = {};
                for (final c in comments.where((c) => c.parentCommentId != null)) {
                  final parentId = c.parentCommentId!;
                  repliesByParent.putIfAbsent(parentId, () => []).add(c);
                }

                return Column(
                  children: roots
                      .map(
                        (root) => Column(
                          children: [
                            _buildCommentTile(theme, root),
                            ...[for (final r in (repliesByParent[root.id] ?? [])) _buildCommentTile(theme, r, isReply: true)],
                          ],
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: 8),
            Row(
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
          ],
        ),
      ),
    );
  }
}
