import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';
import 'package:swiftgoma_client/core/widgets/toast/viewmodel/toast_cubit.dart';

extension ToastContextExtension on BuildContext {
  void showToast({
    required ToastVariant variant,
    bool showTitle = true,
    String title = 'Title',
    bool showDescription = true,
    String description = 'Description. Lorem ipsum dolor sit amet.',
    Duration duration = const Duration(seconds: 4),
  }) {
    read<ToastCubit>().show(
      variant: variant,
      showTitle: showTitle,
      title: title,
      showDescription: showDescription,
      description: description,
      duration: duration,
    );
  }
}
