import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  String _selectedTab = 'achievements'; // achievements, titles, levels

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Logros y Títulos'),
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
                    _buildTab('achievements', '🏆 Logros', theme),
                    _buildTab('titles', '👑 Títulos', theme),
                    _buildTab('levels', '📊 Niveles', theme),
                  ],
                ),
              ),
            ),
            // Contenido
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_selectedTab == 'achievements') ...[
                    _buildAchievementsTab(theme),
                  ] else if (_selectedTab == 'titles') ...[
                    _buildTitlesTab(theme),
                  ] else if (_selectedTab == 'levels') ...[
                    _buildLevelsTab(theme),
                  ],
                ],
              ),
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

  Widget _buildAchievementsTab(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tus Logros',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            _buildAchievementCard('🎯', 'Primer Lugar', 'Agregaste tu primer lugar', true, theme),
            _buildAchievementCard('💬', '10 Comentarios', 'Escribiste 10 comentarios', true, theme),
            _buildAchievementCard('⭐', '5 Reseñas', 'Escribiste 5 reseñas', true, theme),
            _buildAchievementCard('📸', '20 Fotos', 'Subiste 20 fotos', false, theme),
            _buildAchievementCard('🔥', 'Racha de 7 días', 'Activo 7 días seguidos', false, theme),
            _buildAchievementCard('🏅', 'Moderador', 'Ayudaste a moderar contenido', false, theme),
          ],
        ),
      ],
    );
  }

  Widget _buildAchievementCard(String icon, String title, String description, bool unlocked, ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              icon,
              style: TextStyle(
                fontSize: 32,
                opacity: unlocked ? 1.0 : 0.3,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (!unlocked)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Bloqueado',
                    style: TextStyle(fontSize: 9, color: Colors.grey),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitlesTab(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tus Títulos',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Título Activo',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: theme.primaryColor),
                  ),
                  child: Text(
                    '👑 Community Master',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: theme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Títulos Disponibles',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 5,
          itemBuilder: (context, index) {
            final titles = [
              ('👑', 'Community Master', 'Desbloqueado'),
              ('🌟', 'Star Contributor', 'Desbloqueado'),
              ('🔥', 'Rising Star', 'Bloqueado'),
              ('💎', 'Elite Member', 'Bloqueado'),
              ('🏆', 'Legend', 'Bloqueado'),
            ];
            final (icon, title, status) = titles[index];
            final unlocked = status == 'Desbloqueado';

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Text(icon, style: const TextStyle(fontSize: 24)),
                title: Text(title),
                subtitle: Text(status),
                trailing: unlocked
                    ? Icon(Icons.check_circle, color: Colors.green)
                    : Icon(Icons.lock, color: Colors.grey),
                onTap: unlocked
                    ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Título "$title" seleccionado')),
                        );
                      }
                    : null,
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildLevelsTab(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tu Nivel',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Nivel Actual',
                          style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Nivel 12',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: theme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '🎖️',
                      style: const TextStyle(fontSize: 48),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Experiencia',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: 0.65,
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '6,500 / 10,000 XP',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Próximos Niveles',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 3,
          itemBuilder: (context, index) {
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Text('🎖️', style: const TextStyle(fontSize: 24)),
                title: Text('Nivel ${13 + index}'),
                subtitle: Text('${10000 + (index * 2000)} XP requeridos'),
              ),
            );
          },
        ),
      ],
    );
  }
}
