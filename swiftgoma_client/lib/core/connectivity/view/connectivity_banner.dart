import 'package:flutter/material.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_status.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';

class ConnectivityBanner extends StatelessWidget {
  const ConnectivityBanner({super.key, required this.status});

  final ConnectivityStatus status;

  @override
  Widget build(BuildContext context) {
    final isOffline = status == ConnectivityStatus.offline;

    return Material(
      elevation: 4,
      color: isOffline ? AppColors.error1 : AppColors.success2,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isOffline ? Icons.wifi_off : Icons.wifi,
                color: AppColors.neutralLight5,
                size: 14,
              ),
              const SizedBox(width: 6),
              Text(
                isOffline ? 'No internet connection' : 'Back online',
                style: AppTypography.actionM.copyWith(
                  color: AppColors.neutralLight5,
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
