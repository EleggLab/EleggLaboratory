import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';

class PressScale extends StatefulWidget {
  const PressScale({
    super.key,
    required this.child,
    this.enabled = true,
    this.scale = 0.98,
  });

  final Widget child;
  final bool enabled;
  final double scale;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: widget.enabled
          ? (_) {
              if (!_pressed) {
                setState(() {
                  _pressed = true;
                });
              }
            }
          : null,
      onPointerUp: widget.enabled
          ? (_) {
              if (_pressed) {
                setState(() {
                  _pressed = false;
                });
              }
            }
          : null,
      onPointerCancel: widget.enabled
          ? (_) {
              if (_pressed) {
                setState(() {
                  _pressed = false;
                });
              }
            }
          : null,
      child: AnimatedScale(
        duration: AppTokens.pressAnimDuration,
        curve: Curves.easeOutCubic,
        scale: (_pressed && widget.enabled) ? widget.scale : 1,
        child: widget.child,
      ),
    );
  }
}
