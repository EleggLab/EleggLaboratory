import 'package:flutter/material.dart';

class OptionalAssetIcon extends StatelessWidget {
  const OptionalAssetIcon({
    super.key,
    required this.assetPath,
    required this.fallbackIcon,
    this.size = 18,
    this.color,
  });

  final String assetPath;
  final IconData fallbackIcon;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      assetPath,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => Icon(fallbackIcon, size: size, color: color),
      color: color,
    );
  }
}

class OptionalPanelTexture extends StatelessWidget {
  const OptionalPanelTexture({
    super.key,
    this.opacity = 0.16,
    this.centerSlice = const Rect.fromLTWH(8, 8, 16, 16),
    this.borderRadius,
  });

  final double opacity;
  final Rect centerSlice;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final child = Opacity(
      opacity: opacity,
      child: Image.asset(
        'assets/ui/panel.png',
        fit: BoxFit.fill,
        centerSlice: centerSlice,
        errorBuilder: (_, _, _) => const SizedBox.shrink(),
      ),
    );
    if (borderRadius == null) {
      return child;
    }
    return ClipRRect(borderRadius: borderRadius!, child: child);
  }
}
