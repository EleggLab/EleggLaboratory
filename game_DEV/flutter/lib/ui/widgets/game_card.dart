import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import 'press_scale.dart';
import 'skin_asset.dart';
import 'ui_feedback.dart';

class GameCard extends StatelessWidget {
  const GameCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
    this.backgroundColor,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppTokens.radiusCard);
    final content = Stack(
      children: <Widget>[
        Positioned.fill(
          child: IgnorePointer(
            child: OptionalPanelTexture(opacity: 0.16, borderRadius: radius),
          ),
        ),
        Padding(padding: padding, child: child),
      ],
    );

    final card = Card(
      color: backgroundColor,
      clipBehavior: Clip.antiAlias,
      child: onTap == null
          ? content
          : InkWell(
              borderRadius: radius,
              onTap: () {
                UiFeedback.tap();
                onTap?.call();
              },
              child: content,
            ),
    );

    if (onTap == null) {
      return card;
    }

    return PressScale(child: card);
  }
}
