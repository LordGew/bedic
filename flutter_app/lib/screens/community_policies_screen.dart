import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../secrets.dart';

class CommunityPoliciesScreen extends StatefulWidget {
  const CommunityPoliciesScreen({super.key});

  @override
  State<CommunityPoliciesScreen> createState() => _CommunityPoliciesScreenState();
}

class _CommunityPoliciesScreenState extends State<CommunityPoliciesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Map<String, Future<Map<String, dynamic>>> _policyCache = {};
  String _selectedLanguage = 'es';

  final List<Map<String, String>> _policyTypes = [
    {'key': 'TERMS', 'label': 'Términos de Servicio'},
    {'key': 'MODERATION_POLICY', 'label': 'Política de Moderación'},
    {'key': 'APPEALS_PROCESS', 'label': 'Proceso de Apelaciones'},
    {'key': 'CODE_OF_CONDUCT', 'label': 'Código de Conducta'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _policyTypes.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _fetchPolicy(String type) async {
    final cacheKey = '$type-$_selectedLanguage';
    
    if (_policyCache.containsKey(cacheKey)) {
      return _policyCache[cacheKey]!;
    }

    final future = _loadPolicy(type);
    _policyCache[cacheKey] = future;
    return future;
  }

  Future<Map<String, dynamic>> _loadPolicy(String type) async {
    try {
      final response = await http.get(
        Uri.parse('$API_BASE_URL/public/policies/$type/$_selectedLanguage'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data'];
        }
      }

      return {
        'title': 'Política no disponible',
        'content': 'No se pudo cargar esta política en este momento.',
        'type': type
      };
    } catch (e) {
      return {
        'title': 'Error',
        'content': 'Error al cargar la política: $e',
        'type': type
      };
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final neon = theme.colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Términos y Políticas'),
        backgroundColor: neon,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: Colors.white,
          tabs: _policyTypes.map((p) {
            return Tab(text: p['label']);
          }).toList(),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                const Text('Idioma:'),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedLanguage,
                  items: const [
                    DropdownMenuItem(value: 'es', child: Text('Español')),
                    DropdownMenuItem(value: 'en', child: Text('English')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedLanguage = value;
                        _policyCache.clear();
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _policyTypes.map((policyType) {
                return _buildPolicyView(policyType['key']!);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyView(String policyType) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _fetchPolicy(policyType),
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
              ],
            ),
          );
        }

        if (!snapshot.hasData) {
          return const Center(child: Text('No hay datos disponibles'));
        }

        final policy = snapshot.data!;
        final theme = Theme.of(context);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                policy['title'] ?? 'Sin título',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              if (policy['version'] != null)
                Text(
                  'Versión ${policy['version']}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              if (policy['effectiveDate'] != null)
                Text(
                  'Vigente desde: ${DateTime.parse(policy['effectiveDate']).toLocal().toString().split('.').first}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              const SizedBox(height: 24),
              MarkdownBody(
                data: policy['content'] ?? 'Sin contenido',
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: theme.textTheme.bodyMedium,
                  h1: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  h2: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  h3: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  strong: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  em: theme.textTheme.bodyMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                  code: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                    backgroundColor: Colors.grey[200],
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}
