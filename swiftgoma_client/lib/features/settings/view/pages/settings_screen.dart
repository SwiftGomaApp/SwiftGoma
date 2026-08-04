import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/features/auth/view/widgets/logout_dialog.dart';
import 'package:swiftgoma_client/features/settings/view/widgets/settings_tile.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  static const List<String> _items = [
    'My Orders',
    'Saved Messages',
    'Recent Calls',
    'Devices',
    'Notifications',
    'Appearance',
    'Language',
    'Privacy & Security',
    'Storage',
  ];

  Future<void> _onLogoutTap(BuildContext context) async {
    final bool confirmed = await showLogoutDialog(context);
    if (confirmed && context.mounted) {
      context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Settings',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: 16.h),
            const _ProfileHeader(
              name: 'Lucas Scott',
              username: '@lucasscott3',
            ),
            SizedBox(height: 28.h),
            for (int i = 0; i < _items.length; i++) ...[
              SettingsTile(
                title: _items[i],
                onTap: _items[i] == 'My Orders'
                    ? () => context.push(AppRoutes.orders)
                    : () {},
              ),
              if (i < _items.length - 1)
                Divider(
                  color: AppColors.neutralLight3,
                  height: 1,
                  indent: 24.w,
                ),
            ],
            Divider(color: AppColors.neutralLight3, height: 1, indent: 24.w),
            SettingsTile(
              title: 'Log out',
              titleColor: AppColors.error1,
              showChevron: false,
              onTap: () => _onLogoutTap(context),
            ),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.name, required this.username});

  final String name;
  final String username;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: 84.w,
          height: 84.w,
          child: Stack(
            children: [
              Container(
                width: 84.w,
                height: 84.w,
                decoration: const BoxDecoration(
                  color: AppColors.highlight5,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.person,
                  size: 44.w,
                  color: AppColors.highlight4,
                ),
              ),
              Positioned(
                right: 0,
                bottom: 2.h,
                child: Container(
                  width: 26.w,
                  height: 26.w,
                  decoration: BoxDecoration(
                    color: AppColors.highlight1,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.neutralLight5,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    Icons.edit,
                    size: 12.w,
                    color: AppColors.neutralLight5,
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 12.h),
        Text(
          name,
          style: AppTypography.h2.copyWith(color: AppColors.neutralDark1),
        ),
        SizedBox(height: 4.h),
        Text(
          username,
          style: AppTypography.bodyM.copyWith(color: AppColors.neutralDark5),
        ),
      ],
    );
  }
}
