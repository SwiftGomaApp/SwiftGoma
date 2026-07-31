import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/core/connectivity/data/connectivity_repository.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_status.dart';

class ConnectivityCubit extends Cubit<ConnectivityStatus> {
  ConnectivityCubit({ConnectivityRepository? repository})
    : _repository = repository ?? ConnectivityRepository(),
      super(ConnectivityStatus.online) {
    _init();
  }

  final ConnectivityRepository _repository;
  StreamSubscription<bool>? _subscription;

  Future<void> _init() async {
    final isConnected = await _repository.isConnected;
    emit(_statusFor(isConnected));

    _subscription = _repository.onConnectivityChanged.listen((isConnected) {
      emit(_statusFor(isConnected));
    });
  }

  ConnectivityStatus _statusFor(bool isConnected) {
    return isConnected ? ConnectivityStatus.online : ConnectivityStatus.offline;
  }

  @override
  Future<void> close() {
    _subscription?.cancel();
    return super.close();
  }
}
