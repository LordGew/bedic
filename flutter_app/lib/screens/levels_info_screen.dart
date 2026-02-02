import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../i18n/localization_service.dart';

class LevelsInfoScreen extends StatelessWidget {
  const LevelsInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = Provider.of<AuthService>(context, listen: false);
    final profile = auth.userProfile;

    final neon = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('levels_info.title')),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [const Color(0xFF060814), const Color(0xFF0B1020)]
                : [theme.colorScheme.background, theme.colorScheme.surface],
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('levels_info.subtitle'),
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              Text(
                context.tr('levels_info.description'),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onBackground.withOpacity(0.8),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              if (profile != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: neon.withOpacity(isDark ? 0.16 : 0.12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('levels_info.your_progress'),
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: neon,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${profile.reputationScore} XP',
                        style: theme.textTheme.bodyLarge,
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: (profile.reputationScore % 1000) / 1000.0,
                        minHeight: 6,
                        backgroundColor: theme.colorScheme.onBackground
                            .withOpacity(isDark ? 0.18 : 0.09),
                        valueColor: AlwaysStoppedAnimation<Color>(neon),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        context.tr('levels_info.progress_hint'),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onBackground
                              .withOpacity(0.75),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
              Text(
                context.tr('levels_info.levels_title'),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              _LevelTile(
                icon: Icons.emoji_people,
                color: Colors.blueGrey,
                title: 'Novato',
                xpRangeKey: 'levels_info.level.novice.range',
                descKey: 'levels_info.level.novice.desc',
              ),
              _LevelTile(
                icon: Icons.explore,
                color: Colors.green,
                title: 'Explorador',
                xpRangeKey: 'levels_info.level.explorer.range',
                descKey: 'levels_info.level.explorer.desc',
              ),
              _LevelTile(
                icon: Icons.military_tech,
                color: Colors.orange,
                title: 'Colaborador Activo',
                xpRangeKey: 'levels_info.level.active.range',
                descKey: 'levels_info.level.active.desc',
              ),
              _LevelTile(
                icon: Icons.assignment_turned_in,
                color: Colors.purple,
                title: 'Reportero Experto',
                xpRangeKey: 'levels_info.level.reporter.range',
                descKey: 'levels_info.level.reporter.desc',
              ),
              _LevelTile(
                icon: Icons.auto_awesome,
                color: Colors.amber,
                title: 'Maestro de la Comunidad',
                xpRangeKey: 'levels_info.level.master.range',
                descKey: 'levels_info.level.master.desc',
              ),
              const SizedBox(height: 24),
              Text(
                context.tr('levels_info.rewards_title'),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              _BulletText(textKey: 'levels_info.rewards.titles'),
              _BulletText(textKey: 'levels_info.rewards.badges'),
              _BulletText(textKey: 'levels_info.rewards.frames'),
              _BulletText(textKey: 'levels_info.rewards.other'),
              const SizedBox(height: 16),
              Text(
                context.tr('levels_info.rewards_note'),
                style: theme.textTheme.bodySmall?.copyWith(
                  color:
                      theme.colorScheme.onBackground.withOpacity(isDark ? 0.7 : 0.75),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LevelTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String xpRangeKey;
  final String descKey;

  const _LevelTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.xpRangeKey,
    required this.descKey,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withOpacity(0.15),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    context.tr(xpRangeKey),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    context.tr(descKey),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onBackground.withOpacity(0.75),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BulletText extends StatelessWidget {
  final String textKey;

  const _BulletText({required this.textKey});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• '),
          Expanded(
            child: Text(
              context.tr(textKey),
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
