class GeneratorUnit {
  GeneratorUnit({
    required this.name,
    required this.baseCost,
    required this.baseIncomePerSec,
    this.count = 0,
    this.costGrowth = 1.15,
  });

  final String name;
  final double baseCost;
  final double baseIncomePerSec;
  final double costGrowth;
  int count;

  double get nextCost => baseCost * _pow(costGrowth, count);
  double get incomePerSec => baseIncomePerSec * count;

  static double _pow(double a, int b) {
    var out = 1.0;
    for (var i = 0; i < b; i++) {
      out *= a;
    }
    return out;
  }
}

class IdleCoreState {
  IdleCoreState({required this.generators, this.currency = 0, this.tapValue = 1});

  final List<GeneratorUnit> generators;
  double currency;
  double tapValue;

  double get totalIncomePerSec =>
      generators.fold(0.0, (sum, g) => sum + g.incomePerSec);

  void tick(double deltaSec) {
    currency += totalIncomePerSec * deltaSec;
  }

  void tap() {
    currency += tapValue;
  }

  bool buyGenerator(int index) {
    final g = generators[index];
    final cost = g.nextCost;
    if (currency < cost) return false;
    currency -= cost;
    g.count += 1;
    return true;
  }

  bool buyTapUpgrade({double cost = 25, double addValue = 1}) {
    if (currency < cost) return false;
    currency -= cost;
    tapValue += addValue;
    return true;
  }
}

IdleCoreState createStarterCore() {
  return IdleCoreState(generators: [
    GeneratorUnit(name: 'Worker', baseCost: 10, baseIncomePerSec: 1),
    GeneratorUnit(name: 'Machine', baseCost: 100, baseIncomePerSec: 12),
  ]);
}
