import '../models/market_models.dart';

class ExecutionGuard {
  ExecutionGuard({this.minIntervalSec = 60});

  final int minIntervalSec;
  final Map<String, DateTime> _lastOrderBySymbol = {};

  bool canExecute(TradeOrder order) {
    final last = _lastOrderBySymbol[order.symbol];
    if (last == null) return true;
    return order.ts.difference(last).inSeconds >= minIntervalSec;
  }

  void markExecuted(TradeOrder order) {
    _lastOrderBySymbol[order.symbol] = order.ts;
  }
}
