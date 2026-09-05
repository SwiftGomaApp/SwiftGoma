import 'package:delivery/features/deliveries/deliveries_screen.dart';
import 'package:delivery/features/history/history_screen.dart';
import 'package:delivery/features/notifications/notifications_screen.dart';
import 'package:delivery/features/profile/profile_screen.dart';
import 'package:delivery/shared/widgets/app_bottom_nav_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Which bottom-nav tab is selected. A plain int index, not tied to
/// [HomeScreen]'s own lifecycle, so external triggers (e.g. tapping a push
/// notification) can switch tabs without needing a BuildContext under
/// HomeScreen.
final homeTabIndexProvider = StateProvider<int>((ref) => 0);

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

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
  Widget build(BuildContext context, WidgetRef ref) {
    final index = ref.watch(homeTabIndexProvider);

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: index, children: _tabs),
      bottomNavigationBar: AppBottomNavBar(
        selectedIndex: index,
        onDestinationSelected: (i) =>
            ref.read(homeTabIndexProvider.notifier).state = i,
        destinations: _destinations,
      ),
    );
  }
}
