import '../models/market_models.dart';

enum MockScenario { uptrend, downtrend, sideways }

abstract class MarketDataProvider {
  Future<List<Candle>> fetchCandles({
    required String symbol,
    required int limit,
    MockScenario scenario = MockScenario.uptrend,
  });
}

class MockMarketDataProvider implements MarketDataProvider {
  @override
  Future<List<Candle>> fetchCandles({
    required String symbol,
    required int limit,
    MockScenario scenario = MockScenario.uptrend,
  }) async {
    final out = <Candle>[];
    var price = 100.0;
    for (var i = 0; i < limit; i++) {
      final drift = switch (scenario) {
        MockScenario.uptrend => (i % 17 == 0) ? -1.2 : 0.5,
        MockScenario.downtrend => (i % 17 == 0) ? 1.2 : -0.45,
        MockScenario.sideways => (i % 9 == 0) ? -0.6 : 0.6,
      };
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
