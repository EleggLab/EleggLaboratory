import 'package:app_one_flutter/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Asset demo renders title', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('App One · Asset Demo'), findsOneWidget);
    expect(find.text('공용 리소스 연동 샘플'), findsOneWidget);
  });
}
