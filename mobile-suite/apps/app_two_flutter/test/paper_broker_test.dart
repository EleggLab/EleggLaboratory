import 'package:app_two_flutter/models/market_models.dart';
import 'package:app_two_flutter/services/paper_broker.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('paper broker unrealized pnl works', () {
    final b = PaperBroker(initialCash: 10000);
    b.execute(
      TradeOrder(
        symbol: 'MOCK',
        side: Side.buy,
        qty: 10,
        price: 100,
        ts: DateTime.now(),
      ),
    );

    expect(b.unrealizedPnl('MOCK', 110), 100);
    expect(b.positionMarketValue('MOCK', 110), 1100);
  });
}
