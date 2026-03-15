import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';

void main() {
  test('picture cache can be reused when points hash is unchanged', () {
    final points = <Offset>[
      const Offset(10, 20),
      const Offset(40, 60),
      const Offset(80, 120),
    ];
    final hash = computeAimPreviewPointsHash(points);
    final shouldRebuild = shouldRebuildAimPictureCache(
      previousHash: hash,
      nextHash: hash,
    );
    expect(shouldRebuild, isFalse);
  });

  test('picture cache must rebuild when points hash changed', () {
    final first = computeAimPreviewPointsHash(<Offset>[
      const Offset(10, 20),
      const Offset(40, 60),
    ]);
    final second = computeAimPreviewPointsHash(<Offset>[
      const Offset(10, 20),
      const Offset(40, 65),
    ]);

    final shouldRebuild = shouldRebuildAimPictureCache(
      previousHash: first,
      nextHash: second,
    );
    expect(shouldRebuild, isTrue);
  });
}
