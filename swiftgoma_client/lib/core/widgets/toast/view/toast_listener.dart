import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:swiftgoma_client/core/widgets/toast/model/toast_data.dart';
import 'package:swiftgoma_client/core/widgets/toast/view/toast_card.dart';
import 'package:swiftgoma_client/core/widgets/toast/viewmodel/toast_cubit.dart';
import 'package:swiftgoma_client/core/widgets/toast/viewmodel/toast_state.dart';

class ToastListener extends StatefulWidget {
  const ToastListener({super.key, required this.child});

  final Widget child;

  @override
  State<ToastListener> createState() => _ToastListenerState();
}

class _ToastListenerState extends State<ToastListener> {
  Timer? _timer;

  void _handleToastChange(ToastData? toast) {
    _timer?.cancel();
    if (toast == null) return;
    _timer = Timer(toast.duration, () => context.read<ToastCubit>().dismiss());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ToastCubit, ToastState>(
      listener: (context, state) => _handleToastChange(state.current),
      builder: (context, state) {
        final toast = state.current;

        return Stack(
          children: [
            Positioned.fill(child: widget.child),
            Positioned(
              left: 16.w,
              right: 16.w,
              top: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: EdgeInsets.only(top: 8.h),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    transitionBuilder: (child, animation) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0, -0.3),
                            end: Offset.zero,
                          ).animate(animation),
                          child: child,
                        ),
                      );
                    },
                    child: toast == null
                        ? const SizedBox.shrink(key: ValueKey('toast-empty'))
                        : ToastCard(
                            key: ValueKey(toast.id),
                            data: toast,
                            onClose: () => context.read<ToastCubit>().dismiss(),
                          ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
