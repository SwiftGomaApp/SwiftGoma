import 'package:delivery/features/deliveries/deliveries_screen.dart';
import 'package:delivery/features/history/history_screen.dart';
import 'package:delivery/features/notifications/notifications_screen.dart';
import 'package:delivery/features/profile/profile_screen.dart';
import 'package:delivery/shared/widgets/app_bottom_nav_bar.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  static const _tabs = [
    DeliveriesScreen(),
    HistoryScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  static const _destinations = [
    AppNavDestination(icon: Icons.local_shipping_outlined, label: 'Livraisons'),
    AppNavDestination(icon: Icons.history_outlined, label: 'Historique'),
    AppNavDestination(
      icon: Icons.notifications_outlined,
      label: 'Notifications',
    ),
    AppNavDestination(icon: Icons.person_outline, label: 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: AppBottomNavBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: _destinations,
      ),
    );
  }
}
