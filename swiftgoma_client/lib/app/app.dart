import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/core/connectivity/view/connectivity_listener.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_cubit.dart';
import 'package:swiftgoma_client/core/theme/app_theme.dart';
import 'routes/app_router.dart';
import 'routes/app_routes.dart';


class SwiftgomaApp extends StatelessWidget {
  const SwiftgomaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ConnectivityCubit(),
      child: MaterialApp(
        title: 'Swiftgoma',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.home,
        onGenerateRoute: AppRouter.onGenerateRoute,
        builder: (context, child) {
          return ConnectivityListener(child: child ?? const SizedBox.shrink());
        },
      ),
    );
  }
}