import 'dart:math';

import '../core/execution_guard.dart';
import '../core/risk.dart';
import '../core/strategy.dart';
import '../models/market_models.dart';
import 'paper_broker.dart';

class BacktestResult {
  const BacktestResult({
    required this.finalEquity,
    required this.tradeCount,
    required this.winRate,
    required this.maxDrawdownPct,
    required this.totalReturnPct,
  });

  final double finalEquity;
  final int tradeCount;
  final double winRate;
  final double maxDrawdownPct;
  final double totalReturnPct;
}

class BacktestEngine {
  BacktestEngine({
    required this.strategy,
    required this.riskEngine,
    required this.broker,
    ExecutionGuard? executionGuard,
  }) : executionGuard = executionGuard ?? ExecutionGuard();

  final Strategy strategy;
  final RiskEngine riskEngine;
  final PaperBroker broker;
  final ExecutionGuard executionGuard;

  BacktestResult run(String symbol, List<Candle> candles) {
    var dailyPnL = 0.0;
    var wins = 0;
    var losses = 0;

    final initialEquity = broker.cash;
    var peak = initialEquity;
    var maxDd = 0.0;

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
      if (!executionGuard.canExecute(order)) continue;

      final before = eq;
      broker.execute(order);
      executionGuard.markExecuted(order);
      final after = broker.equity({symbol: candles[i].close});
      final pnlDelta = after - before;
      dailyPnL += pnlDelta;

      if (pnlDelta > 0) {
        wins += 1;
      } else if (pnlDelta < 0) {
        losses += 1;
      }

      peak = max(peak, after);
      if (peak > 0) {
        final dd = (peak - after) / peak;
        maxDd = max(maxDd, dd);
      }
    }

    final finalEq = broker.equity({symbol: candles.last.close});
    final tradeCount = broker.fills.length;
    final winRate = (wins + losses) == 0 ? 0.0 : wins / (wins + losses);
    final totalReturnPct = ((finalEq - initialEquity) / initialEquity) * 100;

    return BacktestResult(
      finalEquity: finalEq,
      tradeCount: tradeCount,
      winRate: winRate,
      maxDrawdownPct: maxDd * 100,
      totalReturnPct: totalReturnPct,
    );
  }
}
