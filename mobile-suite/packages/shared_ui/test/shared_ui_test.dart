import 'package:flutter_test/flutter_test.dart';
import 'package:shared_ui/shared_ui.dart';

void main() {
  test('shared ui theme builds', () {
    final theme = SharedUiTheme.light();
    expect(theme.useMaterial3, isTrue);
  });
}
