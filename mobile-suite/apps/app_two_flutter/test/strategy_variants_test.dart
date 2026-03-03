import 'package:app_two_flutter/core/risk.dart';
import 'package:app_two_flutter/core/strategy.dart';
import 'package:app_two_flutter/services/backtest_engine.dart';
import 'package:app_two_flutter/services/market_data_provider.dart';
import 'package:app_two_flutter/services/paper_broker.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('all strategy variants run on scenarios', () async {
    final provider = MockMarketDataProvider();
    final strategies = [
      SmaCrossStrategy(),
      RsiMeanReversionStrategy(),
      VolatilityBreakoutStrategy(),
    ];

    for (final scenario in MockScenario.values) {
      final candles = await provider.fetchCandles(symbol: 'MOCK', limit: 260, scenario: scenario);
      for (final strategy in strategies) {
        final engine = BacktestEngine(
          strategy: strategy,
          riskEngine: const RiskEngine(RiskConfig()),
          broker: PaperBroker(initialCash: 100000),
        );
        final result = engine.run('MOCK', candles);
        expect(result.finalEquity, greaterThan(0));
      }
    }
  });
}
