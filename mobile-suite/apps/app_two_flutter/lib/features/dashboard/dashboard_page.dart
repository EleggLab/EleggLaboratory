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

  String strategyId = 'sma';
  MockScenario scenario = MockScenario.uptrend;
  double maxPositionPct = 0.2;
  double maxDailyLossPct = 0.03;

  Strategy _buildStrategy() {
    return switch (strategyId) {
      'rsi' => RsiMeanReversionStrategy(),
      'breakout' => VolatilityBreakoutStrategy(),
      _ => SmaCrossStrategy(),
    };
  }

  Future<void> _runBacktest() async {
    setState(() => status = 'Running...');

    final candles = await provider.fetchCandles(
      symbol: 'MOCK',
      limit: 260,
      scenario: scenario,
    );

    final engine = BacktestEngine(
      strategy: _buildStrategy(),
      riskEngine: RiskEngine(
        RiskConfig(
          maxPositionPct: maxPositionPct,
          maxDailyLossPct: maxDailyLossPct,
        ),
      ),
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
        child: ListView(
          children: [
            const Text('현재 모드: 페이퍼 트레이딩 / 백테스트', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: strategyId,
              decoration: const InputDecoration(labelText: 'Strategy'),
              items: const [
                DropdownMenuItem(value: 'sma', child: Text('SMA Cross')),
                DropdownMenuItem(value: 'rsi', child: Text('RSI Mean Reversion')),
                DropdownMenuItem(value: 'breakout', child: Text('Volatility Breakout')),
              ],
              onChanged: (v) => setState(() => strategyId = v ?? 'sma'),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<MockScenario>(
              initialValue: scenario,
              decoration: const InputDecoration(labelText: 'Scenario'),
              items: const [
                DropdownMenuItem(value: MockScenario.uptrend, child: Text('Uptrend')),
                DropdownMenuItem(value: MockScenario.downtrend, child: Text('Downtrend')),
                DropdownMenuItem(value: MockScenario.sideways, child: Text('Sideways')),
              ],
              onChanged: (v) => setState(() => scenario = v ?? MockScenario.uptrend),
            ),
            const SizedBox(height: 8),
            Text('Max Position %: ${(maxPositionPct * 100).toStringAsFixed(0)}'),
            Slider(
              value: maxPositionPct,
              min: 0.05,
              max: 0.5,
              onChanged: (v) => setState(() => maxPositionPct = v),
            ),
            Text('Max Daily Loss %: ${(maxDailyLossPct * 100).toStringAsFixed(1)}'),
            Slider(
              value: maxDailyLossPct,
              min: 0.01,
              max: 0.1,
              onChanged: (v) => setState(() => maxDailyLossPct = v),
            ),
            const SizedBox(height: 8),
            FilledButton(onPressed: _runBacktest, child: const Text('Run Backtest')),
            const SizedBox(height: 12),
            Text(status),
            const SizedBox(height: 12),
            if (last != null) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _metric('Final Equity', last!.finalEquity.toStringAsFixed(2)),
                  _metric('Trades', '${last!.tradeCount}'),
                  _metric('WinRate', '${(last!.winRate * 100).toStringAsFixed(1)}%'),
                  _metric('MDD', '${last!.maxDrawdownPct.toStringAsFixed(2)}%'),
                  _metric('Return', '${last!.totalReturnPct.toStringAsFixed(2)}%'),
                ],
              ),
              const SizedBox(height: 10),
              const Text('Recent Orders', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              ...last!.orders.reversed.take(12).map(
                (o) => ListTile(
                  dense: true,
                  title: Text('${o.side.name.toUpperCase()} ${o.qty} @ ${o.price.toStringAsFixed(2)}'),
                  subtitle: Text('${o.symbol} · ${o.reason} · ${o.ts.toIso8601String()}'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _metric(String label, String value) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
