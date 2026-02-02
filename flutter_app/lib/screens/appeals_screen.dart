import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../i18n/localization_service.dart';

class AppealsScreen extends StatefulWidget {
  const AppealsScreen({super.key});

  @override
  State<AppealsScreen> createState() => _AppealsScreenState();
}

class _AppealsScreenState extends State<AppealsScreen> {
  final TextEditingController _reasonCtrl = TextEditingController();
  bool _submitting = false;
  List<ModerationAppeal> _appeals = [];
  bool _loadingList = true;

  @override
  void initState() {
    super.initState();
    _loadAppeals();
  }

  LocalizationService? get _loc => LocalizationService.of(context);

  Future<void> _loadAppeals() async {
    setState(() => _loadingList = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      final list = await auth.getMyAppeals();
      if (!mounted) return;
      setState(() {
        _appeals = list;
      });
    } catch (_) {
      // Silenciar errores en carga inicial
    } finally {
      if (mounted) setState(() => _loadingList = false);
    }
  }

  Future<void> _submit() async {
    final reason = _reasonCtrl.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loc?.translate('appeals.reason_required') ?? 'Debes explicar tu apelación.',
          ),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      await auth.createAppeal(reason: reason);
      if (!mounted) return;

      _reasonCtrl.clear();
      await _loadAppeals();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _loc?.translate('appeals.submitted') ?? 'Apelación enviada. Un moderador la revisará.',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final raw = e.toString();
      final cleaned = raw.startsWith('Exception: ')
          ? raw.substring('Exception: '.length)
          : raw;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(cleaned)),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'APPROVED':
        return _loc?.translate('appeals.status_approved') ?? 'Aprobada';
      case 'REJECTED':
        return _loc?.translate('appeals.status_rejected') ?? 'Rechazada';
      case 'PENDING':
      default:
        return _loc?.translate('appeals.status_pending') ?? 'Pendiente';
    }
  }

  Color _statusColor(BuildContext context, String status) {
    final theme = Theme.of(context);
    switch (status) {
      case 'APPROVED':
        return Colors.greenAccent.shade400;
      case 'REJECTED':
        return theme.colorScheme.error;
      case 'PENDING':
      default:
        return theme.colorScheme.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _loc?.translate('appeals.title') ?? 'Apelaciones de moderación',
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _loc?.translate('appeals.intro') ??
                  'Si crees que una suspensión o sanción fue injusta, puedes enviar una apelación. Un moderador revisará tu caso.',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _reasonCtrl,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: _loc?.translate('appeals.reason_label') ?? 'Explica por qué apelás',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(
                  _loc?.translate('appeals.submit') ?? 'Enviar apelación',
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _loc?.translate('appeals.history_title') ?? 'Tus apelaciones',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loadingList
                  ? const Center(child: CircularProgressIndicator())
                  : _appeals.isEmpty
                      ? Center(
                          child: Text(
                            _loc?.translate('appeals.empty') ??
                                'Aún no has enviado apelaciones.',
                            style: theme.textTheme.bodyMedium,
                          ),
                        )
                      : ListView.separated(
                          itemCount: _appeals.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final a = _appeals[index];
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          _statusLabel(a.status),
                                          style: theme.textTheme.labelLarge?.copyWith(
                                            color: _statusColor(context, a.status),
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          a.type == 'SUSPENSION' ? 'Suspensión' : 'Strikes',
                                          style: theme.textTheme.bodySmall,
                                        ),
                                        const Spacer(),
                                        Text(
                                          '${a.createdAt.day.toString().padLeft(2, '0')}/${a.createdAt.month.toString().padLeft(2, '0')}/${a.createdAt.year}',
                                          style: theme.textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      a.reason,
                                      style: theme.textTheme.bodyMedium,
                                    ),
                                    if (a.adminResponse != null && a.adminResponse!.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        _loc?.translate('appeals.admin_response') ?? 'Respuesta del equipo:',
                                        style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        a.adminResponse!,
                                        style: theme.textTheme.bodySmall,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
