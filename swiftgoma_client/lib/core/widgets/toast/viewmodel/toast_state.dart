import 'package:equatable/equatable.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_data.dart';

class ToastState extends Equatable {
  const ToastState({this.current});

  final ToastData? current;

  @override
  List<Object?> get props => [current];
}
