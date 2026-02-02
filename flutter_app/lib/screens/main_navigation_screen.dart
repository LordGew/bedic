import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../i18n/localization_service.dart';
import 'map_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import 'my_reports_screen.dart';
import 'referral_screen.dart';
import 'achievements_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const MapScreen(),
      const NotificationsScreen(),
      const MyReportsScreen(),
      const ReferralScreen(),
      const AchievementsScreen(),
      const ProfileScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = Provider.of<AuthService>(context);

    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.map),
            label: 'Mapa',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.notifications),
            label: 'Notificaciones',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.flag),
            label: 'Reportes',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.card_giftcard),
            label: 'Referidos',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.star),
            label: 'Logros',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
