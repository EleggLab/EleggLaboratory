import 'package:app_one_flutter/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('elemental home renders', (tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.textContaining('원소 숙성소'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
  });
}
