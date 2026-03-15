import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/debug_flags.dart';

void main() {
  test('parseDebugBool accepts 1 and true', () {
    expect(parseDebugBool('1'), isTrue);
    expect(parseDebugBool('true'), isTrue);
    expect(parseDebugBool('TRUE'), isTrue);
    expect(parseDebugBool('on'), isTrue);
    expect(parseDebugBool('yes'), isTrue);
  });

  test('parseDebugBool rejects 0 and false', () {
    expect(parseDebugBool('0'), isFalse);
    expect(parseDebugBool('false'), isFalse);
    expect(parseDebugBool('FALSE'), isFalse);
    expect(parseDebugBool('off'), isFalse);
    expect(parseDebugBool('no'), isFalse);
    expect(parseDebugBool(''), isFalse);
  });
}
