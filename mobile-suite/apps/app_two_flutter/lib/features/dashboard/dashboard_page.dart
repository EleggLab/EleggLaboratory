import 'package:flutter/material.dart';

import '../../core/risk.dart';
import '../../core/strategy.dart';
import '../../models/market_models.dart';
import '../../services/backtest_engine.dart';
import '../../services/paper_broker.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  String status = 'Ready';

  List<Candle> _mockCandles() {
    final out = <Candle>[];
    var price = 100.0;
    for (var i = 0; i < 200; i++) {
      final drift = (i % 17 == 0) ? -1.2 : 0.4;
      price = (price + drift).clamp(20, 400);
      out.add(Candle(
        ts: DateTime.now().add(Duration(minutes: i)),
        open: price - 0.2,
        high: price + 0.8,
        low: price - 0.9,
        close: price,
        volume: 1000 + i * 3,
      ));
    }
    return out;
  }

  void _runBacktest() {
    final engine = BacktestEngine(
      strategy: SmaCrossStrategy(),
      riskEngine: const RiskEngine(RiskConfig()),
      broker: PaperBroker(initialCash: 100000),
    );
    final result = engine.run('MOCK', _mockCandles());
    setState(() {
      status = 'Backtest done · final equity ${result.finalEquity.toStringAsFixed(2)} · trades ${result.tradeCount}';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App Two · Auto Trading (Paper)')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('현재 모드: 페이퍼 트레이딩 / 백테스트', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            FilledButton(onPressed: _runBacktest, child: const Text('Run Mock Backtest')),
            const SizedBox(height: 12),
            Text(status),
          ],
        ),
      ),
    );
  }
}
