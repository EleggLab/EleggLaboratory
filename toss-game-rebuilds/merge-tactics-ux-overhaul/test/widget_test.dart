import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_tactics/main.dart';

void main() {
  testWidgets('lobby renders core actions', (WidgetTester tester) async {
    await tester.pumpWidget(const MergeTacticsApp());
    await tester.pump();

    expect(find.text('머지 택틱스'), findsOneWidget);
    expect(find.text('전투 시작'), findsOneWidget);
    expect(find.text('카드 컬렉션'), findsOneWidget);
    expect(find.text('상점'), findsOneWidget);
  });

  testWidgets('can enter battle view without runtime build error', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MergeTacticsApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(InkWell).first);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(Stack), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
