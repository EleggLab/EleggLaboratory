import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../theme/app_tokens.dart';
import 'skin_asset.dart';
import 'ui_feedback.dart';

class DiamondHeader extends StatelessWidget {
  const DiamondHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final diamonds = context.select<AppState, int>((state) => state.diamonds);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
          onTap: UiFeedback.tap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(AppTokens.radiusPill),
              border: Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.24),
              ),
            ),
            child: Row(
              children: <Widget>[
                OptionalAssetIcon(
                  assetPath: 'assets/icons/diamond.png',
                  fallbackIcon: Icons.diamond_rounded,
                  color: theme.colorScheme.primary,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Text(
                  '$diamonds',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
