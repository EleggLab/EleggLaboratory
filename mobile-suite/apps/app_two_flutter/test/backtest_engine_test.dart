import 'package:app_two_flutter/core/risk.dart';
import 'package:app_two_flutter/core/strategy.dart';
import 'package:app_two_flutter/services/backtest_engine.dart';
import 'package:app_two_flutter/services/market_data_provider.dart';
import 'package:app_two_flutter/services/paper_broker.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('backtest returns metrics', () async {
    final provider = MockMarketDataProvider();
    final candles = await provider.fetchCandles(symbol: 'MOCK', limit: 220);

    final engine = BacktestEngine(
      strategy: SmaCrossStrategy(),
      riskEngine: const RiskEngine(RiskConfig()),
      broker: PaperBroker(initialCash: 100000),
    );

    final result = engine.run('MOCK', candles);
    expect(result.tradeCount, greaterThanOrEqualTo(0));
    expect(result.finalEquity, greaterThan(0));
  });
}
