import 'package:app_two_flutter/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('dashboard renders', (tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.textContaining('Auto Trading'), findsOneWidget);
  });
}
