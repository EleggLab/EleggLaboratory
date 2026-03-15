import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/release/release_guard.dart';

void main() {
  test('symbol dir path is stable and OS-safe', () {
    final path = symbolDirPathForTag('1.2.3+45');
    expect(path, 'build/symbols/1.2.3_45');
    expect(path.contains('\\'), isFalse);
    expect(path.contains('..'), isFalse);
  });
}
