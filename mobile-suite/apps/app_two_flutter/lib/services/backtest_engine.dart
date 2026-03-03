import '../core/risk.dart';
import '../core/strategy.dart';
import '../models/market_models.dart';
import 'paper_broker.dart';

class BacktestResult {
  const BacktestResult({required this.finalEquity, required this.tradeCount});

  final double finalEquity;
  final int tradeCount;
}

class BacktestEngine {
  BacktestEngine({
    required this.strategy,
    required this.riskEngine,
    required this.broker,
  });

  final Strategy strategy;
  final RiskEngine riskEngine;
  final PaperBroker broker;

  BacktestResult run(String symbol, List<Candle> candles) {
    var dailyPnL = 0.0;
    for (var i = 20; i < candles.length; i++) {
      final slice = candles.sublist(0, i + 1);
      final pos = broker.positions[symbol];
      final order = strategy.onCandle(
        symbol: symbol,
        candles: slice,
        position: pos,
        cash: broker.cash,
      );
      if (order == null) continue;

      final eq = broker.equity({symbol: candles[i].close});
      if (!riskEngine.allowOrder(order: order, equity: eq, dailyPnL: dailyPnL)) continue;
      final before = eq;
      broker.execute(order);
      final after = broker.equity({symbol: candles[i].close});
      dailyPnL += (after - before);
    }

    final finalEq = broker.equity({symbol: candles.last.close});
    return BacktestResult(finalEquity: finalEq, tradeCount: broker.fills.length);
  }
}
