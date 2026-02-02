import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/admin_service.dart';
import '../services/place_service.dart';
import 'admin_dashboard_overview_tab.dart';
import 'public_profile_screen.dart';
import 'admin_moderation_detail_screen.dart';
import 'admin_place_editor_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final GlobalKey<_ModerationTabState> _moderationKey =
      GlobalKey<_ModerationTabState>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleOverviewMetricTap(String metricKey) {
    switch (metricKey) {
      case 'users':
        _tabController.animateTo(2); // pestaña Usuarios
        break;
      case 'places':
        _tabController.animateTo(3); // pestaña Lugares / Actividad
        break;
      case 'reports':
        _tabController.animateTo(1); // pestaña Moderación
        _moderationKey.currentState?.setFilterType('reports');
        break;
      case 'ratings':
        _tabController.animateTo(1); // pestaña Moderación
        _moderationKey.currentState?.setFilterType('ratings');
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final adminService = Provider.of<AdminService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Centro de administración BEDIC'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard_outlined), text: 'Resumen'),
            Tab(icon: Icon(Icons.gavel_outlined), text: 'Moderación'),
            Tab(icon: Icon(Icons.people_alt_outlined), text: 'Usuarios'),
            Tab(icon: Icon(Icons.place_outlined), text: 'Lugares / Actividad'),
            Tab(icon: Icon(Icons.verified_outlined), text: 'Verificaciones'),
            Tab(icon: Icon(Icons.campaign_outlined), text: 'Anuncios'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          AdminOverviewTab(
            adminService: adminService,
            onMetricTap: _handleOverviewMetricTap,
          ),
          _ModerationTab(
            key: _moderationKey,
            adminService: adminService,
          ),
          _UsersTab(adminService: adminService),
          _PlacesActivityTab(adminService: adminService),
          _VerificationsTab(adminService: adminService),
          _AnnouncementsTab(adminService: adminService),
        ],
      ),
    );
  }

}

class _ModerationTab extends StatefulWidget {
  final AdminService adminService;

  const _ModerationTab({Key? key, required this.adminService}) : super(key: key);

  @override
  State<_ModerationTab> createState() => _ModerationTabState();
}

class _ModerationTabState extends State<_ModerationTab> {
  bool _loading = true;
  String? _error;
  List<ModerationItem> _items = [];
  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _userCtrl = TextEditingController();
  final TextEditingController _categoryCtrl = TextEditingController();
  String _selectedType = 'all'; // all, reports, ratings, events
  DateTime? _from;
  DateTime? _to;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _userCtrl.dispose();
    _categoryCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final keyword = _searchCtrl.text.trim();
      final username = _userCtrl.text.trim();
      final category = _categoryCtrl.text.trim();
      final typeParam = _selectedType == 'all' ? null : _selectedType;
      final items = await widget.adminService.fetchModerationFeed(
        keyword: keyword.isEmpty ? null : keyword,
        username: username.isEmpty ? null : username,
        category: category.isEmpty ? null : category,
        type: typeParam,
        from: _from,
        to: _to,
      );
      setState(() {
        _items = items;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void setFilterType(String type) {
    setState(() {
      _selectedType = type;
    });
    _loadData();
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
      await _loadData();
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
      await _loadData();
    }
  }

  void _clearFilters() {
    _searchCtrl.clear();
    _userCtrl.clear();
    _categoryCtrl.clear();
    setState(() {
      _selectedType = 'all';
      _from = null;
      _to = null;
    });
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error al cargar feed de moderación:',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadData,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (_items.isEmpty) {
      return const Center(
        child: Text('No hay elementos en la cola de moderación por ahora.'),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              labelText: 'Buscar por texto',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchCtrl.clear();
                  _loadData();
                },
              ),
            ),
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _loadData(),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _userCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Usuario (opcional)',
                    prefixIcon: Icon(Icons.person_search_outlined),
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _loadData(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _categoryCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Categoría (opcional)',
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _loadData(),
                ),
              ),
            ],
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
                    value: 'reports',
                    child: Text('Reportes'),
                  ),
                  DropdownMenuItem(
                    value: 'ratings',
                    child: Text('Calificaciones'),
                  ),
                  DropdownMenuItem(
                    value: 'events',
                    child: Text('Eventos'),
                  ),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() {
                    _selectedType = value;
                  });
                  _loadData();
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
                      ? 'Desde: ${_from!.toLocal().toString().split(' ')[0]}'
                      : 'Desde: inicio',
                ),
              ),
              OutlinedButton.icon(
                onPressed: _pickToDate,
                icon: const Icon(Icons.calendar_today_outlined),
                label: Text(
                  _to != null
                      ? 'Hasta: ${_to!.toLocal().toString().split(' ')[0]}'
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
          ..._items.map((item) {
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Icon(
                  item.type == 'report'
                      ? Icons.flag_outlined
                      : (item.type == 'event'
                          ? Icons.event_outlined
                          : Icons.star_rate_outlined),
                ),
                title: Text(
                  item.summary.isNotEmpty
                      ? item.summary
                      : 'Elemento de moderación',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.placeName != null)
                      Text(
                        item.placeName!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    Text('@${item.username}',
                        style: theme.textTheme.bodySmall),
                  ],
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.open_in_new),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AdminModerationDetailScreen(
                          adminService: widget.adminService,
                          item: item,
                        ),
                      ),
                    );
                  },
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _VerificationsTab extends StatefulWidget {
  final AdminService adminService;

  const _VerificationsTab({required this.adminService});

  @override
  State<_VerificationsTab> createState() => _VerificationsTabState();
}

class _VerificationsTabState extends State<_VerificationsTab> {
  bool _loading = true;
  String? _error;
  List<VerificationRequest> _requests = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await widget.adminService.fetchVerificationRequests();
      if (!mounted) return;
      setState(() {
        _requests = list;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _resolve(VerificationRequest req, bool approve) async {
    await widget.adminService.resolveVerification(req.id, approve: approve);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          approve
              ? 'Verificación de @${req.username} aprobada.'
              : 'Verificación de @${req.username} rechazada.',
        ),
      ),
    );
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error al cargar verificaciones:',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (_requests.isEmpty) {
      return const Center(
        child: Text('No hay solicitudes de verificación por ahora.'),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final req = _requests[index];
          final statusColor = req.status == 'approved'
              ? Colors.green
              : (req.status == 'rejected' ? Colors.redAccent : Colors.orange);
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: statusColor.withOpacity(0.15),
                child: Icon(
                  req.status == 'approved'
                      ? Icons.verified
                      : (req.status == 'rejected'
                          ? Icons.cancel_outlined
                          : Icons.hourglass_bottom),
                  color: statusColor,
                ),
              ),
              title: Text('@${req.username} · ${req.badge}'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (req.evidence.isNotEmpty)
                    Text(
                      req.evidence,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),
                  Text(
                    'Enviado: ${req.submittedAt.toLocal().toString().split('.').first}',
                    style: theme.textTheme.bodySmall,
                  ),
                  Text(
                    'Estado: ${req.status}',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: statusColor),
                  ),
                ],
              ),
              trailing: req.status == 'pending'
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.check_circle_outline,
                              color: Colors.green),
                          tooltip: 'Aprobar',
                          onPressed: () => _resolve(req, true),
                        ),
                        IconButton(
                          icon: const Icon(Icons.cancel_outlined,
                              color: Colors.redAccent),
                          tooltip: 'Rechazar',
                          onPressed: () => _resolve(req, false),
                        ),
                      ],
                    )
                  : null,
            ),
          );
        },
      ),
    );
  }
}

class _AnnouncementsTab extends StatefulWidget {
  final AdminService adminService;

  const _AnnouncementsTab({required this.adminService});

  @override
  State<_AnnouncementsTab> createState() => _AnnouncementsTabState();
}

class _AnnouncementsTabState extends State<_AnnouncementsTab> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  final _categoriesCtrl = TextEditingController();
  bool _pinned = false;
  bool _sending = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    _categoriesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _sending = true);
    try {
      final rawCats = _categoriesCtrl.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
      await widget.adminService.publishAnnouncement(
        title: _titleCtrl.text.trim(),
        message: _messageCtrl.text.trim(),
        categories: rawCats.isEmpty ? null : rawCats,
        pinned: _pinned,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Anuncio publicado correctamente.')),
      );
      _titleCtrl.clear();
      _messageCtrl.clear();
      _categoriesCtrl.clear();
      setState(() => _pinned = false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo publicar el anuncio: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Publicar anuncio global',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Título',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'El título es obligatorio' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageCtrl,
              decoration: const InputDecoration(
                labelText: 'Mensaje',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
              maxLines: 5,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'El mensaje es obligatorio' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _categoriesCtrl,
              decoration: const InputDecoration(
                labelText: 'Categorías (separadas por coma, opcional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Switch(
                  value: _pinned,
                  onChanged: (v) => setState(() => _pinned = v),
                ),
                const SizedBox(width: 8),
                const Text('Fijar anuncio en la parte superior'),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _sending ? null : _submit,
                icon: _sending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(_sending ? 'Publicando...' : 'Publicar anuncio'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UsersTab extends StatefulWidget {
  final AdminService adminService;

  const _UsersTab({required this.adminService});

  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  bool _loading = true;
  String? _error;
  List<AdminUser> _users = [];
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final users = await widget.adminService.fetchUsers();
      if (!mounted) return;
      setState(() {
        _users = users;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'admin':
        return const Color(0xFFFFD700);
      case 'moderator':
        return const Color(0xFF1DA1F2);
      default:
        return const Color(0xFF6C757D);
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderador';
      default:
        return 'Usuario';
    }
  }

  Future<void> _muteUser(AdminUser user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Silenciar usuario'),
        content: Text(
            '¿Seguro que quieres silenciar a @${user.username} durante 7 días?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Silenciar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    await widget.adminService.muteUser(user.id, days: 7);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Usuario @${user.username} silenciado.')),
    );
    await _load();
  }

  Future<void> _deleteUser(AdminUser user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar usuario'),
        content: Text(
            'Esta acción no se puede deshacer. ¿Eliminar definitivamente a @${user.username}?'),
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
    await widget.adminService.deleteUser(user.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Usuario @${user.username} eliminado.')),
    );
    await _load();
  }

  Future<void> _changeEmail(AdminUser user) async {
    final controller = TextEditingController(text: user.email);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cambiar correo'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Nuevo correo'),
          keyboardType: TextInputType.emailAddress,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Guardar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await widget.adminService.updateUserEmail(user.id, controller.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Correo de @${user.username} actualizado.')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo actualizar correo: $e')),
      );
    }
  }

  Future<void> _resetPassword(AdminUser user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restablecer contraseña'),
        content: Text(
            'Se enviará un email de restablecimiento a ${user.email}. ¿Continuar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Enviar email'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await widget.adminService.adminResetPassword(user.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Email de restablecimiento enviado a ${user.email}.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo enviar email de restablecimiento: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error al cargar usuarios:',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (_users.isEmpty) {
      return const Center(
        child: Text('No hay usuarios registrados.'),
      );
    }

    final query = _searchCtrl.text.trim().toLowerCase();
    final visibleUsers = query.isEmpty
        ? _users
        : _users.where((u) {
            final name = u.name.toLowerCase();
            final username = u.username.toLowerCase();
            final email = u.email.toLowerCase();
            return name.contains(query) ||
                username.contains(query) ||
                email.contains(query);
          }).toList();

    final total = visibleUsers.length;
    final admins = visibleUsers.where((u) => u.role == 'admin').length;
    final moderators = visibleUsers.where((u) => u.role == 'moderator').length;
    final regular = visibleUsers.where((u) => u.role == 'user').length;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              labelText: 'Buscar por nombre, usuario o correo',
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
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _UserStatChip(
                label: 'Usuarios totales',
                value: total.toString(),
                color: theme.colorScheme.primary,
              ),
              _UserStatChip(
                label: 'Admins',
                value: admins.toString(),
                color: const Color(0xFFFFD700),
              ),
              _UserStatChip(
                label: 'Moderadores',
                value: moderators.toString(),
                color: const Color(0xFF1DA1F2),
              ),
              _UserStatChip(
                label: 'Usuarios',
                value: regular.toString(),
                color: const Color(0xFF6C757D),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...visibleUsers.map((u) {
            final color = _roleColor(u.role);
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: color.withOpacity(0.15),
                  child: Text(
                    u.username.isNotEmpty
                        ? u.username.substring(0, 1).toUpperCase()
                        : '?',
                    style: TextStyle(color: color),
                  ),
                ),
                title: Text(u.name.isNotEmpty ? u.name : u.username),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('@${u.username} · ${_roleLabel(u.role)}'),
                    Text(
                      'XP ${u.reputationScore} · ${u.currentLevel}',
                      style: theme.textTheme.bodySmall,
                    ),
                    if (u.mutedUntil != null)
                      Text(
                        'Silenciado hasta ${u.mutedUntil!.toLocal().toString().split('.').first}',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: Colors.redAccent),
                      ),
                  ],
                ),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PublicProfileScreen(userId: u.id),
                    ),
                  );
                },
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.mark_email_read_outlined),
                      tooltip: 'Cambiar correo',
                      onPressed: () => _changeEmail(u),
                    ),
                    IconButton(
                      icon: const Icon(Icons.key_outlined),
                      tooltip: 'Restablecer contraseña',
                      onPressed: () => _resetPassword(u),
                    ),
                    IconButton(
                      icon: const Icon(Icons.volume_off),
                      tooltip: 'Silenciar 7 días',
                      onPressed: () => _muteUser(u),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline),
                      tooltip: 'Eliminar usuario',
                      onPressed: () => _deleteUser(u),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _UserStatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _UserStatChip({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Chip(
      backgroundColor: color.withOpacity(0.12),
      avatar: CircleAvatar(
        backgroundColor: color.withOpacity(0.3),
        child: Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ),
      label: Text(
        label,
        style: theme.textTheme.bodyMedium?.copyWith(color: color),
      ),
    );
  }
}

class _PlacesActivityTab extends StatefulWidget {
  final AdminService adminService;

  const _PlacesActivityTab({required this.adminService});

  @override
  State<_PlacesActivityTab> createState() => _PlacesActivityTabState();
}

class _PlacesActivityTabState extends State<_PlacesActivityTab> {
  late Future<PlacesActivityStats> _statsFuture;
  final TextEditingController _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _statsFuture = widget.adminService.fetchPlacesActivityStats();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _openPlaceEditor(String placeId) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    try {
      final place = await placeService.fetchPlaceById(placeId);
      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AdminPlaceEditorScreen(place: place),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo abrir el editor de lugar: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FutureBuilder<PlacesActivityStats>(
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
                  Text('Error al cargar métricas de lugares:',
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _statsFuture =
                            widget.adminService.fetchPlacesActivityStats();
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
                'Lugares y actividad',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  labelText: 'Filtrar por nombre o categoría',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchCtrl.clear();
                      setState(() {
                        _search = '';
                      });
                    },
                  ),
                ),
                onChanged: (value) {
                  setState(() {
                    _search = value.trim().toLowerCase();
                  });
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _UserStatChip(
                    label: 'Lugares activos',
                    value: stats.totalPlaces.toString(),
                    color: Colors.orangeAccent,
                  ),
                  _UserStatChip(
                    label: 'Reportes',
                    value: stats.totalReports.toString(),
                    color: Colors.redAccent,
                  ),
                  _UserStatChip(
                    label: 'Calificaciones',
                    value: stats.totalRatings.toString(),
                    color: Colors.amber,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Categorías más frecuentes',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (stats.topCategories.isEmpty)
                const Text('No hay datos de categorías aún.')
              else
                Column(
                  children: stats.topCategories.map((c) {
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.label_outline),
                      title: Text(c.category),
                      trailing: Text('${c.count} lugares'),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 24),
              Text(
                'Lugares con más reportes',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (stats.topReportedPlaces.isEmpty)
                const Text('Aún no hay reportes.')
              else
                Column(
                  children: stats.topReportedPlaces.where((p) {
                    if (_search.isEmpty) return true;
                    final name = p.name.toLowerCase();
                    final cat = (p.category ?? '').toLowerCase();
                    return name.contains(_search) || cat.contains(_search);
                  }).map((p) {
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.flag_outlined),
                      title: Text(p.name),
                      subtitle: Text(p.category ?? 'Sin categoría'),
                      trailing: Text('${p.count ?? 0} reportes'),
                      onTap: () => _openPlaceEditor(p.id),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 24),
              Text(
                'Lugares mejor valorados',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (stats.topRatedPlaces.isEmpty)
                const Text('Aún no hay calificaciones.')
              else
                Column(
                  children: stats.topRatedPlaces.where((p) {
                    if (_search.isEmpty) return true;
                    final name = p.name.toLowerCase();
                    final cat = (p.category ?? '').toLowerCase();
                    return name.contains(_search) || cat.contains(_search);
                  }).map((p) {
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.star_rate_outlined,
                          color: Colors.amber),
                      title: Text(p.name),
                      subtitle: Text(p.category ?? 'Sin categoría'),
                      trailing: Text(
                          '${(p.avgScore ?? 0).toStringAsFixed(1)}★ · ${p.count ?? 0}'),
                      onTap: () => _openPlaceEditor(p.id),
                    );
                  }).toList(),
                ),
            ],
          ),
        );
      },
    );
  }
}
