import '../models/market_models.dart';

class ExecutionGuard {
  ExecutionGuard({this.minIntervalSec = 60, this.maxOrdersPerRun = 200});

  final int minIntervalSec;
  final int maxOrdersPerRun;
  final Map<String, DateTime> _lastOrderBySymbol = {};
  int _orders = 0;

  bool canExecute(TradeOrder order) {
    if (_orders >= maxOrdersPerRun) return false;
    final last = _lastOrderBySymbol[order.symbol];
    if (last == null) return true;
    return order.ts.difference(last).inSeconds >= minIntervalSec;
  }

  void markExecuted(TradeOrder order) {
    _lastOrderBySymbol[order.symbol] = order.ts;
    _orders += 1;
  }
}
