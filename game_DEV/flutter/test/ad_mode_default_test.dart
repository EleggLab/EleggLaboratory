import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('default ad mode is simulated', () {
    expect(GameOptionsData.defaults.adMode, AdMode.simulated);
  });
}
