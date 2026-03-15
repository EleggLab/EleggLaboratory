import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/data_repository.dart';
import 'package:gamedev/data/catalog_data.dart';
import 'package:gamedev/data/meta_catalog.dart';
import 'package:gamedev/models/shop_data.dart';

class _FailingBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) {
    throw Exception('missing asset $key');
  }
}

void main() {
  test(
    'data repository falls back to built-in catalogs on load failure',
    () async {
      GameCatalog.resetRuntimeDefinitions();
      ShopCatalog.resetRuntimeDefinitions();
      MetaCatalog.resetRuntimeDefinitions();

      await DataRepository.instance.loadAndApply(bundle: _FailingBundle());

      expect(GameCatalog.augments, isNotEmpty);
      expect(ShopCatalog.items, isNotEmpty);
      expect(MetaCatalog.achievements, isNotEmpty);
      expect(MetaCatalog.cosmetics, isNotEmpty);
    },
  );
}
