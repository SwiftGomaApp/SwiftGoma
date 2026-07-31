import 'package:flutter/material.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_status.dart';

class ConnectivityBanner extends StatelessWidget {
  const ConnectivityBanner({super.key, required this.status});

  final ConnectivityStatus status;

  @override
  Widget build(BuildContext context) {
    final isOffline = status == ConnectivityStatus.offline;

    return Material(
      color: isOffline ? Colors.red.shade600 : Colors.green.shade600,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isOffline ? Icons.wifi_off : Icons.wifi,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                isOffline ? 'No internet connection' : 'Back online',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}