import 'package:flutter_test/flutter_test.dart';
import 'package:app_two_flutter/main.dart';

void main() {
  testWidgets('shared ui page renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.textContaining('Shared UI'), findsOneWidget);
  });
}
