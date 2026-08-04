import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/app/routes/app_router.dart';
import 'package:swiftgoma_client/core/connectivity/view/connectivity_listener.dart';
import 'package:swiftgoma_client/core/connectivity/viewmodel/connectivity_cubit.dart';
import 'package:swiftgoma_client/core/constants/app_design.dart';
import 'package:swiftgoma_client/core/theme/app_theme.dart';
import 'package:swiftgoma_client/core/widgets/toast/view/toast_listener.dart';
import 'package:swiftgoma_client/core/widgets/toast/viewmodel/toast_cubit.dart';

class SwiftgomaApp extends StatelessWidget {
  const SwiftgomaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: AppDesign.figmaSize,
      minTextAdapt: true,
      builder: (context, _) {
        return MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => ConnectivityCubit()),
            BlocProvider(create: (_) => ToastCubit()),
          ],
          child: MaterialApp.router(
            title: 'Swiftgoma',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.theme,
            routerConfig: AppRouter.router,
            builder: (context, child) {
              return ConnectivityListener(
                child: ToastListener(child: child ?? const SizedBox.shrink()),
              );
            },
          ),
        );
      },
    );
  }
}
