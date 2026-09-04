import 'package:flutter/material.dart';

class AppNavDestination {
  const AppNavDestination({required this.icon, required this.label});

  final IconData icon;
  final String label;
}

class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<AppNavDestination> destinations;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Material(
        elevation: 8,
        shadowColor: Colors.black.withValues(alpha: 0.2),
        color: colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(28),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (var i = 0; i < destinations.length; i++)
                _NavItem(
                  destination: destinations[i],
                  isSelected: i == selectedIndex,
                  onTap: () => onDestinationSelected(i),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.destination,
    required this.isSelected,
    required this.onTap,
  });

  final AppNavDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final activeColor = colorScheme.primary;
    final inactiveColor = colorScheme.onSurface.withValues(alpha: 0.5);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 16 : 12,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? activeColor.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              destination.icon,
              size: 22,
              color: isSelected ? activeColor : inactiveColor,
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              child: isSelected
                  ? Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Text(
                        destination.label,
                        style: TextStyle(
                          color: activeColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    )
                  : const SizedBox(height: 22),
            ),
          ],
        ),
      ),
    );
  }
}
