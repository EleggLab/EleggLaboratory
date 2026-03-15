import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../theme/app_tokens.dart';
import 'skin_asset.dart';
import 'ui_feedback.dart';

class HubBackground extends StatelessWidget {
  const HubBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final backgroundStyle = context.select<AppState, String>(
      (state) => state.selectedBackgroundStyleId,
    );
    final scheme = Theme.of(context).colorScheme;
    final gradientColors = _gradientForStyle(backgroundStyle, scheme);
    final patternOpacity = backgroundStyle == 'bg_terminal'
        ? 0.10
        : backgroundStyle == 'bg_royal'
        ? 0.09
        : 0.07;
    final noiseOpacity = backgroundStyle == 'bg_terminal'
        ? 0.06
        : backgroundStyle == 'bg_sunset'
        ? 0.05
        : 0.04;
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradientColors,
            ),
          ),
        ),
        Positioned.fill(
          child: IgnorePointer(
            child: Opacity(
              opacity: patternOpacity,
              child: Image.asset(
                'assets/patterns/bg_pattern.png',
                repeat: ImageRepeat.repeat,
                filterQuality: FilterQuality.low,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: IgnorePointer(
            child: Opacity(
              opacity: noiseOpacity,
              child: Image.asset(
                'assets/vfx/perlin_noise.png',
                fit: BoxFit.cover,
                filterQuality: FilterQuality.low,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<Color> _gradientForStyle(String styleId, ColorScheme scheme) {
    switch (styleId) {
      case 'bg_sunset':
        return <Color>[
          const Color(0xFFFFF3E0),
          const Color(0xFFFFE0B2),
          const Color(0xFFFFCCBC),
        ];
      case 'bg_terminal':
        return <Color>[
          const Color(0xFFE8F5E9),
          const Color(0xFFDCE775),
          const Color(0xFFC5E1A5),
        ];
      case 'bg_royal':
        return <Color>[
          const Color(0xFFEDE7F6),
          const Color(0xFFD1C4E9),
          const Color(0xFFB39DDB),
        ];
      default:
        return <Color>[
          scheme.surfaceContainerLowest,
          scheme.surfaceContainerLow,
          scheme.secondaryContainer.withValues(alpha: 0.24),
        ];
    }
  }
}

class GameTitleText extends StatefulWidget {
  const GameTitleText({
    super.key,
    required this.text,
    this.style,
    this.maxLines = 1,
    this.textAlign,
  });

  final String text;
  final TextStyle? style;
  final int maxLines;
  final TextAlign? textAlign;

  @override
  State<GameTitleText> createState() => _GameTitleTextState();
}

class _GameTitleTextState extends State<GameTitleText> {
  late final Future<bool> _fontReady = _GameTitleFont.ensureLoaded();

  @override
  Widget build(BuildContext context) {
    final baseStyle = widget.style ?? Theme.of(context).textTheme.titleMedium;
    return FutureBuilder<bool>(
      future: _fontReady,
      initialData: _GameTitleFont.isLoaded,
      builder: (context, snapshot) {
        final loaded = snapshot.data == true;
        return Text(
          widget.text,
          maxLines: widget.maxLines,
          overflow: TextOverflow.ellipsis,
          textAlign: widget.textAlign,
          style: baseStyle?.copyWith(
            fontFamily: loaded ? _GameTitleFont.family : null,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
        );
      },
    );
  }
}

class GameHubHeaderTitle extends StatelessWidget {
  const GameHubHeaderTitle({
    super.key,
    required this.pageTitle,
    this.hubTitle = 'Breaking Block Augment',
  });

  final String pageTitle;
  final String hubTitle;

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.labelLarge?.copyWith(
      color: Theme.of(context).colorScheme.primary,
      fontSize: 16,
      fontWeight: FontWeight.w900,
    );
    final pageStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
      fontWeight: FontWeight.w800,
      fontSize: 18,
      height: 1.1,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        GameTitleText(text: hubTitle, style: titleStyle),
        const SizedBox(height: 2),
        Text(
          pageTitle,
          style: pageStyle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class TopRightHubIcon extends StatelessWidget {
  const TopRightHubIcon({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Options',
      onPressed: () {
        UiFeedback.tap();
        onPressed();
      },
      icon: OptionalAssetIcon(
        assetPath: 'assets/icons/gear.png',
        fallbackIcon: Icons.settings_rounded,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
      style: IconButton.styleFrom(
        minimumSize: const Size(AppTokens.minTapTarget, AppTokens.minTapTarget),
      ),
    );
  }
}

class _GameTitleFont {
  static const String family = 'GameTitleDynamic';
  static bool isLoaded = false;
  static Future<bool>? _loading;

  static Future<bool> ensureLoaded() {
    _loading ??= _load();
    return _loading!;
  }

  static Future<bool> _load() async {
    if (isLoaded) {
      return true;
    }
    try {
      final loader = FontLoader(family)
        ..addFont(rootBundle.load('assets/fonts/game_title.ttf'));
      await loader.load();
      isLoaded = true;
      return true;
    } catch (_) {
      return false;
    }
  }
}
