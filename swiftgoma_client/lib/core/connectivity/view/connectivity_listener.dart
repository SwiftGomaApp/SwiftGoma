import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/core/connectivity/view/connectivity_banner.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_cubit.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_status.dart';

class ConnectivityListener extends StatefulWidget {
  const ConnectivityListener({super.key, required this.child});

  final Widget child;

  @override
  State<ConnectivityListener> createState() => _ConnectivityListenerState();
}

class _ConnectivityListenerState extends State<ConnectivityListener> {
  static const _backOnlineDisplayDuration = Duration(seconds: 2);

  bool _showBanner = false;
  ConnectivityStatus _displayedStatus = ConnectivityStatus.online;
  ConnectivityStatus _previousStatus = ConnectivityStatus.online;
  Timer? _hideTimer;

  void _handleStatusChange(ConnectivityStatus status) {
    _hideTimer?.cancel();

    if (status == ConnectivityStatus.offline) {
      setState(() {
        _displayedStatus = status;
        _showBanner = true;
      });
    } else if (_previousStatus == ConnectivityStatus.offline) {
      setState(() {
        _displayedStatus = status;
        _showBanner = true;
      });
      _hideTimer = Timer(_backOnlineDisplayDuration, () {
        if (mounted) setState(() => _showBanner = false);
      });
    }

    _previousStatus = status;
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ConnectivityCubit, ConnectivityStatus>(
      listener: (context, status) => _handleStatusChange(status),
      builder: (context, _) {
        return Column(
          children: [
            AnimatedSize(
              duration: const Duration(milliseconds: 250),
              alignment: Alignment.topCenter,
              child: _showBanner
                  ? ConnectivityBanner(status: _displayedStatus)
                  : const SizedBox(width: double.infinity, height: 0),
            ),
            Expanded(child: widget.child),
          ],
        );
      },
    );
  }
}