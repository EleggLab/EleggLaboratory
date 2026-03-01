import 'package:flutter_test/flutter_test.dart';
import 'package:app_one_flutter/main.dart';

void main() {
  testWidgets('shared assets package screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.textContaining('Shared Assets Package'), findsOneWidget);
  });
}
