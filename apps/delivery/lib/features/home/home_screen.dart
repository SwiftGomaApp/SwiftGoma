import 'package:delivery/features/auth/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      body: Center(
        child: currentUser.when(
          data: (user) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: user?.avatarUrl != null
                    ? NetworkImage(user!.avatarUrl!)
                    : null,
                child: user?.avatarUrl == null
                    ? const Icon(Icons.person_outline, size: 32)
                    : null,
              ),
              const SizedBox(height: 16),
              Text(
                user?.name ?? 'Non connecté',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              if (user?.email != null) ...[
                const SizedBox(height: 4),
                Text(
                  user!.email!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () async {
                  await ref.read(currentUserProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                child: const Text('Log out'),
              ),
            ],
          ),
          loading: () => const CircularProgressIndicator(),
          error: (error, stackTrace) => FilledButton(
            onPressed: () => context.push('/login'),
            child: const Text('Go to Login'),
          ),
        ),
      ),
    );
  }
}
