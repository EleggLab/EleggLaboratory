import 'dart:ui';

import 'package:flutter/material.dart';

import 'models/app_theme_palette.dart';
import 'models/arena_counter_state.dart';

const _appTitle = '\uB2C8\uBCA8 \uC544\uB808\uB098 \uCE74\uC6B4\uD130';
const _settingsTitle = '\uC124\uC815';
const _resetLabel = '\uCD08\uAE30\uD654';
const _waitingLabel = '\uD134 \uB300\uAE30\uC911';
const _activeLabel = '\uD134 \uC9C4\uD589\uC911';
const _firstLabel = '\uC120\uACF5';
const _secondLabel = '\uD6C4\uACF5';
const _maxEnergyTitle = '\uCD5C\uB300 \uC560\uB108\uC9C0';
const _usedEnergyTitle = '\uC0AC\uC6A9 \uC560\uB108\uC9C0';
const _uiFontFamily = 'CookieRun';
const _displayFontFamily = 'CookieRun';

class ArenaCounterApp extends StatelessWidget {
  const ArenaCounterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: _appTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: _uiFontFamily,
        scaffoldBackgroundColor: const Color(0xFF0D1118),
      ),
      home: const ArenaCounterHomePage(),
    );
  }
}

class ArenaCounterHomePage extends StatefulWidget {
  const ArenaCounterHomePage({super.key});

  @override
  State<ArenaCounterHomePage> createState() => _ArenaCounterHomePageState();
}

class _ArenaCounterHomePageState extends State<ArenaCounterHomePage> {
  ArenaCounterState _state = const ArenaCounterState.initial();

  void _apply(ArenaCounterState nextState) {
    setState(() {
      _state = nextState;
    });
  }

  void _openSettingsSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return _SettingsSheet(
          state: _state,
          onThemeSelected: (themeId) => _apply(_state.changeTheme(themeId)),
          onReset: () {
            _apply(_state.resetCounter());
            Navigator.of(sheetContext).pop();
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = ArenaThemePalette.byId(_state.themeId);
    final screenHeight = MediaQuery.sizeOf(context).height;
    final width = MediaQuery.sizeOf(context).width;
    final pagePadding = width < 390 ? 14.0 : 18.0;
    final rowGap = width < 390 ? 12.0 : 16.0;
    final sectionGap = width < 390 ? 8.0 : 10.0;
    final sectionBreakGap = width < 390 ? 12.0 : 14.0;
    final contentHeight = (screenHeight * (width < 390 ? 0.58 : 0.62)).clamp(
      470.0,
      590.0,
    );

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 2.4, sigmaY: 2.4),
              child: Image.asset(
                palette.backgroundAsset,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [palette.backgroundShade, palette.backgroundTint],
                    ),
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _withOpacity(palette.backgroundShade, 0.82),
                    _withOpacity(palette.backgroundShade, 0.72),
                    _withOpacity(palette.backgroundTint, 0.50),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: -88,
            right: -36,
            child: _GlowOrb(
              color: _withOpacity(palette.accent, 0.08),
              size: 180,
            ),
          ),
          Positioned(
            bottom: 110,
            left: -72,
            child: _GlowOrb(
              color: _withOpacity(palette.surfaceStrong, 0.10),
              size: 220,
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    pagePadding,
                    pagePadding,
                    pagePadding,
                    pagePadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HeaderBar(
                        palette: palette,
                        onSettingsTap: _openSettingsSheet,
                      ),
                      SizedBox(height: sectionGap),
                      Expanded(child: _HeroVisualCard(palette: palette)),
                      SizedBox(height: sectionBreakGap),
                      SizedBox(
                        height: contentHeight,
                        child: Column(
                          children: [
                            Expanded(
                              flex: 100,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    flex: 5,
                                    child: _MaxEnergyCard(
                                      palette: palette,
                                      state: _state,
                                    ),
                                  ),
                                  SizedBox(width: rowGap - 2),
                                  Expanded(
                                    flex: 4,
                                    child: _MaxControlColumn(
                                      palette: palette,
                                      state: _state,
                                      apply: _apply,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: sectionBreakGap),
                            Expanded(
                              flex: 64,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    flex: 5,
                                    child: _UsedEnergyCard(
                                      palette: palette,
                                      state: _state,
                                    ),
                                  ),
                                  SizedBox(width: rowGap - 2),
                                  Expanded(
                                    flex: 4,
                                    child: _UsedControlColumn(
                                      palette: palette,
                                      state: _state,
                                      apply: _apply,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsSheet extends StatelessWidget {
  const _SettingsSheet({
    required this.state,
    required this.onThemeSelected,
    required this.onReset,
  });

  final ArenaCounterState state;
  final ValueChanged<ArenaThemeId> onThemeSelected;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final palette = ArenaThemePalette.byId(state.themeId);

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 18),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _withOpacity(palette.surface, 0.97),
                    _withOpacity(palette.surfaceStrong, 0.97),
                  ],
                ),
                border: Border.all(
                  color: _withOpacity(palette.border, 0.85),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _withOpacity(Colors.black, 0.25),
                    blurRadius: 28,
                    offset: const Offset(0, 18),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 54,
                        height: 6,
                        decoration: BoxDecoration(
                          color: _withOpacity(palette.textSecondary, 0.25),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      _settingsTitle,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: palette.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 14,
                      runSpacing: 14,
                      children: [
                        for (final candidate in ArenaThemePalette.all)
                          _ThemePreviewCard(
                            palette: candidate,
                            isSelected: candidate.id == state.themeId,
                            onTap: () => onThemeSelected(candidate.id),
                          ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    _SheetActionButton(
                      label: _resetLabel,
                      icon: Icons.refresh_rounded,
                      palette: palette,
                      onTap: onReset,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({required this.palette, required this.onSettingsTap});

  final ArenaThemePalette palette;
  final VoidCallback onSettingsTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: Row(
        children: [
          const Spacer(),
          DecoratedBox(
            decoration: BoxDecoration(
              color: _withOpacity(palette.surfaceStrong, 0.85),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _withOpacity(palette.border, 0.9),
                width: 2,
              ),
            ),
            child: IconButton(
              onPressed: onSettingsTap,
              padding: const EdgeInsets.all(8),
              iconSize: 20,
              constraints: const BoxConstraints.tightFor(width: 40, height: 40),
              icon: Icon(Icons.tune_rounded, color: palette.textPrimary),
              tooltip: _settingsTitle,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusStrip extends StatelessWidget {
  const _StatusStrip({required this.palette, required this.state});

  final ArenaThemePalette palette;
  final ArenaCounterState state;

  @override
  Widget build(BuildContext context) {
    final initiativeLabel = state.initiative == Initiative.first
        ? _firstLabel
        : _secondLabel;

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatusChip(
          palette: palette,
          label: '\uC0C1\uD0DC',
          value: state.isWaiting ? _waitingLabel : _activeLabel,
          emphasize: state.isWaiting,
        ),
        _StatusChip(
          palette: palette,
          label: '\uC21C\uC11C',
          value: initiativeLabel,
        ),
        _StatusChip(
          palette: palette,
          label: '\uB9AC\uB354',
          value: '${state.leaderLevel}/10',
        ),
        _StatusChip(
          palette: palette,
          label: '\uB370\uBBF8\uC9C0',
          value: '${state.damageZone}/9',
        ),
        _StatusChip(
          palette: palette,
          label: '\uC0AC\uC6A9',
          value: '${state.usedEnergy}/19',
          warning: state.isUsedEnergyOverflow,
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.palette,
    required this.label,
    required this.value,
    this.emphasize = false,
    this.warning = false,
  });

  final ArenaThemePalette palette;
  final String label;
  final String value;
  final bool emphasize;
  final bool warning;

  @override
  Widget build(BuildContext context) {
    final borderColor = warning
        ? _withOpacity(palette.warning, 0.85)
        : emphasize
        ? _withOpacity(palette.accentStrong, 0.85)
        : _withOpacity(palette.border, 0.55);
    final fillColor = warning
        ? _withOpacity(palette.warning, 0.14)
        : emphasize
        ? _withOpacity(palette.accent, 0.16)
        : _withOpacity(palette.surfaceStrong, 0.38);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: fillColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 1.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: _withOpacity(Colors.white, 0.72),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: warning ? palette.warning : Colors.white,
              height: 1.05,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopSummaryCard extends StatelessWidget {
  const _TopSummaryCard({required this.palette, required this.state});

  final ArenaThemePalette palette;
  final ArenaCounterState state;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      palette: palette,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            state.isWaiting ? _waitingLabel : _activeLabel,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: _uiFontFamily,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: palette.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 10),
          Container(height: 1.5, color: _withOpacity(palette.border, 0.72)),
          const SizedBox(height: 10),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _TopSummaryMetric(
                    palette: palette,
                    label: '리더',
                    value: '${state.leaderLevel}',
                  ),
                ),
                _TopDivider(palette: palette),
                Expanded(
                  child: _TopSummaryMetric(
                    palette: palette,
                    label: '데미지',
                    value: '${state.damageZone}',
                  ),
                ),
                _TopDivider(palette: palette),
                Expanded(
                  child: _TopSummaryMetric(
                    palette: palette,
                    label: '최대',
                    value: '${state.maxEnergy}',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TopSummaryMetric extends StatelessWidget {
  const _TopSummaryMetric({
    required this.palette,
    required this.label,
    required this.value,
  });

  final ArenaThemePalette palette;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: _uiFontFamily,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: palette.textSecondary,
            height: 1,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: _displayFontFamily,
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: palette.textPrimary,
            height: 1,
          ),
        ),
      ],
    );
  }
}

class _TopDivider extends StatelessWidget {
  const _TopDivider({required this.palette});

  final ArenaThemePalette palette;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      margin: const EdgeInsets.symmetric(vertical: 6),
      color: _withOpacity(palette.border, 0.62),
    );
  }
}

class _InitiativeSelectorCard extends StatelessWidget {
  const _InitiativeSelectorCard({
    required this.palette,
    required this.initiative,
    required this.onSelectFirst,
    required this.onSelectSecond,
  });

  final ArenaThemePalette palette;
  final Initiative initiative;
  final VoidCallback onSelectFirst;
  final VoidCallback onSelectSecond;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      palette: palette,
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '순서',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: _uiFontFamily,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: palette.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: _InitiativeOption(
                    palette: palette,
                    label: _firstLabel,
                    selected: initiative == Initiative.first,
                    onTap: onSelectFirst,
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: _InitiativeOption(
                    palette: palette,
                    label: _secondLabel,
                    selected: initiative == Initiative.second,
                    onTap: onSelectSecond,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InitiativeOption extends StatelessWidget {
  const _InitiativeOption({
    required this.palette,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = selected
        ? [
            _withOpacity(palette.accent, 0.94),
            _withOpacity(palette.accentStrong, 0.98),
          ]
        : [
            _withOpacity(palette.surfaceStrong, 0.72),
            _withOpacity(palette.surface, 0.82),
          ];

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: colors,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected
                  ? _withOpacity(Colors.white, 0.38)
                  : _withOpacity(palette.border, 0.72),
              width: 1.6,
            ),
          ),
          child: Center(
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: _uiFontFamily,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: selected ? Colors.white : palette.textPrimary,
                height: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroVisualCard extends StatefulWidget {
  const _HeroVisualCard({required this.palette});

  final ArenaThemePalette palette;

  @override
  State<_HeroVisualCard> createState() => _HeroVisualCardState();
}

class _HeroVisualCardState extends State<_HeroVisualCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 14),
  )..repeat(reverse: true);

  late final Animation<double> _motion = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeInOutSine,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = widget.palette;

    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: SizedBox.expand(
        child: Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(26),
              child: AnimatedBuilder(
                animation: _motion,
                child: Image.asset(
                  palette.heroGifAsset,
                  fit: BoxFit.cover,
                  gaplessPlayback: true,
                  errorBuilder: (context, error, stackTrace) => DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [palette.accentStrong, palette.accent],
                      ),
                    ),
                  ),
                ),
                builder: (context, child) {
                  final shift = (_motion.value - 0.5) * 16;
                  final scale = 1.05 + (_motion.value * 0.04);

                  return Transform.translate(
                    offset: Offset(shift, -shift * 0.7),
                    child: Transform.scale(
                      scale: scale,
                      alignment: Alignment.center,
                      child: child,
                    ),
                  );
                },
              ),
            ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      _withOpacity(Colors.black, 0.03),
                      _withOpacity(Colors.black, 0.18),
                      _withOpacity(Colors.black, 0.34),
                    ],
                  ),
                ),
              ),
            ),
            _TopImageCardChrome(palette: palette, showBottomAccent: true),
          ],
        ),
      ),
    );
  }
}

class _InitiativeCard extends StatelessWidget {
  const _InitiativeCard({
    required this.palette,
    required this.initiative,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final Initiative initiative;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = initiative == Initiative.first ? _firstLabel : _secondLabel;
    final badgeGradient = initiative == Initiative.first
        ? [
            _withOpacity(palette.accent, 0.82),
            _withOpacity(palette.accentStrong, 0.92),
          ]
        : [
            _withOpacity(palette.surfaceStrong, 0.82),
            _withOpacity(palette.backgroundShade, 0.88),
          ];

    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(26),
        onTap: onTap,
        child: SizedBox.expand(
          child: Stack(
            fit: StackFit.expand,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(26),
                child: Image.asset(
                  palette.initiativeAsset(initiative),
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [palette.accent, palette.surfaceStrong],
                      ),
                    ),
                  ),
                ),
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        _withOpacity(Colors.black, 0.02),
                        _withOpacity(Colors.black, 0.18),
                        _withOpacity(Colors.black, 0.46),
                      ],
                    ),
                  ),
                ),
              ),
              _TopImageCardChrome(palette: palette),
              Positioned(
                left: 10,
                right: 10,
                bottom: 10,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: badgeGradient,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: _withOpacity(Colors.white, 0.24),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _withOpacity(Colors.black, 0.20),
                            blurRadius: 14,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Text(
                        label,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: _uiFontFamily,
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          height: 1,
                          shadows: [
                            Shadow(
                              color: Color(0xB0000000),
                              blurRadius: 10,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopImageCardChrome extends StatelessWidget {
  const _TopImageCardChrome({
    required this.palette,
    this.showBottomAccent = false,
  });

  final ArenaThemePalette palette;
  final bool showBottomAccent;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: _withOpacity(Colors.white, 0.14),
                  width: 1.1,
                ),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _withOpacity(Colors.white, 0.05),
                    _withOpacity(Colors.white, 0),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 10,
            right: 10,
            top: 10,
            child: Container(
              height: 22,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _withOpacity(Colors.white, 0.18),
                    _withOpacity(Colors.white, 0),
                  ],
                ),
              ),
            ),
          ),
          if (showBottomAccent)
            Positioned(
              left: 14,
              right: 14,
              bottom: 14,
              child: Container(
                height: 3,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      _withOpacity(palette.accent, 0.78),
                      _withOpacity(palette.accentStrong, 0.18),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MaxEnergyCard extends StatelessWidget {
  const _MaxEnergyCard({required this.palette, required this.state});

  final ArenaThemePalette palette;
  final ArenaCounterState state;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CardHeaderSlab(
            palette: palette,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _maxEnergyTitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: _uiFontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: palette.textPrimary,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: _MetricCaption(
                        label: '\uB9AC\uB354 \uB808\uBCA8',
                        value: '${state.leaderLevel}',
                        color: palette.textSecondary,
                        valueColor: palette.textPrimary,
                        center: true,
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 30,
                      color: _withOpacity(palette.border, 0.65),
                    ),
                    Expanded(
                      child: _MetricCaption(
                        label: '\uB370\uBBF8\uC9C0\uC874',
                        value: '${state.damageZone}',
                        color: palette.textSecondary,
                        valueColor: palette.textPrimary,
                        center: true,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 8),
              child: SizedBox.expand(
                child: FittedBox(
                  fit: BoxFit.contain,
                  alignment: Alignment.center,
                  child: Text(
                    '${state.maxEnergy}',
                    style: TextStyle(
                      fontFamily: _displayFontFamily,
                      fontSize: 148,
                      height: 0.88,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -2.4,
                      color: palette.textPrimary,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UsedEnergyCard extends StatelessWidget {
  const _UsedEnergyCard({required this.palette, required this.state});

  final ArenaThemePalette palette;
  final ArenaCounterState state;

  @override
  Widget build(BuildContext context) {
    final overflow = state.isUsedEnergyOverflow;

    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CardHeaderSlab(
            palette: palette,
            child: Text(
              _usedEnergyTitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: _uiFontFamily,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: palette.textPrimary,
                height: 1,
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 8),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return Align(
                    alignment: Alignment.center,
                    child: SizedBox(
                      width: constraints.maxWidth * 0.78,
                      height: constraints.maxHeight * 0.72,
                      child: Align(
                        alignment: Alignment.center,
                        child: FittedBox(
                          fit: BoxFit.contain,
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${state.usedEnergy}',
                                style: TextStyle(
                                  fontFamily: _displayFontFamily,
                                  fontSize: 150,
                                  height: 0.9,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -2.6,
                                  color: overflow
                                      ? palette.warning
                                      : palette.textPrimary,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '/${state.maxEnergy}',
                                style: TextStyle(
                                  fontFamily: _displayFontFamily,
                                  fontSize: 54,
                                  height: 0.95,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -1.0,
                                  color: palette.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MaxControlColumn extends StatelessWidget {
  const _MaxControlColumn({
    required this.palette,
    required this.state,
    required this.apply,
  });

  final ArenaThemePalette palette;
  final ArenaCounterState state;
  final ValueChanged<ArenaCounterState> apply;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 4,
          child: _ControlButton(
            palette: palette,
            label: '\uB9AC\uB354 \uB808\uBCA8\uC5C5',
            onTap: () => apply(state.leaderLevelUp()),
            enabled: state.canLevelUp,
            emphasized: true,
            labelSize: 20,
            backgroundImageAsset: palette.firstInitiativeAsset,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          flex: 3,
          child: _ControlButton(
            palette: palette,
            label: '\uB370\uBBF8\uC9C0 +1',
            onTap: () => apply(state.increaseDamage()),
            enabled: state.canIncreaseDamage,
            labelSize: 18,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          flex: 3,
          child: _ControlButton(
            palette: palette,
            label: '\uB370\uBBF8\uC9C0 -1',
            onTap: () => apply(state.decreaseDamage()),
            enabled: state.canDecreaseDamage,
            labelSize: 18,
          ),
        ),
      ],
    );
  }
}

class _UsedControlColumn extends StatelessWidget {
  const _UsedControlColumn({
    required this.palette,
    required this.state,
    required this.apply,
  });

  final ArenaThemePalette palette;
  final ArenaCounterState state;
  final ValueChanged<ArenaCounterState> apply;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: _ControlButton(
            palette: palette,
            label: '+1',
            onTap: () => apply(state.increaseUsedEnergy()),
            enabled: state.canIncreaseUsedEnergy,
            emphasized: true,
            labelSize: 34,
          ),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: _ControlButton(
            palette: palette,
            label: '-1',
            onTap: () => apply(state.decreaseUsedEnergy()),
            enabled: state.canDecreaseUsedEnergy,
            labelSize: 34,
          ),
        ),
      ],
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.palette,
    required this.label,
    required this.onTap,
    required this.enabled,
    this.subtitle,
    this.backgroundImageAsset,
    this.emphasized = false,
    this.labelSize = 24,
  });

  final ArenaThemePalette palette;
  final String label;
  final String? subtitle;
  final String? backgroundImageAsset;
  final VoidCallback onTap;
  final bool enabled;
  final bool emphasized;
  final double labelSize;

  @override
  Widget build(BuildContext context) {
    final gradientColors = !enabled
        ? [
            _withOpacity(palette.surface, 0.90),
            _withOpacity(palette.surfaceStrong, 0.88),
          ]
        : emphasized
        ? [
            _withOpacity(palette.accent, 0.92),
            _withOpacity(palette.accentStrong, 0.95),
          ]
        : [
            _withOpacity(palette.surface, 0.985),
            _withOpacity(palette.surfaceStrong, 0.97),
          ];
    final textColor = !enabled
        ? _withOpacity(palette.textSecondary, 0.92)
        : emphasized
        ? Colors.white
        : palette.textPrimary;
    final borderColor = !enabled
        ? _withOpacity(palette.border, 0.68)
        : emphasized
        ? _withOpacity(Colors.white, 0.40)
        : _withOpacity(palette.border, 0.92);
    final topGlow = emphasized
        ? _withOpacity(Colors.white, 0.16)
        : _withOpacity(Colors.white, enabled ? 0.10 : 0.06);
    final hasImage = backgroundImageAsset != null;

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor, width: 1.8),
        boxShadow: [
          BoxShadow(
            color: emphasized
                ? _withOpacity(palette.accentStrong, 0.22)
                : _withOpacity(Colors.black, enabled ? 0.13 : 0.07),
            blurRadius: emphasized ? 18 : 12,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: enabled ? onTap : null,
          child: Stack(
            children: [
              if (hasImage)
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Image.asset(
                      backgroundImageAsset!,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                      errorBuilder: (context, error, stackTrace) =>
                          const SizedBox.shrink(),
                    ),
                  ),
                ),
              if (hasImage)
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          _withOpacity(palette.accentStrong, 0.14),
                          _withOpacity(palette.accent, 0.46),
                          _withOpacity(palette.accentStrong, 0.74),
                        ],
                      ),
                    ),
                  ),
                ),
              Positioned(
                left: 6,
                right: 6,
                top: 6,
                child: Container(
                  height: 20,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [topGlow, _withOpacity(topGlow, 0)],
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 10,
                right: 10,
                bottom: 8,
                child: Container(
                  height: 1,
                  color: _withOpacity(
                    emphasized ? Colors.white : palette.border,
                    enabled ? 0.10 : 0.06,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: _displayFontFamily,
                          fontSize: labelSize,
                          height: 1,
                          fontWeight: FontWeight.w700,
                          letterSpacing: labelSize >= 40 ? -1.2 : 0,
                          color: textColor,
                          shadows: hasImage
                              ? const [
                                  Shadow(
                                    color: Color(0x8A000000),
                                    blurRadius: 10,
                                    offset: Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: _uiFontFamily,
                            fontSize: 11,
                            height: 1.2,
                            fontWeight: FontWeight.w700,
                            color: _withOpacity(textColor, 0.78),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum HintTone { neutral, accent, warning }

class _HintBanner extends StatelessWidget {
  const _HintBanner({
    required this.palette,
    required this.tone,
    required this.message,
  });

  final ArenaThemePalette palette;
  final HintTone tone;
  final String message;

  @override
  Widget build(BuildContext context) {
    final (toneColor, icon) = switch (tone) {
      HintTone.neutral => (palette.surfaceMuted, Icons.schedule_rounded),
      HintTone.accent => (palette.accent, Icons.bolt_rounded),
      HintTone.warning => (palette.warning, Icons.warning_amber_rounded),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: _withOpacity(toneColor, 0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _withOpacity(toneColor, 0.55), width: 1.5),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: toneColor),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12,
                height: 1.35,
                fontWeight: FontWeight.w700,
                color: palette.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCaption extends StatelessWidget {
  const _MetricCaption({
    required this.label,
    required this.value,
    required this.color,
    required this.valueColor,
    this.center = false,
  });

  final String label;
  final String value;
  final Color color;
  final Color valueColor;
  final bool center;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: center
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        Text(
          label,
          textAlign: center ? TextAlign.center : TextAlign.start,
          style: TextStyle(
            fontFamily: _uiFontFamily,
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: color,
            height: 1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          textAlign: center ? TextAlign.center : TextAlign.start,
          style: TextStyle(
            fontFamily: _displayFontFamily,
            fontSize: 24,
            height: 1,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}

class _CardHeaderSlab extends StatelessWidget {
  const _CardHeaderSlab({required this.palette, required this.child});

  final ArenaThemePalette palette;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            _withOpacity(palette.surfaceStrong, 0.44),
            _withOpacity(palette.surfaceStrong, 0.28),
          ],
        ),
        border: Border(
          bottom: BorderSide(
            color: _withOpacity(palette.border, 0.62),
            width: 1.3,
          ),
        ),
      ),
      child: child,
    );
  }
}

class _ThemePreviewCard extends StatelessWidget {
  const _ThemePreviewCard({
    required this.palette,
    required this.isSelected,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 154,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isSelected
                      ? _withOpacity(palette.accentStrong, 0.95)
                      : _withOpacity(palette.border, 0.55),
                  width: isSelected ? 2.4 : 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _withOpacity(Colors.black, 0.16),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AspectRatio(
                    aspectRatio: 1.1,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.asset(
                          palette.thumbAsset,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Image.asset(
                              palette.backgroundAsset,
                              fit: BoxFit.cover,
                            );
                          },
                        ),
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  _withOpacity(Colors.black, 0.06),
                                  _withOpacity(Colors.black, 0.52),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 10,
                          top: 10,
                          child: _OverlayBadge(
                            label: isSelected ? 'ACTIVE' : 'THEME',
                            palette: palette,
                          ),
                        ),
                        Positioned(
                          left: 12,
                          right: 12,
                          bottom: 12,
                          child: Text(
                            palette.label,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              height: 1,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SheetActionButton extends StatelessWidget {
  const _SheetActionButton({
    required this.label,
    required this.icon,
    required this.palette,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final ArenaThemePalette palette;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _withOpacity(palette.surfaceStrong, 0.98),
            _withOpacity(palette.surface, 0.98),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _withOpacity(palette.border, 0.8), width: 2),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Icon(icon, color: palette.textPrimary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: palette.textPrimary,
                    ),
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: _withOpacity(palette.textSecondary, 0.9),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OverlayBadge extends StatelessWidget {
  const _OverlayBadge({
    required this.label,
    required this.palette,
    this.warning = false,
  });

  final String label;
  final ArenaThemePalette palette;
  final bool warning;

  @override
  Widget build(BuildContext context) {
    final fillColor = warning
        ? _withOpacity(palette.warning, 0.88)
        : _withOpacity(Colors.black, 0.48);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: fillColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: warning
              ? _withOpacity(Colors.white, 0.22)
              : _withOpacity(Colors.white, 0.16),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          height: 1,
          fontWeight: FontWeight.w900,
          color: Colors.white,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _GlassPanel extends StatelessWidget {
  const _GlassPanel({
    required this.palette,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.borderRadius = 28,
  });

  final ArenaThemePalette palette;
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                _withOpacity(palette.surface, 0.965),
                _withOpacity(palette.surfaceStrong, 0.955),
              ],
            ),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: _withOpacity(palette.border, 0.84),
              width: 1.8,
            ),
            boxShadow: [
              BoxShadow(
                color: _withOpacity(Colors.black, 0.16),
                blurRadius: 18,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                left: 12,
                right: 12,
                top: 10,
                child: IgnorePointer(
                  child: Container(
                    height: 14,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          _withOpacity(Colors.white, 0.10),
                          _withOpacity(Colors.white, 0.0),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 10,
                child: IgnorePointer(
                  child: Container(
                    height: 1,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: _withOpacity(palette.border, 0.12),
                    ),
                  ),
                ),
              ),
              Padding(padding: padding, child: child),
            ],
          ),
        ),
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [color, _withOpacity(color, 0.0)]),
        ),
      ),
    );
  }
}

Color _withOpacity(Color color, double opacity) {
  return color.withOpacity(opacity.clamp(0.0, 1.0).toDouble());
}
