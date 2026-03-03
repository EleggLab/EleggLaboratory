class Candle {
  Candle({
    required this.ts,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  final DateTime ts;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;
}

enum Side { buy, sell }

class TradeOrder {
  TradeOrder({
    required this.symbol,
    required this.side,
    required this.qty,
    required this.price,
    required this.ts,
    this.reason = '',
  });

  final String symbol;
  final Side side;
  final double qty;
  final double price;
  final DateTime ts;
  final String reason;
}

class Position {
  Position({required this.symbol, this.qty = 0, this.avgPrice = 0});

  final String symbol;
  double qty;
  double avgPrice;
}
