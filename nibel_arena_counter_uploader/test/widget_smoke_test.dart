import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nibel_arena_counter/src/arena_counter_app.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  testWidgets('home screen renders counter cards', (tester) async {
    tester.view.physicalSize = const Size(1290, 2796);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const ArenaCounterApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('사이즈'), findsOneWidget);
    expect(find.text('사용 코스트'), findsOneWidget);
    expect(find.text('리더 레벨업'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('settings sheet renders theme and upload slots', (tester) async {
    tester.view.physicalSize = const Size(1290, 2796);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const ArenaCounterApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.byIcon(Icons.tune_rounded));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 450));

    expect(find.text('색상 모드'), findsOneWidget);
    expect(find.text('길티 리더'), findsOneWidget);
    expect(find.text('데비&마들렌'), findsOneWidget);
    expect(find.text('배경 이미지'), findsOneWidget);
    expect(find.text('상단 이미지 1'), findsOneWidget);
    expect(find.text('상단 이미지 2'), findsOneWidget);
    expect(find.text('리더 레벨업 이미지'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
