class RenderLayerOrder {
  static const int background = 0;
  static const int blocks = 100;
  static const int vfx = 200;
  static const int aimGuide = 300;
  static const int balls = 400;
  static const int hudOverlay = 500;
}

bool validateRenderLayerOrder() {
  return RenderLayerOrder.background < RenderLayerOrder.blocks &&
      RenderLayerOrder.blocks < RenderLayerOrder.vfx &&
      RenderLayerOrder.vfx < RenderLayerOrder.aimGuide &&
      RenderLayerOrder.aimGuide < RenderLayerOrder.balls &&
      RenderLayerOrder.balls < RenderLayerOrder.hudOverlay;
}
