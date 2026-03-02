import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_ui/shared_ui.dart';

import 'core/idle_core.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App One',
      theme: SharedUiTheme.light(),
      home: const IdleCorePage(),
    );
  }
}

class IdleCorePage extends StatefulWidget {
  const IdleCorePage({super.key});

  @override
  State<IdleCorePage> createState() => _IdleCorePageState();
}

class _IdleCorePageState extends State<IdleCorePage> {
  final core = createStarterCore();
  Timer? timer;

  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(milliseconds: 200), (_) {
      setState(() => core.tick(0.2));
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App One · Idle Core Prototype')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Gold: ${core.currency.toStringAsFixed(1)}',
              style: Theme.of(context).textTheme.headlineSmall),
          Text('Income/sec: ${core.totalIncomePerSec.toStringAsFixed(1)}'),
          Text('Tap value: ${core.tapValue.toStringAsFixed(1)}'),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => setState(core.tap),
            child: const Text('Tap +Gold'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => setState(() {
              core.buyTapUpgrade();
            }),
            child: const Text('Upgrade Tap (+1) · Cost 25'),
          ),
          const SizedBox(height: 16),
          const Text('Generators', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...List.generate(core.generators.length, (i) {
            final g = core.generators[i];
            return Card(
              child: ListTile(
                title: Text('${g.name} · owned ${g.count}'),
                subtitle: Text(
                  '+${g.baseIncomePerSec.toStringAsFixed(1)}/sec each · Next ${g.nextCost.toStringAsFixed(1)}',
                ),
                trailing: FilledButton(
                  onPressed: () => setState(() {
                    core.buyGenerator(i);
                  }),
                  child: const Text('Buy'),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
