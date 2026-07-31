import 'package:flutter/material.dart';

/// Feature-local widget — only used inside `home`. Widgets shared across
/// multiple features belong in `core/widgets` instead.
class CounterDisplay extends StatelessWidget {
  const CounterDisplay({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text('You have pushed the button this many times:'),
        Text('$count', style: Theme.of(context).textTheme.headlineMedium),
      ],
    );
  }
}
