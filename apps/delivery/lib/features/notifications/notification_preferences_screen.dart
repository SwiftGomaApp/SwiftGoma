import 'package:delivery/core/network/api_exception.dart';
import 'package:delivery/features/notifications/data/models/notification_preference.dart';
import 'package:delivery/features/notifications/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Opens the notification preferences as a native modal bottom sheet.
void showNotificationPreferencesSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => const _NotificationPreferencesSheet(),
  );
}

class _NotificationPreferencesSheet extends ConsumerWidget {
  const _NotificationPreferencesSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final prefs = ref.watch(notificationPreferencesProvider);
    final notifier = ref.read(notificationPreferencesProvider.notifier);

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Text(
              'Préférences de notification',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          Flexible(
            child: prefs.when(
              data: (byType) => ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                itemCount: notificationPreferenceTypes.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final type = notificationPreferenceTypes[index];
                  final pref = byType[type]!;
                  return _PreferenceCard(
                    type: type,
                    pref: pref,
                    onInAppChanged: (value) => notifier.setInApp(type, value),
                    onPushChanged: (value) => notifier.setPush(type, value),
                    onSmsChanged: (value) => notifier.setSms(type, value),
                  );
                },
              ),
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator.adaptive()),
              ),
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  apiExceptionOf(error)?.message ??
                      'Impossible de charger vos préférences.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: colorScheme.error),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PreferenceCard extends StatelessWidget {
  const _PreferenceCard({
    required this.type,
    required this.pref,
    required this.onInAppChanged,
    required this.onPushChanged,
    required this.onSmsChanged,
  });

  final String type;
  final NotificationPreference pref;
  final ValueChanged<bool> onInAppChanged;
  final ValueChanged<bool> onPushChanged;
  final ValueChanged<bool> onSmsChanged;

  static const _meta = {
    'ORDER_STATUS': (
      'Statut de commande',
      'Suivi de vos livraisons',
      Icons.local_shipping_outlined,
    ),
    'ORDER_MESSAGE': (
      'Messages de commande',
      'Messages des clients et vendeurs',
      Icons.chat_bubble_outline,
    ),
    'SYSTEM': (
      'Système',
      "Annonces et mises à jour de l'application",
      Icons.campaign_outlined,
    ),
  };

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final (title, description, icon) = _meta[type]!;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: colorScheme.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 19, color: colorScheme.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ChannelChip(
                icon: Icons.notifications_none_rounded,
                label: "Dans l'app",
                value: pref.inApp,
                onChanged: onInAppChanged,
              ),
              _ChannelChip(
                icon: Icons.phone_iphone_rounded,
                label: 'Push',
                value: pref.push,
                onChanged: onPushChanged,
              ),
              _ChannelChip(
                icon: Icons.sms_outlined,
                label: 'SMS',
                value: pref.sms,
                onChanged: onSmsChanged,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChannelChip extends StatelessWidget {
  const _ChannelChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(999),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value
              ? colorScheme.primary
              : colorScheme.onSurface.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: value
                  ? colorScheme.onPrimary
                  : colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: value
                    ? colorScheme.onPrimary
                    : colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
