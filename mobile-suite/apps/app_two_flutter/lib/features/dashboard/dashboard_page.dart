import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/risk.dart';
import '../../core/strategy.dart';
import '../../models/market_models.dart';
import '../../services/backtest_engine.dart';
import '../../services/market_data_provider.dart';
import '../../services/paper_broker.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  static const _prefsKey = 'app_two_dashboard_v1';

  final provider = MockMarketDataProvider();
  String status = 'Ready';
  BacktestResult? last;
  int tab = 0;

  String strategyId = 'sma';
  MockScenario scenario = MockScenario.uptrend;
  double maxPositionPct = 0.2;
  double maxDailyLossPct = 0.03;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Strategy _buildStrategy() {
    return switch (strategyId) {
      'rsi' => RsiMeanReversionStrategy(),
      'breakout' => VolatilityBreakoutStrategy(),
      _ => SmaCrossStrategy(),
    };
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      strategyId = prefs.getString('strategyId') ?? strategyId;
      scenario = MockScenario.values.byName(prefs.getString('scenario') ?? scenario.name);
      maxPositionPct = prefs.getDouble('maxPositionPct') ?? maxPositionPct;
      maxDailyLossPct = prefs.getDouble('maxDailyLossPct') ?? maxDailyLossPct;
      tab = prefs.getInt('tab') ?? tab;
    });
  }

  Future<void> _savePrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, '1');
    await prefs.setString('strategyId', strategyId);
    await prefs.setString('scenario', scenario.name);
    await prefs.setDouble('maxPositionPct', maxPositionPct);
    await prefs.setDouble('maxDailyLossPct', maxDailyLossPct);
    await prefs.setInt('tab', tab);
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
      tab = 1;
    });
    _savePrefs();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App Two · Auto Trading (Paper)')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: IndexedStack(
          index: tab,
          children: [
            _buildConfigTab(),
            _buildReportTab(),
            _buildPortfolioTab(),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.tune), label: 'Config'),
          NavigationDestination(icon: Icon(Icons.analytics), label: 'Report'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet), label: 'Portfolio'),
        ],
        onDestinationSelected: (i) {
          setState(() => tab = i);
          _savePrefs();
        },
      ),
    );
  }

  Widget _buildConfigTab() {
    return ListView(
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
          onChanged: (v) {
            setState(() => strategyId = v ?? 'sma');
            _savePrefs();
          },
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
          onChanged: (v) {
            setState(() => scenario = v ?? MockScenario.uptrend);
            _savePrefs();
          },
        ),
        const SizedBox(height: 8),
        Text('Max Position %: ${(maxPositionPct * 100).toStringAsFixed(0)}'),
        Slider(
          value: maxPositionPct,
          min: 0.05,
          max: 0.5,
          onChanged: (v) {
            setState(() => maxPositionPct = v);
            _savePrefs();
          },
        ),
        Text('Max Daily Loss %: ${(maxDailyLossPct * 100).toStringAsFixed(1)}'),
        Slider(
          value: maxDailyLossPct,
          min: 0.01,
          max: 0.1,
          onChanged: (v) {
            setState(() => maxDailyLossPct = v);
            _savePrefs();
          },
        ),
        const SizedBox(height: 10),
        FilledButton(onPressed: _runBacktest, child: const Text('Run Backtest')),
        const SizedBox(height: 12),
        Text(status),
      ],
    );
  }

  Widget _buildReportTab() {
    if (last == null) return const Center(child: Text('리포트 없음. 백테스트를 먼저 실행하세요.'));

    return ListView(
      children: [
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
        ...last!.orders.reversed.take(20).map(
          (o) => ListTile(
            dense: true,
            title: Text('${o.side.name.toUpperCase()} ${o.qty} @ ${o.price.toStringAsFixed(2)}'),
            subtitle: Text('${o.symbol} · ${o.reason} · ${o.ts.toIso8601String()}'),
          ),
        ),
      ],
    );
  }

  Widget _buildPortfolioTab() {
    if (last == null) return const Center(child: Text('포트폴리오 없음. 백테스트를 먼저 실행하세요.'));

    final broker = PaperBroker(initialCash: 100000)..cash = last!.endingCash;
    last!.positions.forEach((k, v) {
      broker.positions[k] = Position(symbol: v.symbol, qty: v.qty, avgPrice: v.avgPrice);
    });

    final symbol = 'MOCK';
    final mkt = broker.positionMarketValue(symbol, last!.lastPrice);
    final upnl = broker.unrealizedPnl(symbol, last!.lastPrice);

    return ListView(
      children: [
        _metric('Cash', broker.cash.toStringAsFixed(2)),
        _metric('Position MV', mkt.toStringAsFixed(2)),
        _metric('Unrealized PnL', upnl.toStringAsFixed(2)),
        _metric('Total Equity', last!.finalEquity.toStringAsFixed(2)),
        const SizedBox(height: 10),
        const Text('Positions', style: TextStyle(fontWeight: FontWeight.bold)),
        ...last!.positions.values.map(
          (p) => ListTile(
            title: Text('${p.symbol} · qty ${p.qty}'),
            subtitle: Text('avg ${p.avgPrice.toStringAsFixed(2)} / last ${last!.lastPrice.toStringAsFixed(2)}'),
          ),
        ),
      ],
    );
  }

  Widget _metric(String label, String value) {
    return Container(
      width: 170,
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
