import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/save_repository.dart';
import 'package:gamedev/models/game_options.dart';
import 'package:gamedev/models/save_data.dart';
import 'package:gamedev/models/shop_data.dart';
import 'package:gamedev/services/ad_service.dart';
import 'package:gamedev/state/app_state.dart';
import 'package:gamedev/ui/screens/game_screen.dart';
import 'package:provider/provider.dart';

class _MemorySaveRepository implements SaveRepository {
  _MemorySaveRepository(this._loaded);

  SaveData? _loaded;

  @override
  Future<SaveData?> loadSave() async => _loaded;

  @override
  Future<void> saveSave(SaveData saveData) async {
    _loaded = saveData;
  }
}

class _NoopAdService implements IAdService {
  @override
  AdMode get activeMode => AdMode.simulated;

  @override
  String? consumeLastFailureMessage() => null;

  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    return false;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shop cards always render visible Buy label', (tester) async {
    tester.view.physicalSize = const Size(320, 620);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final appState = AppState(
      saveRepository: _MemorySaveRepository(null),
      adService: _NoopAdService(),
    );
    await appState.initialize();

    final starterItems = ShopCatalog.items.take(4).toList();
    final resumeData = <String, dynamic>{
      'mode': 'classic',
      'seed': 1207,
      'runId': 'shop_buy_text',
      'shop': <String, dynamic>{
        'visible': true,
        'title': 'Starter Shop',
        'rerollCount': 0,
        'slots': starterItems
            .map(
              (item) => <String, dynamic>{
                'itemId': item.id,
                'locked': false,
                'purchased': false,
              },
            )
            .toList(),
      },
    };

    await tester.pumpWidget(
      ChangeNotifierProvider<AppState>.value(
        value: appState,
        child: MaterialApp(home: GameScreen.resume(resumeData: resumeData)),
      ),
    );
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle(const Duration(milliseconds: 500));

    expect(find.text('Starter Shop'), findsOneWidget);
    expect(find.text('Buy'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
