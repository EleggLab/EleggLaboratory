// ignore_for_file: unused_element, unused_element_parameter

import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import 'models/app_theme_palette.dart';
import 'models/arena_counter_state.dart';
import 'models/custom_image_config.dart';
import 'services/custom_image_store.dart';

const _appTitle = '\uACC4\uC0B0\uD574\uC8FC\uB294 \uBE0C\uB808\uB514';
const _settingsTitle = '\uC124\uC815';
const _resetLabel = '\uCD08\uAE30\uD654';
const _waitingLabel = '\uD134 \uB300\uAE30\uC911';
const _activeLabel = '\uD134 \uC9C4\uD589\uC911';
const _firstLabel = '\uC120\uACF5';
const _secondLabel = '\uD6C4\uACF5';
const _maxEnergyTitle = '\uC0AC\uC774\uC988';
const _usedEnergyTitle = '\uC0AC\uC6A9 \uCF54\uC2A4\uD2B8';
const _backgroundImageLabel = '\uBC30\uACBD \uC774\uBBF8\uC9C0';
const _heroImageLabel = '\uC0C1\uB2E8 \uC774\uBBF8\uC9C0';
const _heroPrimaryImageLabel = '\uC0C1\uB2E8 \uC774\uBBF8\uC9C0 1';
const _heroSecondaryImageLabel = '\uC0C1\uB2E8 \uC774\uBBF8\uC9C0 2';
const _leaderButtonImageLabel =
    '\uB9AC\uB354 \uB808\uBCA8\uC5C5 \uC774\uBBF8\uC9C0';
const _themeModeLabel = '\uC0C9\uC0C1 \uBAA8\uB4DC';
const _guiltyDeckLabel = '\uAE38\uD2F0\uB371';
const _debiMarleneDeckLabel = '\uB370\uBE44&\uB9C8\uB4E4\uB80C';
const _debiMarleneEffectOnLabel =
    '\uB370\uBE44&\uB9C8\uB4E4\uB80C \uD6A8\uACFC \uD574\uC81C';
const _debiMarleneEffectOffLabel =
    '\uB370\uBE44&\uB9C8\uB4E4\uB80C \uD6A8\uACFC \uBC1C\uB3D9';
const _debiMarleneNeedLevelLabel =
    '\uB9AC\uB354 \uB808\uBCA8 10 \uC774\uC0C1 \uD544\uC694';
const _debiMarleneReadyLabel = '\uB204\uB974\uBA74 \uC0AC\uC774\uC988 +5';
const _debiMarleneActiveLabel =
    '\uC0AC\uC774\uC988 +5 \uC801\uC6A9 \uC911';
const _pickImageLabel = '\uC774\uBBF8\uC9C0 \uC120\uD0DD';
const _clearImageLabel = '\uC9C0\uC6B0\uAE30';
const _imageLoadErrorMessage =
    '\uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694.';
const _uiFontFamily = 'CookieRun';
const _displayFontFamily = 'CookieRun';

String? _specialDeckLabelFor(ArenaThemeId themeId) {
  return switch (themeId) {
    ArenaThemeId.guiltyLeader => _guiltyDeckLabel,
    ArenaThemeId.debiMarlene => _debiMarleneDeckLabel,
    _ => null,
  };
}

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
  final CustomImageStore _imageStore = CustomImageStore();
  final ImagePicker _imagePicker = ImagePicker();
  CustomImageConfig _images = CustomImageConfig.empty;
  bool _isHandlingImage = false;

  @override
  void initState() {
    super.initState();
    _loadCustomization();
  }

  void _apply(ArenaCounterState nextState) {
    setState(() {
      _state = nextState;
    });
  }

  Future<void> _loadCustomization() async {
    CustomImageConfig images = CustomImageConfig.empty;
    var themeId = _state.themeId;

    try {
      images = await _imageStore.load();
      themeId = await _imageStore.loadTheme();
    } catch (_) {
      images = CustomImageConfig.empty;
      themeId = _state.themeId;
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _images = images;
      _state = _state.changeTheme(themeId);
    });
  }

  Future<CustomImageConfig?> _pickImage(CustomImageSlot slot) async {
    if (_isHandlingImage) {
      return null;
    }

    setState(() {
      _isHandlingImage = true;
    });

    var currentStep = '이미지 선택';
    try {
      currentStep = '갤러리 열기';
      final picked = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        requestFullMetadata: false,
      );

      if (picked == null) {
        return null;
      }

      currentStep = '이미지 바이트 읽기';
      final bytes = await picked.readAsBytes();
      final originalName = picked.name.isNotEmpty
          ? picked.name
          : picked.path.split(Platform.pathSeparator).last;

      currentStep = '앱 저장소에 저장';
      final nextImages = await _imageStore.saveSlot(slot, bytes, originalName);
      if (!mounted) {
        return nextImages;
      }

      setState(() {
        _images = nextImages;
      });
      return nextImages;
    } catch (error) {
      if (!mounted) {
        return null;
      }

      final detail =
          '단계: $currentStep\n'
          '오류형식: ${error.runtimeType}\n'
          '상세: $error';
      debugPrint('Image pick failed: $detail');
      await _showImageError(detail);
      return null;
    } finally {
      if (mounted) {
        setState(() {
          _isHandlingImage = false;
        });
      }
    }
  }

  Future<void> _showImageError(String detail) async {
    if (!mounted) {
      return;
    }

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(_imageLoadErrorMessage),
          content: SingleChildScrollView(
            child: SelectableText(
              detail,
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: detail));
                if (dialogContext.mounted) {
                  Navigator.of(dialogContext).pop();
                }
                if (!mounted) {
                  return;
                }
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(const SnackBar(content: Text('오류 내용을 복사했어요.')));
              },
              child: const Text('복사'),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('닫기'),
            ),
          ],
        );
      },
    );
  }

  Future<CustomImageConfig?> _clearImage(CustomImageSlot slot) async {
    if (_isHandlingImage) {
      return null;
    }

    setState(() {
      _isHandlingImage = true;
    });

    try {
      final nextImages = await _imageStore.clearSlot(slot);
      if (!mounted) {
        return nextImages;
      }

      setState(() {
        _images = nextImages;
      });
      return nextImages;
    } finally {
      if (mounted) {
        setState(() {
          _isHandlingImage = false;
        });
      }
    }
  }

  Future<void> _changeTheme(ArenaThemeId themeId) async {
    if (_state.themeId == themeId) {
      return;
    }

    setState(() {
      _state = _state.changeTheme(themeId);
    });

    await _imageStore.saveTheme(themeId);
  }

  void _openSettingsSheet() {
    final palette = ArenaThemePalette.byId(_state.themeId);

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return _SettingsSheet(
          palette: palette,
          selectedThemeId: _state.themeId,
          images: _images,
          isBusy: _isHandlingImage,
          onThemeChanged: _changeTheme,
          onPickImage: _pickImage,
          onClearImage: _clearImage,
          onClose: () => Navigator.of(sheetContext).pop(),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = ArenaThemePalette.byId(_state.themeId);
    final width = MediaQuery.sizeOf(context).width;
    final heroPrimaryImage = _images.fileFor(CustomImageSlot.heroPrimary);
    final heroSecondaryImage = _images.fileFor(CustomImageSlot.heroSecondary);
    final specialDeckLabel = _specialDeckLabelFor(_state.themeId);
    final showDebiMarleneEffectCard = _state.isDebiMarleneTheme;
    final hasHeroVisual =
        showDebiMarleneEffectCard ||
        heroPrimaryImage != null ||
        heroSecondaryImage != null;
    final pagePadding = width < 390 ? 14.0 : 18.0;
    final rowGap = width < 390 ? 12.0 : 16.0;
    final sectionGap = width < 390 ? 8.0 : 10.0;
    final sectionBreakGap = width < 390 ? 12.0 : 14.0;

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 2.4, sigmaY: 2.4),
              child: _SlotImageOrFallback(
                file: _images.fileFor(CustomImageSlot.background),
                fit: BoxFit.cover,
                fallback: DecoratedBox(
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
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final heroHeight =
                          (constraints.maxHeight *
                                  (hasHeroVisual ? 0.22 : 0.16))
                              .clamp(124.0, 194.0);

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _HeaderBar(
                            palette: palette,
                            specialDeckLabel: specialDeckLabel,
                            onResetTap: () => _apply(_state.resetCounter()),
                            onSettingsTap: _openSettingsSheet,
                          ),
                          SizedBox(height: sectionGap),
                          SizedBox(
                            height: heroHeight,
                            child: showDebiMarleneEffectCard
                                ? _DebiMarleneEffectCard(
                                    palette: palette,
                                    state: _state,
                                    onTap: () => _apply(
                                      _state.toggleDebiMarleneEffect(),
                                    ),
                                  )
                                : _HeroVisualCard(
                                    palette: palette,
                                    primaryImageFile: heroPrimaryImage,
                                    secondaryImageFile: heroSecondaryImage,
                                  ),
                          ),
                          SizedBox(height: sectionBreakGap),
                          Expanded(
                            child: Column(
                              children: [
                                Expanded(
                                  flex: 100,
                                  child: _CounterRowShell(
                                    palette: palette,
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
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
                                            leaderButtonImage: _images.fileFor(
                                              CustomImageSlot.leaderButton,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(height: sectionBreakGap),
                                Expanded(
                                  flex: 64,
                                  child: _CounterRowShell(
                                    palette: palette,
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
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
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
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

class _SettingsSheet extends StatefulWidget {
  const _SettingsSheet({
    required this.palette,
    required this.selectedThemeId,
    required this.images,
    required this.isBusy,
    required this.onThemeChanged,
    required this.onPickImage,
    required this.onClearImage,
    required this.onClose,
  });

  final ArenaThemePalette palette;
  final ArenaThemeId selectedThemeId;
  final CustomImageConfig images;
  final bool isBusy;
  final Future<void> Function(ArenaThemeId themeId) onThemeChanged;
  final Future<CustomImageConfig?> Function(CustomImageSlot slot) onPickImage;
  final Future<CustomImageConfig?> Function(CustomImageSlot slot) onClearImage;
  final VoidCallback onClose;

  @override
  State<_SettingsSheet> createState() => _SettingsSheetState();
}

class _SettingsSheetState extends State<_SettingsSheet> {
  late ArenaThemeId _selectedThemeId = widget.selectedThemeId;
  late CustomImageConfig _images = widget.images;
  late bool _isBusy = widget.isBusy;

  Future<void> _pickImage(CustomImageSlot slot) async {
    setState(() {
      _isBusy = true;
    });

    final nextImages = await widget.onPickImage(slot);
    if (!mounted) {
      return;
    }

    setState(() {
      if (nextImages != null) {
        _images = nextImages;
      }
      _isBusy = false;
    });
  }

  Future<void> _clearImage(CustomImageSlot slot) async {
    setState(() {
      _isBusy = true;
    });

    final nextImages = await widget.onClearImage(slot);
    if (!mounted) {
      return;
    }

    setState(() {
      if (nextImages != null) {
        _images = nextImages;
      }
      _isBusy = false;
    });
  }

  Future<void> _changeTheme(ArenaThemeId themeId) async {
    setState(() {
      _selectedThemeId = themeId;
    });

    await widget.onThemeChanged(themeId);
  }

  @override
  Widget build(BuildContext context) {
    final palette = ArenaThemePalette.byId(_selectedThemeId);

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
                child: SingleChildScrollView(
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
                      Align(
                        alignment: Alignment.centerRight,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: _withOpacity(palette.surfaceStrong, 0.88),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: _withOpacity(palette.border, 0.72),
                              width: 1.6,
                            ),
                          ),
                          child: IconButton(
                            onPressed: widget.onClose,
                            tooltip: '닫기',
                            icon: Icon(
                              Icons.close_rounded,
                              color: palette.textPrimary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _themeModeLabel,
                        style: TextStyle(
                          fontFamily: _uiFontFamily,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: palette.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _ThemeModePicker(
                        palette: palette,
                        selectedThemeId: _selectedThemeId,
                        onThemeChanged: _changeTheme,
                      ),
                      const SizedBox(height: 16),
                      Column(
                        children: [
                          _ImageSlotEditorCard(
                            palette: palette,
                            title: _backgroundImageLabel,
                            subtitle: '메인 화면 배경 전체',
                            file: _images.fileFor(CustomImageSlot.background),
                            isBusy: _isBusy,
                            onPick: () =>
                                _pickImage(CustomImageSlot.background),
                            onClear: () =>
                                _clearImage(CustomImageSlot.background),
                          ),
                          const SizedBox(height: 12),
                          _ImageSlotEditorCard(
                            palette: palette,
                            title: _heroPrimaryImageLabel,
                            subtitle: '상단 카드에서 먼저 보여요',
                            file: _images.fileFor(CustomImageSlot.heroPrimary),
                            isBusy: _isBusy,
                            onPick: () =>
                                _pickImage(CustomImageSlot.heroPrimary),
                            onClear: () =>
                                _clearImage(CustomImageSlot.heroPrimary),
                          ),
                          const SizedBox(height: 12),
                          _ImageSlotEditorCard(
                            palette: palette,
                            title: _heroSecondaryImageLabel,
                            subtitle: '상단 카드를 터치하면 바뀌어요',
                            file: _images.fileFor(
                              CustomImageSlot.heroSecondary,
                            ),
                            isBusy: _isBusy,
                            onPick: () =>
                                _pickImage(CustomImageSlot.heroSecondary),
                            onClear: () =>
                                _clearImage(CustomImageSlot.heroSecondary),
                          ),
                          const SizedBox(height: 12),
                          _ImageSlotEditorCard(
                            palette: palette,
                            title: _leaderButtonImageLabel,
                            subtitle: '리더 레벨업 버튼 배경',
                            file: _images.fileFor(CustomImageSlot.leaderButton),
                            isBusy: _isBusy,
                            onPick: () =>
                                _pickImage(CustomImageSlot.leaderButton),
                            onClear: () =>
                                _clearImage(CustomImageSlot.leaderButton),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ThemeModePicker extends StatelessWidget {
  const _ThemeModePicker({
    required this.palette,
    required this.selectedThemeId,
    required this.onThemeChanged,
  });

  final ArenaThemePalette palette;
  final ArenaThemeId selectedThemeId;
  final Future<void> Function(ArenaThemeId themeId) onThemeChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: ArenaThemePalette.all
          .map(
            (mode) => _ThemeModeChip(
              palette: palette,
              mode: mode,
              selected: mode.id == selectedThemeId,
              onTap: () => onThemeChanged(mode.id),
            ),
          )
          .toList(),
    );
  }
}

class _ThemeModeChip extends StatelessWidget {
  const _ThemeModeChip({
    required this.palette,
    required this.mode,
    required this.selected,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final ArenaThemePalette mode;
  final bool selected;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => onTap(),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: BoxDecoration(
            color: selected
                ? _withOpacity(mode.surfaceStrong, 0.98)
                : _withOpacity(palette.surface, 0.72),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected
                  ? _withOpacity(mode.accent, 0.98)
                  : _withOpacity(palette.border, 0.55),
              width: selected ? 2 : 1.4,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [mode.accent, mode.accentStrong],
                  ),
                  border: Border.all(
                    color: _withOpacity(mode.surface, 0.92),
                    width: 1.2,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                mode.label,
                style: TextStyle(
                  fontFamily: _uiFontFamily,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: palette.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageSlotEditorCard extends StatelessWidget {
  const _ImageSlotEditorCard({
    required this.palette,
    required this.title,
    required this.subtitle,
    required this.file,
    required this.isBusy,
    required this.onPick,
    required this.onClear,
  });

  final ArenaThemePalette palette;
  final String title;
  final String subtitle;
  final File? file;
  final bool isBusy;
  final Future<void> Function() onPick;
  final Future<void> Function() onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _withOpacity(palette.surface, 0.86),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _withOpacity(palette.border, 0.78),
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: SizedBox(
                width: 92,
                height: 92,
                child: _SlotImageOrFallback(
                  file: file,
                  fit: BoxFit.cover,
                  fallback: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          _withOpacity(palette.surfaceStrong, 0.72),
                          _withOpacity(palette.surface, 0.92),
                        ],
                      ),
                    ),
                    child: Icon(
                      Icons.image_rounded,
                      color: _withOpacity(palette.textSecondary, 0.72),
                      size: 28,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: _uiFontFamily,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: palette.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontFamily: _uiFontFamily,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: palette.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _MiniActionChip(
                        palette: palette,
                        label: _pickImageLabel,
                        icon: Icons.photo_library_rounded,
                        emphasized: true,
                        enabled: !isBusy,
                        onTap: onPick,
                      ),
                      _MiniActionChip(
                        palette: palette,
                        label: _clearImageLabel,
                        icon: Icons.delete_outline_rounded,
                        emphasized: false,
                        enabled: !isBusy && file != null,
                        onTap: onClear,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniActionChip extends StatelessWidget {
  const _MiniActionChip({
    required this.palette,
    required this.label,
    required this.icon,
    required this.emphasized,
    required this.enabled,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final String label;
  final IconData icon;
  final bool emphasized;
  final bool enabled;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    final fillColor = emphasized
        ? _withOpacity(palette.accent, enabled ? 0.92 : 0.52)
        : _withOpacity(palette.surfaceStrong, enabled ? 0.90 : 0.56);
    final textColor = emphasized ? Colors.white : palette.textPrimary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: enabled ? () => onTap() : null,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: _withOpacity(
                emphasized ? Colors.white : palette.border,
                enabled ? 0.52 : 0.28,
              ),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: textColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontFamily: _uiFontFamily,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: textColor,
                  height: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SlotImageOrFallback extends StatelessWidget {
  const _SlotImageOrFallback({
    required this.file,
    required this.fit,
    required this.fallback,
  });

  final File? file;
  final BoxFit fit;
  final Widget fallback;

  @override
  Widget build(BuildContext context) {
    if (file == null || !file!.existsSync()) {
      return fallback;
    }

    return Image.file(
      file!,
      key: ValueKey(file!.path),
      fit: fit,
      gaplessPlayback: true,
      errorBuilder: (context, error, stackTrace) => fallback,
    );
  }
}

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({
    required this.palette,
    required this.specialDeckLabel,
    required this.onResetTap,
    required this.onSettingsTap,
  });

  final ArenaThemePalette palette;
  final String? specialDeckLabel;
  final VoidCallback onResetTap;
  final VoidCallback onSettingsTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: Row(
        children: [
          const Spacer(),
          if (specialDeckLabel != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: _withOpacity(palette.surface, 0.82),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: _withOpacity(palette.border, 0.42),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _withOpacity(Colors.black, 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Text(
                specialDeckLabel!,
                style: TextStyle(
                  fontFamily: _uiFontFamily,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: palette.textPrimary,
                  height: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          DecoratedBox(
            decoration: BoxDecoration(
              color: _withOpacity(Colors.white, 0.78),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: _withOpacity(palette.border, 0.34),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: _withOpacity(Colors.black, 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _HeaderIconButton(
                  palette: palette,
                  icon: Icons.refresh_rounded,
                  tooltip: _resetLabel,
                  onTap: onResetTap,
                  embedded: true,
                ),
                Container(
                  width: 1,
                  height: 24,
                  color: _withOpacity(palette.border, 0.28),
                ),
                _HeaderIconButton(
                  palette: palette,
                  icon: Icons.tune_rounded,
                  tooltip: _settingsTitle,
                  onTap: onSettingsTap,
                  embedded: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.palette,
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.embedded = false,
  });

  final ArenaThemePalette palette;
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    if (embedded) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Icon(icon, color: palette.textPrimary, size: 20),
          ),
        ),
      );
    }

    return DecoratedBox(
      decoration: BoxDecoration(
        color: _withOpacity(Colors.white, 0.84),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _withOpacity(palette.border, 0.42),
          width: 1.6,
        ),
        boxShadow: [
          BoxShadow(
            color: _withOpacity(Colors.black, 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: IconButton(
        onPressed: onTap,
        padding: const EdgeInsets.all(8),
        iconSize: 20,
        constraints: const BoxConstraints.tightFor(width: 40, height: 40),
        icon: Icon(icon, color: palette.textPrimary),
        tooltip: tooltip,
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
          label: '\uB300\uBBF8\uC9C0',
          value: '${state.damageZone}/9',
        ),
        _StatusChip(
          palette: palette,
          label: '\uC0AC\uC6A9',
          value: '${state.usedEnergy}/${state.usedEnergyLimit}',
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
                    label: '由щ뜑',
                    value: '${state.leaderLevel}',
                  ),
                ),
                _TopDivider(palette: palette),
                Expanded(
                  child: _TopSummaryMetric(
                    palette: palette,
                    label: '?곕?吏',
                    value: '${state.damageZone}',
                  ),
                ),
                _TopDivider(palette: palette),
                Expanded(
                  child: _TopSummaryMetric(
                    palette: palette,
                    label: '理쒕?',
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
            '?쒖꽌',
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
  const _HeroVisualCard({
    required this.palette,
    required this.primaryImageFile,
    required this.secondaryImageFile,
  });

  final ArenaThemePalette palette;
  final File? primaryImageFile;
  final File? secondaryImageFile;

  @override
  State<_HeroVisualCard> createState() => _HeroVisualCardState();
}

class _HeroVisualCardState extends State<_HeroVisualCard>
    with SingleTickerProviderStateMixin {
  bool _showPrimary = true;

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

  bool get _canToggle =>
      widget.primaryImageFile != null && widget.secondaryImageFile != null;

  File? get _activeImageFile {
    if (_showPrimary) {
      return widget.primaryImageFile ?? widget.secondaryImageFile;
    }

    return widget.secondaryImageFile ?? widget.primaryImageFile;
  }

  void _toggleImage() {
    if (!_canToggle) {
      return;
    }

    setState(() {
      _showPrimary = !_showPrimary;
    });
  }

  @override
  Widget build(BuildContext context) {
    final palette = widget.palette;
    final activeImageFile = _activeImageFile;
    final hasImage = activeImageFile != null;

    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(26),
          onTap: _canToggle ? _toggleImage : null,
          child: SizedBox.expand(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: AnimatedBuilder(
                    animation: _motion,
                    child: _SlotImageOrFallback(
                      file: activeImageFile,
                      fit: BoxFit.cover,
                      fallback: Stack(
                        fit: StackFit.expand,
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  _withOpacity(Colors.white, 0.96),
                                  _withOpacity(palette.surface, 0.96),
                                  _withOpacity(palette.surfaceStrong, 0.90),
                                ],
                              ),
                            ),
                          ),
                          Center(
                            child: Container(
                              padding: const EdgeInsets.fromLTRB(
                                20,
                                16,
                                20,
                                16,
                              ),
                              decoration: BoxDecoration(
                                color: _withOpacity(Colors.white, 0.42),
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(
                                  color: _withOpacity(palette.border, 0.16),
                                  width: 1.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: _withOpacity(Colors.white, 0.10),
                                    blurRadius: 10,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: _withOpacity(Colors.white, 0.60),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: _withOpacity(
                                          palette.border,
                                          0.18,
                                        ),
                                        width: 1.0,
                                      ),
                                    ),
                                    child: Icon(
                                      Icons.photo_size_select_actual_outlined,
                                      size: 24,
                                      color: _withOpacity(
                                        palette.textSecondary,
                                        0.74,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    _heroImageLabel,
                                    style: TextStyle(
                                      fontFamily: _uiFontFamily,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: palette.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
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
                          _withOpacity(Colors.black, hasImage ? 0.03 : 0.00),
                          _withOpacity(Colors.black, hasImage ? 0.18 : 0.03),
                          _withOpacity(Colors.black, hasImage ? 0.34 : 0.08),
                        ],
                      ),
                    ),
                  ),
                ),
                _TopImageCardChrome(palette: palette, showBottomAccent: true),
                if (_canToggle)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 22,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _withOpacity(Colors.black, 0.28),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: _withOpacity(Colors.white, 0.18),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _HeroDot(active: _showPrimary, color: Colors.white),
                            const SizedBox(width: 6),
                            _HeroDot(
                              active: !_showPrimary,
                              color: Colors.white,
                            ),
                          ],
                        ),
                      ),
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

class _DebiMarleneEffectCard extends StatelessWidget {
  const _DebiMarleneEffectCard({
    required this.palette,
    required this.state,
    required this.onTap,
  });

  final ArenaThemePalette palette;
  final ArenaCounterState state;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = state.canToggleDebiMarleneEffect;
    final active = state.debiMarleneEffectActive;
    final gradientColors = active
        ? [palette.accent, palette.accentStrong]
        : [
            _withOpacity(palette.surfaceStrong, 0.96),
            _withOpacity(palette.surface, 0.92),
          ];
    final label = active
        ? _debiMarleneEffectOnLabel
        : _debiMarleneEffectOffLabel;
    final subtitle = !enabled
        ? _debiMarleneNeedLevelLabel
        : active
        ? _debiMarleneActiveLabel
        : _debiMarleneReadyLabel;

    return _GlassPanel(
      palette: palette,
      padding: EdgeInsets.zero,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(26),
          onTap: enabled ? onTap : null,
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradientColors,
              ),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Positioned(
                  top: -24,
                  right: -8,
                  child: _GlowOrb(
                    color: _withOpacity(
                      active ? Colors.white : palette.accent,
                      active ? 0.22 : 0.14,
                    ),
                    size: 96,
                  ),
                ),
                Positioned(
                  bottom: -34,
                  left: -18,
                  child: _GlowOrb(
                    color: _withOpacity(
                      active ? palette.surface : palette.surfaceStrong,
                      0.16,
                    ),
                    size: 112,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 18, 22, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _withOpacity(
                            active ? Colors.white : palette.surface,
                            active ? 0.16 : 0.56,
                          ),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: _withOpacity(
                              active ? Colors.white : palette.border,
                              active ? 0.28 : 0.42,
                            ),
                          ),
                        ),
                        child: Text(
                          _debiMarleneDeckLabel,
                          style: TextStyle(
                            fontFamily: _uiFontFamily,
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: active ? Colors.white : palette.textPrimary,
                            height: 1,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        label,
                        style: TextStyle(
                          fontFamily: _uiFontFamily,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: active ? Colors.white : palette.textPrimary,
                          height: 1.05,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontFamily: _uiFontFamily,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: active
                              ? _withOpacity(Colors.white, 0.92)
                              : palette.textSecondary,
                          height: 1.1,
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
    );
  }
}

class _HeroDot extends StatelessWidget {
  const _HeroDot({required this.active, required this.color});

  final bool active;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      width: active ? 18 : 8,
      height: 8,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: _withOpacity(color, active ? 0.92 : 0.32),
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
                        value: state.leaderLevelDisplay,
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
                        label: '\uB300\uBBF8\uC9C0 \uC874',
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
    final remainingEnergy = state.maxEnergy - state.usedEnergy;

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
                              const SizedBox(width: 14),
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Container(
                                  width: 3,
                                  height: 54,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(999),
                                    color: overflow
                                        ? palette.warning
                                        : _withOpacity(
                                            palette.textSecondary,
                                            0.74,
                                          ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Text(
                                '$remainingEnergy',
                                style: TextStyle(
                                  fontFamily: _displayFontFamily,
                                  fontSize: 54,
                                  height: 0.95,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -1.0,
                                  color: overflow
                                      ? palette.warning
                                      : palette.textSecondary,
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
    required this.leaderButtonImage,
  });

  final ArenaThemePalette palette;
  final ArenaCounterState state;
  final ValueChanged<ArenaCounterState> apply;
  final File? leaderButtonImage;

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
            backgroundImageFile: leaderButtonImage,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          flex: 3,
          child: _ControlButton(
            palette: palette,
            label: '\uB300\uBBF8\uC9C0 +1',
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
            label: '\uB300\uBBF8\uC9C0 -1',
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
    this.backgroundImageFile,
    this.emphasized = false,
    this.labelSize = 24,
  });

  final ArenaThemePalette palette;
  final String label;
  final String? subtitle;
  final File? backgroundImageFile;
  final VoidCallback onTap;
  final bool enabled;
  final bool emphasized;
  final double labelSize;

  @override
  Widget build(BuildContext context) {
    final gradientColors = !enabled
        ? [
            _withOpacity(Colors.white, 0.84),
            _withOpacity(palette.surface, 0.90),
          ]
        : emphasized
        ? [
            _withOpacity(palette.accent, 0.92),
            _withOpacity(palette.accentStrong, 0.95),
          ]
        : [
            _withOpacity(Colors.white, 0.96),
            _withOpacity(palette.surface, 0.965),
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
        : _withOpacity(palette.border, 0.54);
    final topGlow = emphasized
        ? _withOpacity(Colors.white, 0.16)
        : _withOpacity(Colors.white, enabled ? 0.10 : 0.06);
    final hasImage = backgroundImageFile != null;

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
                : _withOpacity(Colors.black, enabled ? 0.08 : 0.05),
            blurRadius: emphasized ? 18 : 9,
            offset: emphasized ? const Offset(0, 8) : const Offset(0, 5),
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
                    child: Image.file(
                      backgroundImageFile!,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
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
                  height: emphasized ? 20 : 14,
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
                    emphasized
                        ? (enabled ? 0.10 : 0.06)
                        : (enabled ? 0.18 : 0.08),
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

class _CounterRowShell extends StatelessWidget {
  const _CounterRowShell({required this.palette, required this.child});

  final ArenaThemePalette palette;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        color: _withOpacity(Colors.white, 0.04),
        border: Border.all(
          color: _withOpacity(palette.border, 0.24),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: _withOpacity(Colors.black, 0.05),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
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
                _withOpacity(Colors.white, 0.955),
                _withOpacity(palette.surface, 0.945),
              ],
            ),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: _withOpacity(palette.border, 0.46),
              width: 1.35,
            ),
            boxShadow: [
              BoxShadow(
                color: _withOpacity(Colors.black, 0.10),
                blurRadius: 12,
                offset: const Offset(0, 6),
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
                          _withOpacity(Colors.white, 0.08),
                          _withOpacity(Colors.white, 0.0),
                        ],
                      ),
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
  return color.withValues(alpha: opacity.clamp(0.0, 1.0).toDouble());
}
