// lib/screens/profile_screen.dart
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../app_state.dart';
import '../i18n/localization_service.dart';
import 'report_form_screen.dart';
import 'admin_place_editor_screen.dart';
import 'login_screen.dart';
import 'appeals_screen.dart';
import 'saved_places_screen.dart';
import 'levels_info_screen.dart';
import 'community_policies_screen.dart';

Color _hexToColor(String code) {
  if (code.length == 7 && code.startsWith('#')) {
    return Color(int.parse(code.substring(1, 7), radix: 16) + 0xFF000000);
  }
  return Colors.grey;
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _localAvatar;
  Uint8List? _localAvatarBytes;
  bool _uploadingAvatar = false;

  Future<void> _confirmDeleteAccount() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final passwordController = TextEditingController();
    final confirmController = TextEditingController();
    bool submitting = false;

    final shouldProceed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setStateDialog) {
            return AlertDialog(
              title: const Text('Eliminar cuenta'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Esta acción es irreversible. Para confirmar, ingresa tu contraseña y escribe ELIMINAR.',
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Contraseña',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: confirmController,
                      decoration: const InputDecoration(
                        labelText: 'Escribe ELIMINAR',
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: submitting
                      ? null
                      : () {
                          Navigator.of(ctx).pop(false);
                        },
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          final pass = passwordController.text;
                          final conf = confirmController.text;

                          if (pass.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Ingresa tu contraseña')),
                            );
                            return;
                          }
                          if (conf.trim() != 'ELIMINAR') {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Debes escribir ELIMINAR exactamente')),
                            );
                            return;
                          }

                          setStateDialog(() => submitting = true);
                          try {
                            await auth.deleteAccount(
                              password: pass,
                              confirmation: conf.trim(),
                            );
                            if (!mounted) return;
                            Navigator.of(ctx).pop(true);
                          } catch (e) {
                            if (!mounted) return;
                            setStateDialog(() => submitting = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Eliminar'),
                ),
              ],
            );
          },
        );
      },
    );

    passwordController.dispose();
    confirmController.dispose();

    if (shouldProceed == true && mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _showComingSoon(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _pickAvatar() async {
    final picked =
        await _picker.pickImage(source: ImageSource.gallery, maxWidth: 700);
    if (picked == null) return;

    Uint8List bytes;
    if (kIsWeb) {
      bytes = await picked.readAsBytes();
    } else {
      bytes = await File(picked.path).readAsBytes();
    }

    // Vista previa local inmediata
    setState(() {
      if (kIsWeb) {
        _localAvatarBytes = bytes;
        _localAvatar = null;
      } else {
        _localAvatar = File(picked.path);
        _localAvatarBytes = null;
      }
      _uploadingAvatar = true;
    });

    try {
      final auth = Provider.of<AuthService>(context, listen: false);

      await auth.uploadAvatar(
        bytes,
        'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );

      // Después de subir, recargamos el perfil en AuthService (ya se hace en uploadAvatar)
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Avatar actualizado correctamente')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo actualizar el avatar: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _uploadingAvatar = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    // por si el perfil aún no se cargó
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthService>(context, listen: false);
      if (auth.userProfile == null) {
        auth.getProfile();
      }
    });
  }


  Future<void> _updateThemeSelection(bool isDark) async {
    final appState = Provider.of<AppState>(context, listen: false);
    final auth = Provider.of<AuthService>(context, listen: false);
    await appState.setTheme(isDark ? ThemeMode.dark : ThemeMode.light);
    try {
      await auth.updatePreferences();
    } catch (_) {
      // Si falla la actualización remota dejamos el cambio local.
    }
  }


  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final profile = auth.userProfile;

    if (profile == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final roleLower = profile.role.toLowerCase();
    final isModerator =
        roleLower.contains('mod') || roleLower.contains('admin');
    final hasVerifiedBadge =
        profile.badges.any((b) => b.toLowerCase().contains('verificado'));

    final roleColor = _hexToColor(profile.roleColor);
    final neon = theme.colorScheme.primary;
    final cardTextColor = isDark ? Colors.white : theme.colorScheme.onSurface;
    final mutedTextColor = cardTextColor.withOpacity(isDark ? 0.72 : 0.7);
    Color cardColor(double opacity) =>
        isDark ? Colors.black.withOpacity(opacity) : theme.colorScheme.surface;
    final chipBackground = isDark
        ? Colors.white.withOpacity(0.08)
        : theme.colorScheme.primary.withOpacity(0.12);
    final backgroundGradient = LinearGradient(
      colors: isDark
          ? const [Color(0xFF06020A), Color(0xFF140B25)]
          : [
              theme.colorScheme.background,
              theme.colorScheme.surfaceVariant.withOpacity(0.7),
            ],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('profile.title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.gavel),
            tooltip: 'Términos y Políticas',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const CommunityPoliciesScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: context.tr('profile.logout'),
            onPressed: () async {
              await auth.logout();
              if (!mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(gradient: backgroundGradient),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // HEADER
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                elevation: 10,
                color: cardColor(0.32),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: _pickAvatar,
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: neon.withOpacity(0.6),
                                blurRadius: 18,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              CircleAvatar(
                                radius: 42,
                                backgroundColor: roleColor.withOpacity(0.25),
                                backgroundImage: kIsWeb && _localAvatarBytes != null
                                    ? MemoryImage(_localAvatarBytes!)
                                    : (!kIsWeb && _localAvatar != null
                                        ? FileImage(_localAvatar!)
                                        : (profile.avatarUrl != null
                                            ? NetworkImage(profile.avatarUrl!)
                                                as ImageProvider
                                            : null)),
                                child: _localAvatar == null && _localAvatarBytes == null && profile.avatarUrl == null
                                    ? const Icon(Icons.person, size: 42)
                                    : null,
                              ),
                              if (_uploadingAvatar)
                                const Positioned(
                                  bottom: 4,
                                  right: 4,
                                  child: SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile.name,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    color: cardTextColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '@${profile.username}',
                                  style: TextStyle(
                                    color: roleColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (hasVerifiedBadge) ...[
                                  const SizedBox(width: 6),
                                  Tooltip(
                                    message: 'Verified Account',
                                    child: Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: roleColor.withOpacity(0.5),
                                            blurRadius: 8,
                                            spreadRadius: 1,
                                          ),
                                        ],
                                      ),
                                      child: Icon(
                                        Icons.verified,
                                        size: 20,
                                        color: roleColor,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                color: roleColor.withOpacity(0.18),
                              ),
                              child: Text(
                                profile.role.toUpperCase(),
                                style: TextStyle(
                                  color: roleColor,
                                  fontSize: 11,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              const SizedBox(height: 24),

              // GAMIFICACIÓN / REPUTACIÓN
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.45),
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.contribution_level.title'),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.auto_awesome,
                              color: roleColor, size: 26),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.selectedTitle.isNotEmpty
                                    ? profile.selectedTitle
                                    : profile.currentLevel,
                                style: TextStyle(
                                  color: roleColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('profile.contribution_level.xp') +
                                    ' ${profile.reputationScore} XP',
                                style: TextStyle(
                                  color: mutedTextColor,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value:
                              (profile.reputationScore % 1000) / 1000.0, // dummy
                          minHeight: 8,
                          backgroundColor:
                              (isDark
                                      ? Colors.white
                                      : theme.colorScheme.onSurface)
                                  .withOpacity(isDark ? 0.15 : 0.08),
                          valueColor:
                              AlwaysStoppedAnimation<Color>(roleColor),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const LevelsInfoScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.auto_awesome, size: 18),
                          label: Text(context.tr('levels_info.title')),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // VISIBILIDAD DE LOGROS
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.visibility.title'),
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 8),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          context.tr('profile.visibility.show_level'),
                          style: TextStyle(color: cardTextColor),
                        ),
                        value: profile.showLevel,
                        onChanged: (value) async {
                          final auth = Provider.of<AuthService>(context, listen: false);
                          try {
                            await auth.updateProfileVisibility(showLevel: value);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  context.tr('profile.visibility.snackbar_updated'),
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
                          }
                        },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          context.tr('profile.visibility.show_badges'),
                          style: TextStyle(color: cardTextColor),
                        ),
                        value: profile.showBadges,
                        onChanged: (value) async {
                          final auth = Provider.of<AuthService>(context, listen: false);
                          try {
                            await auth.updateProfileVisibility(showBadges: value);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  context.tr('profile.visibility.snackbar_updated'),
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
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // TÍTULO PÚBLICO
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.titles.title'),
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        context.tr('profile.titles.current'),
                        style: TextStyle(color: mutedTextColor, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      if (profile.selectedTitle.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: roleColor.withOpacity(0.1),
                              border: Border.all(color: roleColor.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.check_circle, color: roleColor, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    context.tr('profile.titles.using') + ' "${profile.selectedTitle}"',
                                    style: TextStyle(
                                      color: roleColor,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      DropdownButtonFormField<String>(
                        value: profile.selectedTitle.isEmpty
                            ? 'default'
                            : profile.selectedTitle,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          DropdownMenuItem(
                            value: 'default',
                            child: Text(context.tr('profile.titles.option.default')),
                          ),
                          DropdownMenuItem(
                            value: 'Miembro de BEDIC',
                            child: Text(context.tr('profile.titles.option.member')),
                          ),
                          if (profile.reputationScore >= 100)
                            DropdownMenuItem(
                              value: 'Explorador urbano',
                              child: Text(context.tr('profile.titles.option.explorer')),
                            ),
                          if (profile.reputationScore >= 500)
                            DropdownMenuItem(
                              value: 'Guardián de la comunidad',
                              child: Text(context.tr('profile.titles.option.guardian')),
                            ),
                          if (profile.reputationScore >= 2000)
                            DropdownMenuItem(
                              value: 'Reportero experto BEDIC',
                              child: Text(context.tr('profile.titles.option.reporter')),
                            ),
                          if (profile.reputationScore >= 5000)
                            DropdownMenuItem(
                              value: 'Embajador BEDIC',
                              child: Text(context.tr('profile.titles.option.ambassador')),
                            ),
                        ],
                        onChanged: (value) async {
                          if (value == null) return;
                          final auth = Provider.of<AuthService>(context, listen: false);
                          final newTitle = value == 'default' ? '' : value;
                          try {
                            await auth.updateProfileVisibility(selectedTitle: newTitle);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  context.tr('profile.titles.snackbar_updated'),
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
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // REFERIDOS
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.referrals.title'),
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        context.tr('profile.referrals.subtitle'),
                        style: TextStyle(color: mutedTextColor, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      if (profile.referralCode.isNotEmpty)
                        GestureDetector(
                          onTap: () async {
                            await Clipboard.setData(ClipboardData(text: profile.referralCode));
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(context.tr('profile.referrals.code_copied')),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              color: roleColor.withOpacity(0.1),
                              border: Border.all(color: roleColor.withOpacity(0.4)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.copy, size: 18, color: roleColor),
                                const SizedBox(width: 8),
                                Text(
                                  '${context.tr('profile.referrals.code_label')}: ${profile.referralCode}',
                                  style: TextStyle(
                                    color: roleColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        context
                            .tr('profile.referrals.count')
                            .replaceAll('{count}', profile.referralsCount.toString()),
                        style: TextStyle(color: cardTextColor),
                      ),
                    ],
                  ),
                ),
              ),

              // LUGARES GUARDADOS
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: neon.withOpacity(0.15),
                        ),
                        child: const Icon(Icons.bookmark_border, color: Colors.white70),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.tr('saved_places.title'),
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(color: cardTextColor),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.tr('saved_places.empty'),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: mutedTextColor, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const SavedPlacesScreen(),
                            ),
                          );
                        },
                        icon: const Icon(Icons.chevron_right),
                        label: const Text(''),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(40, 40),
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // BADGES
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.badges.title'),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 12),
                      if (profile.badges.isEmpty)
                        Text(
                          context.tr('profile.badges.empty'),
                          style: TextStyle(
                            color: mutedTextColor,
                          ),
                        )
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: profile.badges.map((badge) {
                            IconData icon = Icons.auto_awesome;
                            bool isVerified = badge.toLowerCase() == 'verificado';
                            if (isVerified) {
                              icon = Icons.verified;
                            } else if (badge.toLowerCase().contains('mod')) {
                              icon = Icons.shield_moon;
                            }
                            
                            final chip = Chip(
                              avatar: Container(
                                decoration: isVerified ? BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: roleColor.withOpacity(0.4),
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ) : null,
                                child: Icon(icon, color: roleColor, size: 18),
                              ),
                              label: Text(badge),
                              backgroundColor: isVerified 
                                  ? roleColor.withOpacity(0.15)
                                  : chipBackground,
                              side: isVerified 
                                  ? BorderSide(color: roleColor.withOpacity(0.3), width: 1)
                                  : null,
                              labelStyle: TextStyle(
                                color: isDark
                                    ? Colors.white
                                    : theme.colorScheme.primary,
                                fontWeight: isVerified ? FontWeight.w600 : FontWeight.normal,
                              ),
                            );
                            
                            return isVerified
                                ? Tooltip(
                                    message: 'Official verified account',
                                    child: chip,
                                  )
                                : chip;
                          }).toList(),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // VERIFICACIÓN DE CUENTA
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.verification.title'),
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 12),
                      if (hasVerifiedBadge)
                        Row(
                          children: [
                            Icon(Icons.check_circle,
                                color: roleColor, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                context.tr('profile.verification.already_verified'),
                                style: TextStyle(color: mutedTextColor),
                              ),
                            ),
                          ],
                        )
                      else
                        Text(
                          context.tr('profile.verification.description'),
                          style: TextStyle(color: mutedTextColor),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Cuenta',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 12),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.delete_forever, color: Colors.redAccent),
                        title: Text(
                          'Eliminar cuenta',
                          style: TextStyle(color: cardTextColor),
                        ),
                        subtitle: Text(
                          'Elimina tu cuenta de forma permanente (irreversible)',
                          style: TextStyle(color: mutedTextColor),
                        ),
                        onTap: _confirmDeleteAccount,
                      ),
                    ],
                  ),
                ),
              ),

              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                color: cardColor(0.4),
                elevation: 6,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('profile.appearance.title'),
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: cardTextColor),
                      ),
                      const SizedBox(height: 12),
                      Consumer<AppState>(
                        builder: (context, appState, _) {
                          final bool isDarkSelected = appState.themeMode == ThemeMode.dark;
                          return Row(
                            children: [
                              Expanded(
                                child: ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: Radio<bool>(
                                    value: false,
                                    groupValue: isDarkSelected,
                                    onChanged: (value) {
                                      if (value != null) {
                                        _updateThemeSelection(false);
                                      }
                                    },
                                  ),
                                  title: Text(
                                    context.tr('profile.appearance.light'),
                                    style: TextStyle(color: cardTextColor),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: Radio<bool>(
                                    value: true,
                                    groupValue: isDarkSelected,
                                    onChanged: (value) {
                                      if (value != null) {
                                        _updateThemeSelection(true);
                                      }
                                    },
                                  ),
                                  title: Text(
                                    context.tr('profile.appearance.dark'),
                                    style: TextStyle(color: cardTextColor),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
