import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class PublicProfileScreen extends StatefulWidget {
  final String userId;
  const PublicProfileScreen({super.key, required this.userId});

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthService>(context, listen: false);
      auth.getPublicProfile(widget.userId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final profile = auth.visitedProfile;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          profile == null
              ? context.tr('profile.title')
              : '@${profile.username}',
        ),
        elevation: 0,
        backgroundColor: theme.scaffoldBackgroundColor,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      backgroundColor: theme.scaffoldBackgroundColor,
      body: profile == null
          ? const Center(child: CircularProgressIndicator())
          : _buildProfile(profile),
    );
  }

  Future<void> _openReportUserDialog(UserProfile profile) async {
    final placeService = Provider.of<PlaceService>(context, listen: false);
    final descController = TextEditingController();
    const reasonCode = 'OTHER';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('report.create_title')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cuéntanos brevemente por qué quieres reportar a @${profile.username}.',
            ),
            const SizedBox(height: 8),
            TextField(
              controller: descController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: context.tr('report.description_label'),
                hintText: context.tr('report.description_hint'),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.tr('common.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.tr('report.submit')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final description = descController.text.trim();
    if (description.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('report.description_required'))),
      );
      return;
    }

    try {
      await placeService.reportUser(
        targetUserId: widget.userId,
        reason: reasonCode,
        description: description,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('report.submit_success'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${context.tr('report.submit_error_prefix')} $e')),
      );
    }
  }

  Widget _buildProfile(UserProfile profile) {
    final roleColor = _hexToColor(profile.roleColor);
    final isModerator = profile.role == 'admin' || profile.role == 'moderator';
    final theme = Theme.of(context);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header con avatar e información básica
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Avatar
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: roleColor.withOpacity(0.3), width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: roleColor.withOpacity(0.1),
                        backgroundImage: profile.avatarUrl != null
                            ? NetworkImage(profile.avatarUrl!)
                            : null,
                        child: profile.avatarUrl == null
                            ? Icon(
                                Icons.person,
                                size: 40,
                                color: roleColor.withOpacity(0.6),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Información básica
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile.name,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                '@${profile.username}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: roleColor,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (isModerator) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: roleColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        profile.role == 'admin'
                                            ? Icons.verified_user
                                            : Icons.shield_moon,
                                        size: 14,
                                        color: roleColor,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        profile.role == 'admin'
                                            ? 'Admin'
                                            : 'Moderator',
                                        style: TextStyle(
                                          color: roleColor,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Botones de acción
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back, size: 18),
                        label: Text(context.tr('back')),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Consumer<AuthService>(
                        builder: (context, auth, _) {
                          final isCurrentUser = auth.currentUser?.id == widget.userId;
                          return OutlinedButton.icon(
                            onPressed: isCurrentUser ? null : () => _openReportUserDialog(profile),
                            icon: const Icon(Icons.flag_outlined, size: 18),
                            label: Text(isCurrentUser 
                              ? context.tr('profile.title')
                              : context.tr('report.create_title')),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: isCurrentUser ? Colors.grey : Colors.red,
                              side: BorderSide(color: isCurrentUser ? Colors.grey : Colors.red),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Nivel de Contribución
          if (profile.showLevel) ...[
            _buildSection(
              title: context.tr('profile.contribution_level.title'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          profile.selectedTitle.isNotEmpty
                              ? profile.selectedTitle
                              : profile.currentLevel,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: roleColor,
                          ),
                        ),
                        Text(
                          '${profile.reputationScore} XP',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: (profile.reputationScore % 5000) / 5000,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation(roleColor),
                      minHeight: 6,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
          
          // Insignias y Logros
          if (profile.showBadges) ...[
            _buildSection(
              title: context.tr('profile.badges.public_title'),
              child: profile.badges.isEmpty
                  ? Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          context.tr('profile.badges.public_empty'),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ),
                    )
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: profile.badges.map((badge) {
                        IconData icon = Icons.star;
                        if (badge.toLowerCase().contains('verificado')) {
                          icon = Icons.check_circle;
                        } else if (badge.toLowerCase().contains('contributor')) {
                          icon = Icons.auto_awesome;
                        }
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: roleColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: roleColor.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                icon,
                                size: 16,
                                color: roleColor,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                badge,
                                style: TextStyle(
                                  color: roleColor,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required Widget child,
  }) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }

  Color _hexToColor(String code) {
    try {
      if (code.startsWith('#')) {
        return Color(int.parse(code.substring(1, 7), radix: 16) + 0xFF000000);
      }
    } catch (_) {}
    return Colors.grey;
  }
}
