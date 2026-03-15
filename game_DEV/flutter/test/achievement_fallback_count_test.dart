import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/data_repository.dart';
import 'package:gamedev/data/meta_catalog.dart';

class _FailingBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) async {
    throw Exception('missing $key');
  }
}

void main() {
  test(
    'achievement fallback keeps at least 12 entries when json missing',
    () async {
      MetaCatalog.resetRuntimeDefinitions();
      await DataRepository.instance.loadAndApply(bundle: _FailingBundle());
      expect(MetaCatalog.achievements.length, greaterThanOrEqualTo(12));
    },
  );
}
