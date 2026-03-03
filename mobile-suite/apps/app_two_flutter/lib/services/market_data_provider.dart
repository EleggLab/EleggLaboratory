import '../models/market_models.dart';

abstract class MarketDataProvider {
  Future<List<Candle>> fetchCandles({
    required String symbol,
    required int limit,
  });
}

class MockMarketDataProvider implements MarketDataProvider {
  @override
  Future<List<Candle>> fetchCandles({required String symbol, required int limit}) async {
    final out = <Candle>[];
    var price = 100.0;
    for (var i = 0; i < limit; i++) {
      final drift = (i % 17 == 0) ? -1.2 : 0.4;
      price = (price + drift).clamp(20, 400);
      out.add(
        Candle(
          ts: DateTime.now().add(Duration(minutes: i)),
          open: price - 0.2,
          high: price + 0.8,
          low: price - 0.9,
          close: price,
          volume: 1000 + i * 3,
        ),
      );
    }
    return out;
  }
}
