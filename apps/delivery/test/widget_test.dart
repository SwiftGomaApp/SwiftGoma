import 'package:flutter_test/flutter_test.dart';

import 'package:delivery/app/app.dart';
import 'package:delivery/core/config/env.dart';

void main() {
  testWidgets('HomeScreen shows the app name', (WidgetTester tester) async {
    await tester.pumpWidget(const App());

    expect(find.text(Env.appName), findsOneWidget);
  });
}
