import '../models/market_models.dart';

abstract class Strategy {
  String get name;

  TradeOrder? onCandle({
    required String symbol,
    required List<Candle> candles,
    required Position? position,
    required double cash,
  });
}

class SmaCrossStrategy implements Strategy {
  @override
  String get name => 'SMA(5/20) Cross';

  @override
  TradeOrder? onCandle({
    required String symbol,
    required List<Candle> candles,
    required Position? position,
    required double cash,
  }) {
    if (candles.length < 21) return null;

    double sma(List<Candle> src, int period) =>
        src.sublist(src.length - period).map((c) => c.close).reduce((a, b) => a + b) /
        period;

    final fast = sma(candles, 5);
    final slow = sma(candles, 20);
    final price = candles.last.close;

    if ((position == null || position.qty == 0) && fast > slow && cash > price) {
      final qty = (cash * 0.1 / price).floorToDouble();
      if (qty <= 0) return null;
      return TradeOrder(
        symbol: symbol,
        side: Side.buy,
        qty: qty,
        price: price,
        ts: candles.last.ts,
        reason: 'fast>slow',
      );
    }

    if (position != null && position.qty > 0 && fast < slow) {
      return TradeOrder(
        symbol: symbol,
        side: Side.sell,
        qty: position.qty,
        price: price,
        ts: candles.last.ts,
        reason: 'fast<slow',
      );
    }

    return null;
  }
}
