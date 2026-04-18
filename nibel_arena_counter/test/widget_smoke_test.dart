import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nibel_arena_counter/src/arena_counter_app.dart';

void main() {
  testWidgets('home screen renders with production assets', (tester) async {
    tester.view.physicalSize = const Size(1290, 2796);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const ArenaCounterApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('니벨 아레나 카운터'), findsOneWidget);
    expect(find.text('턴 대기중'), findsOneWidget);
    expect(find.text('사용 애너지'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('settings sheet opens and theme cards render', (tester) async {
    tester.view.physicalSize = const Size(1290, 2796);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const ArenaCounterApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    await tester.tap(find.byTooltip('설정'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 450));

    expect(find.text('설정'), findsOneWidget);
    expect(find.text('Cooking Oil'), findsOneWidget);
    expect(find.text('Goddess Squad'), findsOneWidget);
    expect(find.text('Infinity Rail'), findsOneWidget);
    expect(find.text('Arcana'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
