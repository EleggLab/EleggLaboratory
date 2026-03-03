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
  SmaCrossStrategy({this.fastPeriod = 5, this.slowPeriod = 20, this.positionPct = 0.1});

  final int fastPeriod;
  final int slowPeriod;
  final double positionPct;

  @override
  String get name => 'SMA($fastPeriod/$slowPeriod) Cross';

  @override
  TradeOrder? onCandle({
    required String symbol,
    required List<Candle> candles,
    required Position? position,
    required double cash,
  }) {
    if (candles.length < slowPeriod + 1) return null;

    double sma(List<Candle> src, int period) =>
        src.sublist(src.length - period).map((c) => c.close).reduce((a, b) => a + b) / period;

    final fast = sma(candles, fastPeriod);
    final slow = sma(candles, slowPeriod);
    final price = candles.last.close;

    if ((position == null || position.qty == 0) && fast > slow && cash > price) {
      final qty = (cash * positionPct / price).floorToDouble();
      if (qty <= 0) return null;
      return TradeOrder(
        symbol: symbol,
        side: Side.buy,
        qty: qty,
        price: price,
        ts: candles.last.ts,
        reason: 'sma_fast>slow',
      );
    }

    if (position != null && position.qty > 0 && fast < slow) {
      return TradeOrder(
        symbol: symbol,
        side: Side.sell,
        qty: position.qty,
        price: price,
        ts: candles.last.ts,
        reason: 'sma_fast<slow',
      );
    }

    return null;
  }
}

class RsiMeanReversionStrategy implements Strategy {
  RsiMeanReversionStrategy({
    this.period = 14,
    this.oversold = 30,
    this.overbought = 70,
    this.positionPct = 0.1,
  });

  final int period;
  final double oversold;
  final double overbought;
  final double positionPct;

  @override
  String get name => 'RSI($period) MR';

  double _rsi(List<Candle> candles) {
    final slice = candles.sublist(candles.length - period);
    var gain = 0.0;
    var loss = 0.0;
    for (var i = 1; i < slice.length; i++) {
      final diff = slice[i].close - slice[i - 1].close;
      if (diff >= 0) {
        gain += diff;
      } else {
        loss += -diff;
      }
    }
    if (loss == 0) return 100;
    final rs = gain / loss;
    return 100 - (100 / (1 + rs));
  }

  @override
  TradeOrder? onCandle({
    required String symbol,
    required List<Candle> candles,
    required Position? position,
    required double cash,
  }) {
    if (candles.length < period + 1) return null;
    final rsi = _rsi(candles);
    final price = candles.last.close;

    if ((position == null || position.qty == 0) && rsi <= oversold && cash > price) {
      final qty = (cash * positionPct / price).floorToDouble();
      if (qty <= 0) return null;
      return TradeOrder(
        symbol: symbol,
        side: Side.buy,
        qty: qty,
        price: price,
        ts: candles.last.ts,
        reason: 'rsi_oversold',
      );
    }

    if (position != null && position.qty > 0 && rsi >= overbought) {
      return TradeOrder(
        symbol: symbol,
        side: Side.sell,
        qty: position.qty,
        price: price,
        ts: candles.last.ts,
        reason: 'rsi_overbought',
      );
    }

    return null;
  }
}

class VolatilityBreakoutStrategy implements Strategy {
  VolatilityBreakoutStrategy({this.lookback = 20, this.positionPct = 0.1});

  final int lookback;
  final double positionPct;

  @override
  String get name => 'Vol Breakout($lookback)';

  @override
  TradeOrder? onCandle({
    required String symbol,
    required List<Candle> candles,
    required Position? position,
    required double cash,
  }) {
    if (candles.length < lookback + 1) return null;
    final hist = candles.sublist(candles.length - lookback - 1, candles.length - 1);
    final hh = hist.map((c) => c.high).reduce((a, b) => a > b ? a : b);
    final ll = hist.map((c) => c.low).reduce((a, b) => a < b ? a : b);
    final price = candles.last.close;

    if ((position == null || position.qty == 0) && price > hh && cash > price) {
      final qty = (cash * positionPct / price).floorToDouble();
      if (qty <= 0) return null;
      return TradeOrder(
        symbol: symbol,
        side: Side.buy,
        qty: qty,
        price: price,
        ts: candles.last.ts,
        reason: 'breakout_up',
      );
    }

    if (position != null && position.qty > 0 && price < ll) {
      return TradeOrder(
        symbol: symbol,
        side: Side.sell,
        qty: position.qty,
        price: price,
        ts: candles.last.ts,
        reason: 'breakout_down',
      );
    }

    return null;
  }
}
