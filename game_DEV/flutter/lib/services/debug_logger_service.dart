import 'dart:collection';
import 'package:flutter/foundation.dart';

class DebugLoggerService {
  DebugLoggerService._();

  static final DebugLoggerService instance = DebugLoggerService._();

  final ListQueue<String> _lines = ListQueue<String>();
  static const int _maxLines = 500;

  void info(String message) => _append('INFO', message);

  void warn(String message) => _append('WARN', message);

  void error(String message) => _append('ERROR', message);

  List<String> dump({int max = 300}) {
    final all = _lines.toList(growable: false);
    if (all.length <= max) {
      return all;
    }
    return all.sublist(all.length - max);
  }

  void _append(String level, String message) {
    final line =
        '[${DateTime.now().toIso8601String()}][$level] ${message.trim()}';
    _lines.addLast(line);
    debugPrint(line);
    while (_lines.length > _maxLines) {
      _lines.removeFirst();
    }
  }
}
