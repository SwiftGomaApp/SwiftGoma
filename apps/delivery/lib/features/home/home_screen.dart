import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/env.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(Env.appName, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.push('/login'),
              child: const Text('Go to Login'),
            ),
          ],
        ),
      ),
    );
  }
}
