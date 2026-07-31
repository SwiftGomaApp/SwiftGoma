import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_data.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';
import 'package:swiftgoma_client/core/widgets/toast/viewmodel/toast_state.dart';

class ToastCubit extends Cubit<ToastState> {
  ToastCubit() : super(const ToastState());

  int _nextId = 0;

  void show({
    required ToastVariant variant,
    bool showTitle = true,
    String title = 'Title',
    bool showDescription = true,
    String description = 'Description. Lorem ipsum dolor sit amet.',
    Duration duration = const Duration(seconds: 4),
  }) {
    emit(
      ToastState(
        current: ToastData(
          id: _nextId++,
          variant: variant,
          showTitle: showTitle,
          title: title,
          showDescription: showDescription,
          description: description,
          duration: duration,
        ),
      ),
    );
  }

  void dismiss() {
    emit(const ToastState());
  }
}
