import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/features/home/view/widgets/counter_display.dart';
import 'package:swiftgoma_client/features/home/viewmodel/home_bloc.dart';
import 'package:swiftgoma_client/features/home/viewmodel/home_event.dart';
import 'package:swiftgoma_client/features/home/viewmodel/home_state.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => HomeBloc(),
      child: const _HomeView(),
    );
  }
}

class _HomeView extends StatelessWidget {
  const _HomeView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Swiftgoma'),
      ),
      body: Center(
        child: BlocBuilder<HomeBloc, HomeState>(
          builder: (context, state) => CounterDisplay(count: state.counter),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () =>
            context.read<HomeBloc>().add(const HomeCounterIncremented()),
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
