import 'package:flutter_bloc/flutter_bloc.dart';

import 'home_event.dart';
import 'home_state.dart';

/// The ViewModel for the home feature.
///
/// Bloc plays the ViewModel role in this MVVM setup: the View (`view/`)
/// dispatches events, the Bloc updates state, the View rebuilds off state.
/// Once there's real data to load, inject a repository from `data/` here
/// via the constructor rather than reaching into `data/` from the View.
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
