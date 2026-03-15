import 'package:flutter_test/flutter_test.dart';
import 'package:merge_tactics/main.dart';

void main() {
  testWidgets('App boots into lobby', (WidgetTester tester) async {
    await tester.pumpWidget(const MergeTacticsApp());
    await tester.pumpAndSettle();

    expect(find.text('머지 택틱스'), findsOneWidget);
    expect(find.text('전투 시작'), findsOneWidget);
  });
}
