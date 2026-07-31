import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/features/home/viewmodel/home_event.dart';
import 'package:swiftgoma_client/features/home/viewmodel/home_state.dart';

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc() : super(const HomeState()) {
    on<HomeCounterIncremented>(_onCounterIncremented);
  }

  void _onCounterIncremented(
    HomeCounterIncremented event,
    Emitter<HomeState> emit,
  ) {
    emit(state.copyWith(counter: state.counter + 1));
  }
}
