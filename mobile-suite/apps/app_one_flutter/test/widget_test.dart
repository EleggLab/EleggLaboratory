import 'package:flutter_test/flutter_test.dart';
import 'package:app_one_flutter/main.dart';

void main() {
  testWidgets('shared ui page renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.textContaining('Shared UI'), findsOneWidget);
  });
}
