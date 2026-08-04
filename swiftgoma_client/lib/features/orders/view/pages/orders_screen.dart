import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:swiftgoma_client/app/routes/app_routes.dart';
import 'package:swiftgoma_client/core/theme/app_colors.dart';
import 'package:swiftgoma_client/core/theme/app_typography.dart';
import 'package:swiftgoma_client/core/widgets/button/view/app_button.dart';
import 'package:swiftgoma_client/core/widgets/placeholder/image_placeholder.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  static const List<String> _tabs = ['Pending', 'In progress', 'Finished'];
  static const List<({String name, String location})> _inProgress = [
    (name: 'Amazing T-shirt', location: 'Goma, Nord-Kivu'),
    (name: 'Faboulous Pants', location: 'Goma, Nord-Kivu'),
    (name: 'Spectacular Dress', location: 'Goma, Nord-Kivu'),
    (name: 'Stunning Jacket', location: 'Goma, Nord-Kivu'),
  ];

  int _tabIndex = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralLight5,
      appBar: AppBar(
        backgroundColor: AppColors.neutralLight5,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 20.w,
            color: AppColors.neutralDark1,
          ),
        ),
        title: Text(
          'My Orders',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
        actions: [
          IconButton(
            onPressed: () => context.push(AppRoutes.search),
            icon: Icon(Icons.search, size: 24.w, color: AppColors.highlight1),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 8.h),
            child: _buildTabs(),
          ),
          Expanded(
            child: switch (_tabIndex) {
              1 => _buildInProgress(),
              _ => _buildEmpty(_tabs[_tabIndex]),
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        color: AppColors.neutralLight4,
        borderRadius: BorderRadius.circular(14.r),
      ),
      child: Row(
        children: List.generate(_tabs.length, (index) {
          final bool isActive = index == _tabIndex;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tabIndex = index),
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 10.h),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isActive
                      ? AppColors.neutralLight5
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Text(
                  _tabs[index],
                  style: isActive
                      ? AppTypography.h5.copyWith(
                          color: AppColors.neutralDark1,
                        )
                      : AppTypography.bodyS.copyWith(
                          color: AppColors.neutralDark4,
                        ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildInProgress() {
    return ListView(
      padding: EdgeInsets.fromLTRB(24.w, 8.h, 24.w, 24.h),
      children: [
        Text(
          'In Progress Orders',
          style: AppTypography.h3.copyWith(color: AppColors.neutralDark1),
        ),
        SizedBox(height: 16.h),
        for (final order in _inProgress) ...[
          GestureDetector(
            onTap: () => context.push(AppRoutes.deliveryMap),
            child: Container(
              margin: EdgeInsets.only(bottom: 14.h),
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: AppColors.neutralLight4,
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 74,
                    height: 74,
                    child: ImagePlaceholder(),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.name,
                          style: AppTypography.h4.copyWith(
                            color: AppColors.neutralDark1,
                          ),
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          order.location,
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.neutralDark5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.only(right: 16.w),
                    child: Icon(
                      Icons.location_on,
                      size: 20.w,
                      color: AppColors.highlight1,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildEmpty(String tab) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 32.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 100.w,
              height: 100.w,
              child: ImagePlaceholder(
                borderRadius: BorderRadius.circular(28.r),
              ),
            ),
            SizedBox(height: 24.h),
            Text(
              'No ${tab.toLowerCase()} Orders',
              style: AppTypography.h2.copyWith(color: AppColors.neutralDark1),
            ),
            SizedBox(height: 8.h),
            Text(
              'All ${tab.toLowerCase()} orders will be displayed here.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.neutralDark4,
              ),
            ),
            SizedBox(height: 24.h),
            AppButton(
              label: 'Make an Order',
              fullWidth: false,
              onPressed: () => context.go(AppRoutes.explore),
            ),
          ],
        ),
      ),
    );
  }
}
