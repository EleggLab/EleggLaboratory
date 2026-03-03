import 'package:flutter/material.dart';

import '../../core/risk.dart';
import '../../core/strategy.dart';
import '../../services/backtest_engine.dart';
import '../../services/market_data_provider.dart';
import '../../services/paper_broker.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final provider = MockMarketDataProvider();
  String status = 'Ready';
  BacktestResult? last;

  Future<void> _runBacktest() async {
    setState(() => status = 'Running...');

    final candles = await provider.fetchCandles(symbol: 'MOCK', limit: 220);
    final engine = BacktestEngine(
      strategy: SmaCrossStrategy(),
      riskEngine: const RiskEngine(RiskConfig()),
      broker: PaperBroker(initialCash: 100000),
    );
    final result = engine.run('MOCK', candles);

    setState(() {
      last = result;
      status = 'Backtest done';
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
            const SizedBox(height: 12),
            if (last != null) ...[
              Text('Final Equity: ${last!.finalEquity.toStringAsFixed(2)}'),
              Text('Trades: ${last!.tradeCount}'),
              Text('WinRate: ${(last!.winRate * 100).toStringAsFixed(1)}%'),
              Text('Max Drawdown: ${last!.maxDrawdownPct.toStringAsFixed(2)}%'),
              Text('Total Return: ${last!.totalReturnPct.toStringAsFixed(2)}%'),
            ],
          ],
        ),
      ),
    );
  }
}
