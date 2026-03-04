import 'dart:io';

import 'package:app_one_flutter/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('capture key pages', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.binding.setSurfaceSize(const Size(412, 915));
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MyApp),
      matchesGoldenFile('goldens/home_page.png'),
    );

    // time page
    await tester.tap(find.text('시간'));
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MyApp),
      matchesGoldenFile('goldens/time_page.png'),
    );

    // gacha page
    await tester.tap(find.text('가챠'));
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MyApp),
      matchesGoldenFile('goldens/gacha_page.png'),
    );

    // mega page
    await tester.tap(find.text('합성'));
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MyApp),
      matchesGoldenFile('goldens/mega_page.png'),
    );

    // Ensure files exist post-run for convenience in CI logs.
    for (final p in [
      'test/goldens/home_page.png',
      'test/goldens/time_page.png',
      'test/goldens/gacha_page.png',
      'test/goldens/mega_page.png',
    ]) {
      expect(File(p).existsSync(), isTrue, reason: '$p not generated');
    }
  });
}
