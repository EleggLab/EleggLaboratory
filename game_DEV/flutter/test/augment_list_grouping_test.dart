import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/augment_data.dart';
import 'package:gamedev/ui/screens/game_screen.dart';

void main() {
  test('augment list grouping groups by rarity and sorts by name', () {
    final grouped = groupAugmentsByRarity(const <AugmentData>[
      AugmentData(
        id: 'z_common',
        name: 'Zeta',
        description: '',
        icon: 'Z',
        rarity: AugmentRarity.common,
      ),
      AugmentData(
        id: 'a_common',
        name: 'Alpha',
        description: '',
        icon: 'A',
        rarity: AugmentRarity.common,
      ),
      AugmentData(
        id: 'rare_1',
        name: 'Rare',
        description: '',
        icon: 'R',
        rarity: AugmentRarity.rare,
      ),
    ]);

    expect(grouped[AugmentRarity.common]!.map((e) => e.name).toList(), <String>[
      'Alpha',
      'Zeta',
    ]);
    expect(grouped[AugmentRarity.rare]!.length, 1);
    expect(grouped[AugmentRarity.epic], isEmpty);
  });
}
