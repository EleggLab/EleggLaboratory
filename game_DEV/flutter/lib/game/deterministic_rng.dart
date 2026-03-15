class DeterministicRng {
  DeterministicRng({required int seed}) : _state = _normalize(seed);

  int _state;

  int get state => _state & 0xFFFFFFFF;

  set state(int next) {
    _state = _normalize(next);
  }

  static int _normalize(int value) {
    final masked = value & 0xFFFFFFFF;
    if (masked == 0) {
      return 0x6D2B79F5;
    }
    return masked;
  }

  int nextUint32() {
    var x = _state & 0xFFFFFFFF;
    x ^= (x << 13) & 0xFFFFFFFF;
    x ^= (x >> 17) & 0xFFFFFFFF;
    x ^= (x << 5) & 0xFFFFFFFF;
    _state = _normalize(x);
    return _state;
  }

  double nextDouble() {
    final u = nextUint32();
    return (u & 0xFFFFFFFF) / 4294967296.0;
  }

  int nextInt(int max) {
    if (max <= 0) {
      throw ArgumentError.value(max, 'max', 'Must be > 0');
    }
    return (nextDouble() * max).floor().clamp(0, max - 1);
  }

  bool nextBool() => (nextUint32() & 1) == 1;
}

String toDateKeyLocal(DateTime now) {
  final year = now.year.toString().padLeft(4, '0');
  final month = now.month.toString().padLeft(2, '0');
  final day = now.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

int dailySeedFromDateKey(String dateKey) {
  var hash = 0x9E3779B9;
  for (final unit in dateKey.codeUnits) {
    hash = (hash ^ unit) & 0xFFFFFFFF;
    hash = ((hash << 6) ^ (hash >> 2) ^ 0x85EBCA6B) & 0xFFFFFFFF;
  }
  if (hash == 0) {
    hash = 1;
  }
  return hash;
}

String isoWeekKey(DateTime date) {
  final normalized = DateTime(date.year, date.month, date.day);
  final weekday = normalized.weekday; // Mon=1 ... Sun=7
  final thursday = normalized.add(Duration(days: 4 - weekday));
  final weekYear = thursday.year;
  final jan4 = DateTime(weekYear, 1, 4);
  final jan4Weekday = jan4.weekday;
  final week1Start = jan4.subtract(Duration(days: jan4Weekday - 1));
  final weekNumber = ((thursday.difference(week1Start).inDays) ~/ 7) + 1;
  final week = weekNumber.toString().padLeft(2, '0');
  return '$weekYear-W$week';
}

int weeklySeedFromWeekKey(String weekKey) {
  var hash = 0xA24BAED4;
  for (final unit in weekKey.codeUnits) {
    hash = (hash ^ unit) & 0xFFFFFFFF;
    hash = ((hash << 5) ^ (hash >> 3) ^ 0x9E3779B9) & 0xFFFFFFFF;
  }
  if (hash == 0) {
    hash = 1;
  }
  return hash;
}
