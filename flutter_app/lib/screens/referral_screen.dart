import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  late Future<Map<String, dynamic>> _referralDataFuture;
  late Future<Map<String, dynamic>> _exclusiveRewardsFuture;
  String _selectedTab = 'overview'; // overview, referrals, rewards, leaderboard

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    setState(() {
      _referralDataFuture = placeService.getReferralInfo();
      _exclusiveRewardsFuture = placeService.getExclusiveRewards();
    });
  }

  void _shareReferralCode(String code, String referralUrl) {
    Share.share(
      '¡Únete a BEDIC! Usa mi código de referido: $code\n$referralUrl',
      subject: 'Únete a BEDIC conmigo',
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sistema de Referidos'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Tabs
            Container(
              color: theme.appBarTheme.backgroundColor,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildTab('overview', '📊 Resumen', theme),
                    _buildTab('referrals', '👥 Mis Referidos', theme),
                    _buildTab('rewards', '🎁 Recompensas', theme),
                    _buildTab('leaderboard', '🏆 Ranking', theme),
                  ],
                ),
              ),
            ),
            // Contenido
            FutureBuilder<Map<String, dynamic>>(
              future: _referralDataFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator(),
                  );
                }

                if (snapshot.hasError) {
                  return Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Error: ${snapshot.error}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadData,
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  );
                }

                final data = snapshot.data ?? {};
                final code = data['code'] ?? '';
                final referralUrl = data['referralUrl'] ?? '';
                final stats = data['stats'] ?? {};

                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_selectedTab == 'overview') ...[
                        _buildOverviewTab(code, referralUrl, stats, theme),
                      ] else if (_selectedTab == 'referrals') ...[
                        _buildReferralsTab(data, theme),
                      ] else if (_selectedTab == 'rewards') ...[
                        _buildRewardsTab(theme),
                      ] else if (_selectedTab == 'leaderboard') ...[
                        _buildLeaderboardTab(theme),
                      ],
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(String tabId, String label, ThemeData theme) {
    final isActive = _selectedTab == tabId;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = tabId),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? theme.primaryColor : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
            color: isActive ? theme.primaryColor : Colors.grey,
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewTab(String code, String referralUrl, Map<String, dynamic> stats, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Código de referido
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tu Código de Referido',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: theme.primaryColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        code,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: theme.primaryColor,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        referralUrl,
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  gap: 8,
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Código copiado')),
                          );
                        },
                        icon: const Icon(Icons.copy),
                        label: const Text('Copiar'),
                      ),
                    ),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _shareReferralCode(code, referralUrl),
                        icon: const Icon(Icons.share),
                        label: const Text('Compartir'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        // Estadísticas
        Text(
          'Estadísticas',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            _buildStatCard(
              '👥',
              'Total Referidos',
              '${stats['totalReferrals'] ?? 0}',
              theme,
            ),
            _buildStatCard(
              '✅',
              'Completados',
              '${stats['completedReferrals'] ?? 0}',
              theme,
            ),
            _buildStatCard(
              '⏳',
              'Pendientes',
              '${stats['pendingReferrals'] ?? 0}',
              theme,
            ),
            _buildStatCard(
              '⭐',
              'Recompensas',
              '${stats['totalRewardsEarned'] ?? 0} XP',
              theme,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String icon, String label, String value, ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 8),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReferralsTab(Map<String, dynamic> data, ThemeData theme) {
    final referredUsers = data['referredUsers'] as List? ?? [];

    if (referredUsers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: theme.disabledColor),
            const SizedBox(height: 16),
            Text(
              'Aún no tienes referidos',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Comparte tu código para empezar',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: referredUsers.length,
      itemBuilder: (context, index) {
        final referral = referredUsers[index] as Map<String, dynamic>;
        final status = referral['status'] ?? 'pending';
        final statusColor = status == 'completed' ? Colors.green : Colors.orange;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              child: Text('${index + 1}'),
            ),
            title: Text(referral['userId']['username'] ?? 'Usuario'),
            subtitle: Text(
              referral['userId']['current_level'] ?? 'Novato',
              style: const TextStyle(fontSize: 12),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                status == 'completed' ? '✅ Completado' : '⏳ Pendiente',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: statusColor,
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRewardsTab(ThemeData theme) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _exclusiveRewardsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        final data = snapshot.data ?? {};
        final currentReferrals = data['currentReferrals'] ?? 0;
        final unlockedRewards = data['unlockedRewards'] as List? ?? [];
        final nextRewards = data['nextRewards'] as List? ?? [];
        final progress = data['progressToNextReward'] as Map? ?? {};

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progreso
            if (progress.isNotEmpty) ...[
              Text(
                'Progreso a Próxima Recompensa',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${progress['current']} / ${progress['required']} referidos'),
                          Text('${progress['remaining']} restantes'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: (progress['current'] as num).toDouble() / (progress['required'] as num).toDouble(),
                          minHeight: 8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
            // Recompensas desbloqueadas
            if (unlockedRewards.isNotEmpty) ...[
              Text(
                '🎉 Recompensas Desbloqueadas',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...unlockedRewards.map((reward) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: Colors.green.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reward['description'] ?? 'Recompensa Exclusiva',
                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Desbloqueada en ${reward['minReferrals']} referidos',
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.green),
                      ),
                    ],
                  ),
                ),
              )),
              const SizedBox(height: 24),
            ],
            // Próximas recompensas
            if (nextRewards.isNotEmpty) ...[
              Text(
                '🎯 Próximas Recompensas',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...nextRewards.map((reward) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reward['description'] ?? 'Recompensa Exclusiva',
                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Desbloquea en ${reward['minReferrals']} referidos (${reward['minReferrals'] - currentReferrals} restantes)',
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              )),
            ],
          ],
        );
      },
    );
  }

  Widget _buildLeaderboardTab(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.trending_up, size: 64, color: theme.primaryColor),
          const SizedBox(height: 16),
          Text(
            'Ranking de Referidos',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            'Los mejores referidores de la comunidad',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
