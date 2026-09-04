import 'package:flutter/material.dart';

class DeliveriesScreen extends StatelessWidget {
  const DeliveriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Livraisons')),
      body: Center(
        child: Text(
          'Aucune livraison pour le moment.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}
