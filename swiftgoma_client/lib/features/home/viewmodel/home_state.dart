import 'package:equatable/equatable.dart';

class HomeState extends Equatable {
  const HomeState({this.counter = 0});

  final int counter;

  HomeState copyWith({int? counter}) {
    return HomeState(counter: counter ?? this.counter);
  }

  @override
  List<Object?> get props => [counter];
}
