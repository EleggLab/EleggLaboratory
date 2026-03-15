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

  testWidgets('shop grid is responsive across common mobile sizes', (
    tester,
  ) async {
    final appState = AppState(
      saveRepository: _MemorySaveRepository(null),
      adService: _NoopAdService(),
    );
    await appState.initialize();

    final starterItems = ShopCatalog.items.take(4).toList();
    final resumeData = <String, dynamic>{
      'mode': 'classic',
      'seed': 909,
      'runId': 'shop_responsive',
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

    const sizes = <Size>[Size(320, 600), Size(360, 780), Size(412, 915)];

    for (final size in sizes) {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: appState,
          child: MaterialApp(home: GameScreen.resume(resumeData: resumeData)),
        ),
      );
      await tester.pump(const Duration(milliseconds: 650));
      await tester.pumpAndSettle(const Duration(milliseconds: 450));

      expect(find.text('Starter Shop'), findsOneWidget);
      expect(find.text('Buy'), findsWidgets);
      expect(tester.takeException(), isNull);
    }

    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}
