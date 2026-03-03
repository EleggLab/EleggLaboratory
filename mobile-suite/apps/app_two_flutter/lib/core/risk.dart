import '../models/market_models.dart';

class RiskConfig {
  const RiskConfig({
    this.maxPositionPct = 0.2,
    this.maxDailyLossPct = 0.03,
  });

  final double maxPositionPct;
  final double maxDailyLossPct;
}

class RiskEngine {
  const RiskEngine(this.config);

  final RiskConfig config;

  bool allowOrder({
    required TradeOrder order,
    required double equity,
    required double dailyPnL,
  }) {
    if (equity <= 0) return false;
    if (dailyPnL < -equity * config.maxDailyLossPct) return false;
    final notion = order.qty * order.price;
    if (notion > equity * config.maxPositionPct && order.side == Side.buy) {
      return false;
    }
    return true;
  }
}
