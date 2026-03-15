import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as dart_ui;

import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/game_options.dart';

enum VfxBlockType { normal, triangle, steel, cactus, bomb, ballPickup, boss }

class VfxManager {
  VfxManager({required math.Random random})
    : _random = random,
      _audio = _OptionalAudioService();

  final math.Random _random;
  final _OptionalAudioService _audio;

  final List<_FxSpark> _sparks = <_FxSpark>[];
  final List<_FxRing> _rings = <_FxRing>[];
  final List<_FxFlash> _flashes = <_FxFlash>[];
  final List<_FxRecallGhost> _recallGhosts = <_FxRecallGhost>[];
  final List<_FxFloatingText> _floatingTexts = <_FxFloatingText>[];

  static const int _maxSparks = 180;
  static const int _maxRings = 48;
  static const int _maxFlashes = 36;
  static const int _maxRecallGhosts = 48;
  static const int _maxFloatingTexts = 20;

  dart_ui.Image? _noiseTexture;
  dart_ui.Image? _radialTexture;

  double _noiseOverlayTimer = 0;
  double _shakeTimer = 0;
  double _shakeDuration = 0;
  double _shakeAmplitude = 0;
  Offset _shakeOffset = Offset.zero;
  String _lastEvent = '-';

  bool _vibrationEnabled = true;
  double _particleScale = 1.0;
  double _shakeScale = 1.0;
  bool _allowBombShake = false;
  double _baseParticleScale = 1.0;
  double _baseShakeScale = 1.0;
  bool _baseAllowBombShake = false;
  bool _perfDegraded = false;
  final TextPainter _floatingTextPainter = TextPainter(
    textDirection: TextDirection.ltr,
    textAlign: TextAlign.center,
    maxLines: 1,
  );

  Offset get shakeOffset => _shakeOffset;
  String get debugEventLabel => _lastEvent;
  int get sparkCount => _sparks.length;
  int get ringCount => _rings.length;
  int get flashCount => _flashes.length;
  int get recallGhostCount => _recallGhosts.length;
  int get floatingTextCount => _floatingTexts.length;

  static int get maxSparkCount => _maxSparks;
  static int get maxRingCount => _maxRings;
  static int get maxFlashCount => _maxFlashes;
  static int get maxRecallGhostCount => _maxRecallGhosts;
  static int get maxFloatingTextCount => _maxFloatingTexts;

  Future<void> initialize() async {
    _noiseTexture = await _tryLoadImage('assets/vfx/perlin_noise.png');
    _radialTexture = await _tryLoadImage('assets/vfx/gradient_radial.png');
    await _audio.initialize();
  }

  Future<void> dispose() async {
    await _audio.dispose();
  }

  void debugReset() {
    _sparks.clear();
    _rings.clear();
    _flashes.clear();
    _recallGhosts.clear();
    _floatingTexts.clear();
    _noiseOverlayTimer = 0;
    _shakeTimer = 0;
    _shakeDuration = 0;
    _shakeAmplitude = 0;
    _shakeOffset = Offset.zero;
    _lastEvent = '-';
  }

  void configure({
    required bool sfxEnabled,
    required bool vibrationEnabled,
    required VfxIntensity intensity,
  }) {
    _audio.setEnabled(sfxEnabled);
    _vibrationEnabled = vibrationEnabled;

    switch (intensity) {
      case VfxIntensity.low:
        _baseParticleScale = 0.65;
        _baseShakeScale = 0.7;
        _baseAllowBombShake = false;
      case VfxIntensity.medium:
        _baseParticleScale = 1.0;
        _baseShakeScale = 1.0;
        _baseAllowBombShake = false;
      case VfxIntensity.high:
        _baseParticleScale = 1.35;
        _baseShakeScale = 1.28;
        _baseAllowBombShake = true;
    }
    _applyPerfScale();
  }

  void setPerfDegraded(bool degraded) {
    if (_perfDegraded == degraded) {
      return;
    }
    _perfDegraded = degraded;
    _applyPerfScale();
  }

  void _applyPerfScale() {
    if (_perfDegraded) {
      _particleScale = (_baseParticleScale * 0.6).clamp(0.35, 1.0);
      _shakeScale = 0.0;
      _allowBombShake = false;
    } else {
      _particleScale = _baseParticleScale;
      _shakeScale = _baseShakeScale;
      _allowBombShake = _baseAllowBombShake;
    }
  }

  void update(double dt) {
    _updateSparks(dt);
    _updateRings(dt);
    _updateFlashes(dt);
    _updateRecallGhosts(dt);
    _updateFloatingTexts(dt);

    if (_noiseOverlayTimer > 0) {
      _noiseOverlayTimer -= dt;
      if (_noiseOverlayTimer < 0) {
        _noiseOverlayTimer = 0;
      }
    }

    if (_shakeTimer > 0) {
      _shakeTimer -= dt;
      final t = (_shakeTimer / (_shakeDuration <= 0 ? 1 : _shakeDuration))
          .clamp(0.0, 1.0)
          .toDouble();
      final amp = _shakeAmplitude * (0.2 + (0.8 * t));
      _shakeOffset = Offset(
        (_random.nextDouble() * 2 - 1) * amp,
        (_random.nextDouble() * 2 - 1) * amp,
      );
      if (_shakeTimer <= 0) {
        _shakeOffset = Offset.zero;
      }
    } else {
      _shakeOffset = Offset.zero;
    }
  }

  void render({
    required Canvas canvas,
    required Rect boardRect,
    required double elapsedSec,
  }) {
    _drawFlashes(canvas);
    _drawRings(canvas, elapsedSec);
    _drawRecallGhosts(canvas);
    _drawSparks(canvas);
    _drawFloatingTexts(canvas);
    _drawNoiseOverlay(canvas, boardRect, elapsedSec);
  }

  void onBallBounce(Vector2 position) {
    _lastEvent =
        'bounce(${position.x.toStringAsFixed(0)},${position.y.toStringAsFixed(0)})';
    _spawnSparks(
      origin: Offset(position.x, position.y),
      count: 2,
      color: const Color(0xB3D8EEFF),
      baseSpeed: 70,
      spread: 0.85,
      lifeMin: 0.08,
      lifeMax: 0.16,
      radius: 1.6,
    );
  }

  void onBlockHit({
    required int cellCol,
    required int cellRow,
    required Vector2 position,
  }) {
    _lastEvent = 'hit[$cellCol,$cellRow]';
    _addFlash(
      _FxFlash(
        center: Offset(position.x, position.y),
        color: const Color(0xAAFFFFFF),
        duration: 0.10,
        radiusStart: 2.0,
        radiusEnd: 10.0,
      ),
    );
    _spawnSparks(
      origin: Offset(position.x, position.y),
      count: 6,
      color: const Color(0xFFE3F2FD),
      baseSpeed: 110,
      spread: 1.1,
      lifeMin: 0.08,
      lifeMax: 0.18,
      radius: 1.8,
    );
    _noiseOverlayTimer = math.max(_noiseOverlayTimer, 0.085);
    _triggerShake(duration: 0.06, amplitude: 0.9);
    _playSfx('assets/audio/hit.ogg', volume: 0.52, cooldownMs: 42);
    _vibrateLight();
  }

  void onBlockBreak({
    required int cellCol,
    required int cellRow,
    required Vector2 position,
    required VfxBlockType type,
  }) {
    _lastEvent = 'break[$cellCol,$cellRow]';
    final baseColor = _blockColor(type);
    _addRing(
      _FxRing(
        center: Offset(position.x, position.y),
        color: baseColor.withValues(alpha: 0.62),
        duration: 0.24,
        radiusStart: 3.0,
        radiusEnd: 18.0,
        strokeStart: 2.2,
        strokeEnd: 0.2,
      ),
    );
    _spawnSparks(
      origin: Offset(position.x, position.y),
      count: 9,
      color: baseColor,
      baseSpeed: 145,
      spread: 1.35,
      lifeMin: 0.16,
      lifeMax: 0.36,
      radius: 2.2,
    );
    if (type == VfxBlockType.ballPickup) {
      return;
    }
    _playSfx('assets/audio/break.ogg', volume: 0.50, cooldownMs: 32);
  }

  void onBombExplode({
    required Vector2 position,
    required int affectedCellsCount,
  }) {
    _lastEvent = 'bomb($affectedCellsCount)';
    final center = Offset(position.x, position.y);
    _addRing(
      _FxRing(
        center: center,
        color: const Color(0xB3FF6E5E),
        duration: 0.34,
        radiusStart: 8.0,
        radiusEnd: 56.0,
        strokeStart: 4.4,
        strokeEnd: 0.4,
      ),
    );
    _addFlash(
      _FxFlash(
        center: center,
        color: const Color(0x99FFF3E0),
        duration: 0.11,
        radiusStart: 10.0,
        radiusEnd: 42.0,
      ),
    );
    _spawnSparks(
      origin: center,
      count: (12 + affectedCellsCount).clamp(12, 36),
      color: const Color(0xFFFFAB91),
      baseSpeed: 190,
      spread: 2.8,
      lifeMin: 0.22,
      lifeMax: 0.48,
      radius: 2.8,
    );
    _noiseOverlayTimer = math.max(_noiseOverlayTimer, 0.12);
    if (_allowBombShake) {
      _triggerShake(duration: 0.16, amplitude: 2.4);
    }
    _playSfx('assets/audio/explosion.ogg', volume: 0.74, cooldownMs: 64);
    _vibrateMedium();
  }

  void onPickupBallPlus(Vector2 position) {
    _lastEvent = 'pickup+1';
    final center = Offset(position.x, position.y);
    _addRing(
      _FxRing(
        center: center,
        color: const Color(0xCCFFF176),
        duration: 0.26,
        radiusStart: 4.0,
        radiusEnd: 20.0,
        strokeStart: 2.8,
        strokeEnd: 0.2,
      ),
    );
    _spawnSparks(
      origin: center,
      count: 8,
      color: const Color(0xFFFFF59D),
      baseSpeed: 120,
      spread: 1.6,
      lifeMin: 0.16,
      lifeMax: 0.34,
      radius: 2.0,
    );
    _addFloatingText(
      _FxFloatingText(
        text: '+1',
        position: center,
        drift: const Offset(0, -34),
        color: const Color(0xFFFFF176),
        life: 0.62,
      ),
    );
    _playSfx('assets/audio/pickup.ogg', volume: 0.62);
  }

  void onRecallPressed({
    required List<Vector2> ballPositions,
    required double bottomCollectY,
  }) {
    final maxGhosts = (_maxRecallGhosts * _particleScale)
        .round()
        .clamp(12, _maxRecallGhosts)
        .toInt();
    _lastEvent = 'recall(${ballPositions.length})';
    for (final pos in ballPositions.take(maxGhosts)) {
      _addRecallGhost(
        _FxRecallGhost(
          start: Offset(pos.x, pos.y),
          end: Offset(pos.x, bottomCollectY - 4),
          duration: 0.18 + (_random.nextDouble() * 0.08),
          startRadius: 5.5,
          endRadius: 1.4,
          color: const Color(0xCCB3E5FC),
        ),
      );
    }
    _triggerShake(duration: 0.12, amplitude: 1.4);
    _vibrateLight();
    _playSfx('assets/audio/recall.ogg', volume: 0.60);
  }

  void onTurnResolved({
    required int combo,
    required int manaGained,
    required Rect boardRect,
  }) {
    _lastEvent = 'resolved combo=$combo mana=$manaGained';
    if (combo < 6) {
      return;
    }

    final center = Offset(boardRect.center.dx, boardRect.top + 28);
    final baseCount = combo >= 70
        ? 24
        : combo >= 50
        ? 18
        : combo >= 30
        ? 12
        : 8;
    final confettiCount = _scaledCount(baseCount, min: 4, max: 36);

    const palette = <Color>[
      Color(0xFFFFF176),
      Color(0xFF80DEEA),
      Color(0xFFFFAB91),
      Color(0xFFCE93D8),
      Color(0xFFA5D6A7),
    ];

    for (var i = 0; i < confettiCount; i++) {
      final color = palette[i % palette.length];
      final angle = (-math.pi / 2) + ((_random.nextDouble() - 0.5) * 1.5);
      final speed = 80 + (_random.nextDouble() * 110);
      final velocity = Offset(math.cos(angle) * speed, math.sin(angle) * speed);
      final life = 0.42 + (_random.nextDouble() * 0.34);
      _addSpark(
        _FxSpark(
          position: center,
          velocity: velocity,
          gravity: 220,
          life: life,
          maxLife: life,
          startRadius: 2.1,
          endRadius: 0.6,
          color: color,
        ),
      );
    }

    if (combo >= 30) {
      _triggerShake(duration: 0.08, amplitude: 1.0);
      _vibrateMedium();
    }
    _playSfx('assets/audio/combo.ogg', volume: 0.62, cooldownMs: 90);
  }

  Future<dart_ui.Image?> _tryLoadImage(String assetPath) async {
    try {
      final data = await rootBundle.load(assetPath);
      final codec = await dart_ui.instantiateImageCodec(
        data.buffer.asUint8List(),
      );
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (_) {
      return null;
    }
  }

  int _scaledCount(int base, {required int min, required int max}) {
    final scaled = (base * _particleScale).round();
    return scaled.clamp(min, max).toInt();
  }

  void _triggerShake({required double duration, required double amplitude}) {
    final scaledAmplitude = amplitude * _shakeScale;
    if (scaledAmplitude <= 0.01) {
      return;
    }

    if (duration > _shakeTimer) {
      _shakeTimer = duration;
      _shakeDuration = duration;
    }
    if (scaledAmplitude > _shakeAmplitude) {
      _shakeAmplitude = scaledAmplitude;
    }
  }

  void _playSfx(String assetPath, {double volume = 1.0, int cooldownMs = 0}) {
    unawaited(_audio.play(assetPath, volume: volume, cooldownMs: cooldownMs));
  }

  void _vibrateLight() {
    if (!_vibrationEnabled) {
      return;
    }
    unawaited(HapticFeedback.lightImpact());
  }

  void _vibrateMedium() {
    if (!_vibrationEnabled) {
      return;
    }
    unawaited(HapticFeedback.mediumImpact());
  }

  Color _blockColor(VfxBlockType type) {
    switch (type) {
      case VfxBlockType.normal:
        return const Color(0xFF64B5F6);
      case VfxBlockType.triangle:
        return const Color(0xFF9575CD);
      case VfxBlockType.steel:
        return const Color(0xFFB0BEC5);
      case VfxBlockType.cactus:
        return const Color(0xFF66BB6A);
      case VfxBlockType.bomb:
        return const Color(0xFFEF5350);
      case VfxBlockType.ballPickup:
        return const Color(0xFFFFEE58);
      case VfxBlockType.boss:
        return const Color(0xFFFF7043);
    }
  }

  void _spawnSparks({
    required Offset origin,
    required int count,
    required Color color,
    required double baseSpeed,
    required double spread,
    required double lifeMin,
    required double lifeMax,
    required double radius,
  }) {
    final sparkCount = _scaledCount(count, min: 1, max: 52);
    for (var i = 0; i < sparkCount; i++) {
      final angle = (_random.nextDouble() * 2 * math.pi);
      final speed = baseSpeed * (0.65 + (_random.nextDouble() * spread));
      final life = lifeMin + (_random.nextDouble() * (lifeMax - lifeMin));
      _addSpark(
        _FxSpark(
          position: origin,
          velocity: Offset(math.cos(angle) * speed, math.sin(angle) * speed),
          gravity: 190,
          life: life,
          maxLife: life,
          startRadius: radius,
          endRadius: 0.2,
          color: color,
        ),
      );
    }
  }

  void _drawNoiseOverlay(Canvas canvas, Rect boardRect, double elapsedSec) {
    if (_noiseOverlayTimer <= 0) {
      return;
    }
    final alpha = (_noiseOverlayTimer / 0.12).clamp(0.0, 1.0).toDouble();
    if (_noiseTexture != null) {
      final image = _noiseTexture!;
      final src = Rect.fromLTWH(
        0,
        0,
        image.width.toDouble(),
        image.height.toDouble(),
      );
      canvas.drawImageRect(
        image,
        src,
        boardRect,
        Paint()
          ..filterQuality = FilterQuality.low
          ..colorFilter = ColorFilter.mode(
            Colors.white.withValues(alpha: 0.10 * alpha),
            BlendMode.modulate,
          ),
      );
      return;
    }

    final pulse = 0.04 + (math.sin(elapsedSec * 24) * 0.01);
    canvas.drawRect(
      boardRect,
      Paint()..color = Colors.white.withValues(alpha: pulse * alpha),
    );
  }

  void _drawFlashes(Canvas canvas) {
    for (final flash in _flashes) {
      final t = flash.progress;
      final radius = _lerpDouble(flash.radiusStart, flash.radiusEnd, t);
      final alpha = (1 - t).clamp(0.0, 1.0).toDouble();
      canvas.drawCircle(
        flash.center,
        radius,
        Paint()..color = flash.color.withValues(alpha: flash.color.a * alpha),
      );
    }
  }

  void _drawRings(Canvas canvas, double elapsedSec) {
    for (final ring in _rings) {
      final t = ring.progress;
      final radius = _lerpDouble(ring.radiusStart, ring.radiusEnd, t);
      final stroke = _lerpDouble(ring.strokeStart, ring.strokeEnd, t);
      final alpha = (1 - t).clamp(0.0, 1.0).toDouble();
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(0.2, stroke)
        ..color = ring.color.withValues(alpha: ring.color.a * alpha);
      canvas.drawCircle(ring.center, radius, paint);

      if (_radialTexture != null && t < 0.5) {
        final image = _radialTexture!;
        final src = Rect.fromLTWH(
          0,
          0,
          image.width.toDouble(),
          image.height.toDouble(),
        );
        final dst = Rect.fromCircle(center: ring.center, radius: radius);
        canvas.drawImageRect(
          image,
          src,
          dst,
          Paint()
            ..filterQuality = FilterQuality.low
            ..colorFilter = ColorFilter.mode(
              ring.color.withValues(alpha: 0.28 * (1 - t)),
              BlendMode.modulate,
            ),
        );
      }
    }
  }

  void _drawRecallGhosts(Canvas canvas) {
    for (final ghost in _recallGhosts) {
      final t = Curves.easeInCubic.transform(ghost.progress);
      final x = _lerpDouble(ghost.start.dx, ghost.end.dx, t);
      final y = _lerpDouble(ghost.start.dy, ghost.end.dy, t);
      final radius = _lerpDouble(ghost.startRadius, ghost.endRadius, t);
      final alpha = (1 - t).clamp(0.0, 1.0).toDouble();
      canvas.drawCircle(
        Offset(x, y),
        radius,
        Paint()..color = ghost.color.withValues(alpha: ghost.color.a * alpha),
      );
      canvas.drawLine(
        Offset(x, y - (radius * 0.5)),
        Offset(x, y - (radius * 4.2)),
        Paint()
          ..strokeWidth = math.max(0.8, radius * 0.35)
          ..color = ghost.color.withValues(alpha: ghost.color.a * 0.42 * alpha),
      );
    }
  }

  void _drawSparks(Canvas canvas) {
    for (final spark in _sparks) {
      final t = spark.progress;
      final radius = _lerpDouble(spark.startRadius, spark.endRadius, t);
      final alpha = (1 - t).clamp(0.0, 1.0).toDouble();
      canvas.drawCircle(
        spark.position,
        math.max(0.1, radius),
        Paint()..color = spark.color.withValues(alpha: spark.color.a * alpha),
      );
    }
  }

  void _drawFloatingTexts(Canvas canvas) {
    for (final fx in _floatingTexts) {
      final progress = fx.progress;
      final alpha = (1 - progress).clamp(0.0, 1.0).toDouble();
      final drawPos = Offset(
        fx.position.dx + (fx.drift.dx * Curves.easeOut.transform(progress)),
        fx.position.dy + (fx.drift.dy * Curves.easeOut.transform(progress)),
      );
      _floatingTextPainter.text = TextSpan(
        text: fx.text,
        style: TextStyle(
          color: fx.color.withValues(alpha: alpha),
          fontSize: 14,
          fontWeight: FontWeight.w900,
          shadows: const <Shadow>[
            Shadow(
              color: Color(0xAA000000),
              blurRadius: 2,
              offset: Offset(0, 1),
            ),
          ],
        ),
      );
      _floatingTextPainter.layout(minWidth: 0, maxWidth: 120);
      _floatingTextPainter.paint(
        canvas,
        Offset(
          drawPos.dx - (_floatingTextPainter.width / 2),
          drawPos.dy - _floatingTextPainter.height,
        ),
      );
    }
  }

  void _updateSparks(double dt) {
    for (var i = _sparks.length - 1; i >= 0; i--) {
      final spark = _sparks[i];
      spark.life -= dt;
      if (spark.life <= 0) {
        _sparks.removeAt(i);
        continue;
      }
      final vx = spark.velocity.dx;
      final vy = spark.velocity.dy + (spark.gravity * dt);
      spark.velocity = Offset(vx * 0.98, vy * 0.98);
      spark.position = Offset(
        spark.position.dx + (spark.velocity.dx * dt),
        spark.position.dy + (spark.velocity.dy * dt),
      );
    }
  }

  void _updateRings(double dt) {
    for (var i = _rings.length - 1; i >= 0; i--) {
      final ring = _rings[i];
      ring.time += dt;
      if (ring.time >= ring.duration) {
        _rings.removeAt(i);
      }
    }
  }

  void _updateFlashes(double dt) {
    for (var i = _flashes.length - 1; i >= 0; i--) {
      final flash = _flashes[i];
      flash.time += dt;
      if (flash.time >= flash.duration) {
        _flashes.removeAt(i);
      }
    }
  }

  void _updateRecallGhosts(double dt) {
    for (var i = _recallGhosts.length - 1; i >= 0; i--) {
      final ghost = _recallGhosts[i];
      ghost.time += dt;
      if (ghost.time >= ghost.duration) {
        _recallGhosts.removeAt(i);
      }
    }
  }

  void _updateFloatingTexts(double dt) {
    for (var i = _floatingTexts.length - 1; i >= 0; i--) {
      final textFx = _floatingTexts[i];
      textFx.life -= dt;
      if (textFx.life <= 0) {
        _floatingTexts.removeAt(i);
      }
    }
  }

  void _addSpark(_FxSpark spark) {
    if (_sparks.length >= _maxSparks) {
      _sparks.removeAt(0);
    }
    _sparks.add(spark);
  }

  void _addRing(_FxRing ring) {
    if (_rings.length >= _maxRings) {
      _rings.removeAt(0);
    }
    _rings.add(ring);
  }

  void _addFlash(_FxFlash flash) {
    if (_flashes.length >= _maxFlashes) {
      _flashes.removeAt(0);
    }
    _flashes.add(flash);
  }

  void _addRecallGhost(_FxRecallGhost ghost) {
    if (_recallGhosts.length >= _maxRecallGhosts) {
      _recallGhosts.removeAt(0);
    }
    _recallGhosts.add(ghost);
  }

  void _addFloatingText(_FxFloatingText floatingText) {
    if (_floatingTexts.length >= _maxFloatingTexts) {
      _floatingTexts.removeAt(0);
    }
    _floatingTexts.add(floatingText);
  }

  double _lerpDouble(double a, double b, double t) => a + ((b - a) * t);
}

class _FxSpark {
  _FxSpark({
    required this.position,
    required this.velocity,
    required this.gravity,
    required this.life,
    required this.maxLife,
    required this.startRadius,
    required this.endRadius,
    required this.color,
  });

  Offset position;
  Offset velocity;
  final double gravity;
  double life;
  final double maxLife;
  final double startRadius;
  final double endRadius;
  final Color color;

  double get progress => 1 - (life / maxLife);
}

class _FxRing {
  _FxRing({
    required this.center,
    required this.color,
    required this.duration,
    required this.radiusStart,
    required this.radiusEnd,
    required this.strokeStart,
    required this.strokeEnd,
  });

  final Offset center;
  final Color color;
  final double duration;
  final double radiusStart;
  final double radiusEnd;
  final double strokeStart;
  final double strokeEnd;

  double time = 0;

  double get progress => (time / duration).clamp(0.0, 1.0).toDouble();
}

class _FxFlash {
  _FxFlash({
    required this.center,
    required this.color,
    required this.duration,
    required this.radiusStart,
    required this.radiusEnd,
  });

  final Offset center;
  final Color color;
  final double duration;
  final double radiusStart;
  final double radiusEnd;

  double time = 0;

  double get progress => (time / duration).clamp(0.0, 1.0).toDouble();
}

class _FxRecallGhost {
  _FxRecallGhost({
    required this.start,
    required this.end,
    required this.duration,
    required this.startRadius,
    required this.endRadius,
    required this.color,
  });

  final Offset start;
  final Offset end;
  final double duration;
  final double startRadius;
  final double endRadius;
  final Color color;

  double time = 0;

  double get progress => (time / duration).clamp(0.0, 1.0).toDouble();
}

class _FxFloatingText {
  _FxFloatingText({
    required this.text,
    required this.position,
    required this.drift,
    required this.color,
    required this.life,
  }) : maxLife = life;

  final String text;
  final Offset position;
  final Offset drift;
  final Color color;
  double life;
  final double maxLife;

  double get progress => 1 - (life / maxLife);
}

class _OptionalAudioService {
  final Set<String> _available = <String>{};
  final Map<String, int> _lastPlayMs = <String, int>{};
  bool _enabled = true;

  static const List<String> _cues = <String>[
    'assets/audio/hit.ogg',
    'assets/audio/break.ogg',
    'assets/audio/explosion.ogg',
    'assets/audio/pickup.ogg',
    'assets/audio/recall.ogg',
    'assets/audio/combo.ogg',
  ];

  Future<void> initialize() async {
    for (final cue in _cues) {
      try {
        await rootBundle.load(cue);
        _available.add(cue);
      } catch (_) {
        // Asset is optional.
      }
    }
  }

  void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  Future<void> play(
    String assetPath, {
    double volume = 1.0,
    int cooldownMs = 0,
  }) async {
    if (!_enabled || !_available.contains(assetPath)) {
      return;
    }

    final now = DateTime.now().millisecondsSinceEpoch;
    if (cooldownMs > 0) {
      final last = _lastPlayMs[assetPath] ?? 0;
      if (now - last < cooldownMs) {
        return;
      }
    }
    _lastPlayMs[assetPath] = now;

    try {
      await SystemSound.play(SystemSoundType.click);
    } catch (_) {
      // Ignore optional audio failure.
    }
  }

  Future<void> dispose() async {
    _available.clear();
    _lastPlayMs.clear();
  }
}
