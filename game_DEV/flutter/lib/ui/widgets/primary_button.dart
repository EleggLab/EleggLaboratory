import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import 'press_scale.dart';
import 'ui_feedback.dart';

enum AppButtonVariant { primary, secondary }

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = true,
    this.minHeight = 56,
    this.variant = AppButtonVariant.primary,
  });

  const PrimaryButton.secondary({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.expand = true,
    this.minHeight = 56,
  }) : variant = AppButtonVariant.secondary;

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expand;
  final double minHeight;
  final AppButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppTokens.radiusButton);
    final isPrimary = variant == AppButtonVariant.primary;
    final foreground = isPrimary
        ? Theme.of(context).colorScheme.onPrimary
        : Theme.of(context).colorScheme.onSurface;

    final buttonChild = Stack(
      alignment: Alignment.center,
      children: <Widget>[
        Positioned.fill(
          child: IgnorePointer(
            child: ClipRRect(
              borderRadius: radius,
              child: Opacity(
                opacity: onPressed == null ? 0.3 : 0.8,
                child: Image.asset(
                  isPrimary
                      ? 'assets/ui/button_primary.png'
                      : 'assets/ui/button_secondary.png',
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                ),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              if (icon != null) ...<Widget>[
                Icon(icon, color: foreground),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ],
    );

    final wrappedPress = onPressed == null
        ? null
        : () {
            UiFeedback.tap();
            onPressed?.call();
          };

    final button = isPrimary
        ? FilledButton(
            onPressed: wrappedPress,
            style: FilledButton.styleFrom(
              minimumSize: Size(0, minHeight),
              padding: EdgeInsets.zero,
            ),
            child: buttonChild,
          )
        : OutlinedButton(
            onPressed: wrappedPress,
            style: OutlinedButton.styleFrom(
              minimumSize: Size(0, minHeight),
              padding: EdgeInsets.zero,
              backgroundColor: Theme.of(
                context,
              ).colorScheme.surface.withValues(alpha: 0.82),
            ),
            child: buttonChild,
          );

    final scaledButton = PressScale(enabled: onPressed != null, child: button);
    if (!expand) {
      return scaledButton;
    }
    return SizedBox(width: double.infinity, child: scaledButton);
  }
}
