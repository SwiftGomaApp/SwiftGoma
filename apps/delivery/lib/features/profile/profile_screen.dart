import 'dart:io';

import 'package:delivery/features/auth/providers.dart';
import 'package:delivery/features/notifications/notification_preferences_screen.dart';
import 'package:delivery/shared/widgets/app_logo.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _comingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('$feature arrive bientôt.')));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const AppLogo(),
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: colorScheme.surface,
      ),
      body: currentUser.when(
        data: (user) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
          children: [
            _ProfileHeaderCard(
              name: user?.name ?? 'Non connecté',
              subtitle: user?.email ?? user?.phone ?? '',
              avatarUrl: user?.avatarUrl,
            ),
            const SizedBox(height: 28),
            const _SectionLabel('Compte'),
            const SizedBox(height: 10),
            _SettingsCard(
              children: [
                _SettingsRow(
                  icon: Icons.language_outlined,
                  label: 'Langue',
                  trailingText: 'Français',
                  onTap: () => _comingSoon(context, 'Le changement de langue'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const _SectionLabel('Application'),
            const SizedBox(height: 10),
            _SettingsCard(
              children: [
                const _PushNotificationsRow(),
                _SettingsRow(
                  icon: Icons.tune,
                  label: 'Préférences de notification',
                  subtitle: 'Choisissez ce que vous recevez, et comment',
                  onTap: () => showNotificationPreferencesSheet(context),
                ),
                _SettingsRow(
                  icon: Icons.help_outline,
                  label: 'Aide et support',
                  subtitle: 'Contactez notre équipe',
                  onTap: () => _comingSoon(context, "L'aide et le support"),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _SettingsCard(
              children: [
                _SettingsRow(
                  icon: Icons.logout,
                  label: 'Se déconnecter',
                  color: colorScheme.error,
                  showChevron: false,
                  onTap: () async {
                    await ref.read(currentUserProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ),
          ],
        ),
        loading: () =>
            const Center(child: CircularProgressIndicator.adaptive()),
        error: (error, stackTrace) => Center(
          child: FilledButton(
            onPressed: () => context.push('/login'),
            child: const Text('Aller à la connexion'),
          ),
        ),
      ),
    );
  }
}

class _PushNotificationsRow extends StatefulWidget {
  const _PushNotificationsRow();

  @override
  State<_PushNotificationsRow> createState() => _PushNotificationsRowState();
}

class _PushNotificationsRowState extends State<_PushNotificationsRow> {
  bool _enabled = OneSignal.Notifications.permission;

  Future<void> _onChanged(bool value) async {
    final granted = await OneSignal.Notifications.requestPermission(true);
    if (!mounted) return;
    setState(() => _enabled = granted);
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsSwitchRow(
      icon: Icons.notifications_outlined,
      label: 'Notifications push',
      subtitle: 'Autoriser les notifications sur cet appareil',
      value: _enabled,
      onChanged: _onChanged,
    );
  }
}

class _ProfileHeaderCard extends ConsumerStatefulWidget {
  const _ProfileHeaderCard({
    required this.name,
    required this.subtitle,
    this.avatarUrl,
  });

  final String name;
  final String subtitle;
  final String? avatarUrl;

  @override
  ConsumerState<_ProfileHeaderCard> createState() =>
      _ProfileHeaderCardState();
}

class _ProfileHeaderCardState extends ConsumerState<_ProfileHeaderCard> {
  bool _isEditing = false;
  bool _isSaving = false;
  bool _isUploadingAvatar = false;
  String? _error;
  late final _controller = TextEditingController(text: widget.name);
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadAvatar() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Prendre une photo'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choisir depuis la galerie'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final picked = await ImagePicker().pickImage(
      source: source,
      maxWidth: 1024,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;

    setState(() => _isUploadingAvatar = true);
    final error = await ref
        .read(currentUserProvider.notifier)
        .updateAvatar(File(picked.path));
    if (!mounted) return;
    setState(() => _isUploadingAvatar = false);
    if (error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error)));
    }
  }

  void _startEditing() {
    _controller.text = widget.name;
    setState(() {
      _isEditing = true;
      _error = null;
    });
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _focusNode.requestFocus(),
    );
  }

  void _cancelEditing() {
    setState(() {
      _isEditing = false;
      _error = null;
    });
  }

  Future<void> _save() async {
    final newName = _controller.text.trim();
    if (newName.isEmpty || newName == widget.name) {
      setState(() => _isEditing = false);
      return;
    }
    setState(() {
      _isSaving = true;
      _error = null;
    });
    final error = await ref
        .read(currentUserProvider.notifier)
        .updateName(newName);
    if (!mounted) return;
    setState(() {
      _isSaving = false;
      if (error == null) {
        _isEditing = false;
      } else {
        _error = error;
      }
    });
  }

  Widget _buildNameDisplay() {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: _startEditing,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                widget.name,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.edit_outlined,
              size: 16,
              color: colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNameField(ColorScheme colorScheme) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 180,
          child: TextField(
            controller: _controller,
            focusNode: _focusNode,
            enabled: !_isSaving,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            decoration: InputDecoration(
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: colorScheme.primary.withValues(alpha: 0.4),
                ),
              ),
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: colorScheme.primary, width: 2),
              ),
            ),
            onSubmitted: (_) => _save(),
          ),
        ),
        const SizedBox(width: 4),
        if (_isSaving)
          const Padding(
            padding: EdgeInsets.all(8),
            child: SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator.adaptive(strokeWidth: 2),
            ),
          )
        else ...[
          IconButton(
            icon: const Icon(Icons.check, size: 20),
            color: colorScheme.primary,
            visualDensity: VisualDensity.compact,
            onPressed: _save,
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 20),
            color: colorScheme.onSurface.withValues(alpha: 0.5),
            visualDensity: VisualDensity.compact,
            onPressed: _cancelEditing,
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            colorScheme.primary.withValues(alpha: 0.16),
            colorScheme.primary.withValues(alpha: 0.03),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.primary.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: colorScheme.surface,
                child: CircleAvatar(
                  radius: 37,
                  backgroundColor: colorScheme.primary.withValues(alpha: 0.12),
                  backgroundImage: widget.avatarUrl != null
                      ? NetworkImage(widget.avatarUrl!)
                      : null,
                  child: widget.avatarUrl == null
                      ? Icon(
                          Icons.person_outline,
                          size: 36,
                          color: colorScheme.primary,
                        )
                      : null,
                ),
              ),
              if (_isUploadingAvatar)
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.35),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator.adaptive(
                          strokeWidth: 2,
                          // `backgroundColor` is what actually tints the
                          // Cupertino spinner on iOS/macOS; `valueColor`
                          // only affects Material.
                          valueColor: AlwaysStoppedAnimation(Colors.white),
                          backgroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              Positioned(
                right: -2,
                bottom: -2,
                child: InkWell(
                  onTap: _isUploadingAvatar ? null : _pickAndUploadAvatar,
                  customBorder: const CircleBorder(),
                  child: Container(
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: colorScheme.surface,
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.camera_alt_outlined,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _isEditing ? _buildNameField(colorScheme) : _buildNameDisplay(),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: colorScheme.error, fontSize: 12),
            ),
          ],
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              'Livreur',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: colorScheme.primary,
              ),
            ),
          ),
          if (widget.subtitle.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              widget.subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.55),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
        ),
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.surfaceContainerHigh,
      borderRadius: BorderRadius.circular(20),
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1)
              Divider(
                height: 1,
                indent: 60,
                endIndent: 16,
                color: colorScheme.outline.withValues(alpha: 0.15),
              ),
          ],
        ],
      ),
    );
  }
}

class _IconBadge extends StatelessWidget {
  const _IconBadge({required this.icon, this.color});

  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final badgeColor = color ?? colorScheme.primary;

    return Container(
      width: 38,
      height: 38,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 18, color: badgeColor),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.trailingText,
    this.color,
    this.showChevron = true,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final String? trailingText;
  final VoidCallback onTap;
  final Color? color;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final contentColor = color ?? colorScheme.onSurface;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            _IconBadge(icon: icon, color: color),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: contentColor,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailingText != null) ...[
              Text(
                trailingText!,
                style: TextStyle(
                  fontSize: 14,
                  color: colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(width: 4),
            ],
            if (showChevron)
              Icon(
                Icons.chevron_right,
                color: colorScheme.onSurface.withValues(alpha: 0.35),
              ),
          ],
        ),
      ),
    );
  }
}

class _SettingsSwitchRow extends StatelessWidget {
  const _SettingsSwitchRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Row(
        children: [
          _IconBadge(icon: icon),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
