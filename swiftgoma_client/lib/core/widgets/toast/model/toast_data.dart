import 'package:equatable/equatable.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_variant.dart';

class ToastData extends Equatable {
  const ToastData({
    required this.id,
    required this.variant,
    this.showTitle = true,
    this.title = 'Title',
    this.showDescription = true,
    this.description = 'Description. Lorem ipsum dolor sit amet.',
    this.duration = const Duration(seconds: 4),
  });

  final int id;
  final ToastVariant variant;
  final bool showTitle;
  final String title;
  final bool showDescription;
  final String description;
  final Duration duration;

  @override
  List<Object?> get props => [
    id,
    variant,
    showTitle,
    title,
    showDescription,
    description,
    duration,
  ];
}
