import '../models/market_models.dart';

class PaperBroker {
  PaperBroker({this.initialCash = 100000}) : cash = initialCash;

  final double initialCash;
  double cash;
  final Map<String, Position> positions = {};
  final List<TradeOrder> fills = [];

  void execute(TradeOrder order) {
    final p = positions.putIfAbsent(order.symbol, () => Position(symbol: order.symbol));
    final notion = order.qty * order.price;

    if (order.side == Side.buy) {
      if (cash < notion) return;
      final totalCost = p.avgPrice * p.qty + notion;
      p.qty += order.qty;
      p.avgPrice = p.qty == 0 ? 0 : totalCost / p.qty;
      cash -= notion;
    } else {
      final sellQty = order.qty > p.qty ? p.qty : order.qty;
      if (sellQty <= 0) return;
      p.qty -= sellQty;
      cash += sellQty * order.price;
      if (p.qty == 0) p.avgPrice = 0;
    }

    fills.add(order);
  }

  double positionMarketValue(String symbol, double lastPrice) {
    final p = positions[symbol];
    if (p == null || p.qty <= 0) return 0;
    return p.qty * lastPrice;
  }

  double unrealizedPnl(String symbol, double lastPrice) {
    final p = positions[symbol];
    if (p == null || p.qty <= 0) return 0;
    return (lastPrice - p.avgPrice) * p.qty;
  }

  double equity(Map<String, double> lastPrices) {
    var eq = cash;
    for (final e in positions.entries) {
      eq += e.value.qty * (lastPrices[e.key] ?? e.value.avgPrice);
    }
    return eq;
  }
}
