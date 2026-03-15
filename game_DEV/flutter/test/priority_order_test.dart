import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/render_layer_order.dart';

void main() {
  test(
    'render layer order follows required background<blocks<vfx<aim<balls<hud',
    () {
      expect(validateRenderLayerOrder(), isTrue);
      expect(RenderLayerOrder.background, lessThan(RenderLayerOrder.blocks));
      expect(RenderLayerOrder.blocks, lessThan(RenderLayerOrder.vfx));
      expect(RenderLayerOrder.vfx, lessThan(RenderLayerOrder.aimGuide));
      expect(RenderLayerOrder.aimGuide, lessThan(RenderLayerOrder.balls));
      expect(RenderLayerOrder.balls, lessThan(RenderLayerOrder.hudOverlay));
    },
  );
}
