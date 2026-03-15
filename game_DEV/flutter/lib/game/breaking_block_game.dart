import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as dart_ui;

import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flame/palette.dart';
import 'package:flame/text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';

import '../data/catalog_data.dart';
import '../models/augment_data.dart';
import '../models/boss_data.dart';
import '../models/character_data.dart';
import '../models/game_options.dart';
import '../models/playfield_layout.dart';
import '../services/debug_logger_service.dart';
import 'aim_preview_rules.dart';
import 'aim_visibility_rules.dart';
import 'ball_visibility_rules.dart';
import 'boss_spawn_rules.dart';
import 'board_fit_rules.dart';
import 'debug_flags.dart';
import 'deterministic_rng.dart';
import 'perf_rules.dart';
import 'render_layer_order.dart';
import 'run_goal_rules.dart';
import 'selftest_rules.dart';
import 'vfx_manager.dart';

class GameUiModel {
  const GameUiModel({
    required this.loop,
    required this.gold,
    required this.mana,
    required this.manaCost,
    required this.ownedBalls,
    required this.combo,
    required this.canUseSkill,
    required this.skillDisabledByBoss,
    required this.isTurnInProgress,
    required this.characterName,
    required this.activeAugmentIds,
    required this.runGoalTitle,
    required this.runGoalProgress,
    required this.runGoalCleared,
  });

  final int loop;
  final int gold;
  final int mana;
  final int manaCost;
  final int ownedBalls;
  final int combo;
  final bool canUseSkill;
  final bool skillDisabledByBoss;
  final bool isTurnInProgress;
  final String characterName;
  final List<String> activeAugmentIds;
  final String runGoalTitle;
  final String runGoalProgress;
  final bool runGoalCleared;

  GameUiModel copyWith({
    int? loop,
    int? gold,
    int? mana,
    int? manaCost,
    int? ownedBalls,
    int? combo,
    bool? canUseSkill,
    bool? skillDisabledByBoss,
    bool? isTurnInProgress,
    String? characterName,
    List<String>? activeAugmentIds,
    String? runGoalTitle,
    String? runGoalProgress,
    bool? runGoalCleared,
  }) {
    return GameUiModel(
      loop: loop ?? this.loop,
      gold: gold ?? this.gold,
      mana: mana ?? this.mana,
      manaCost: manaCost ?? this.manaCost,
      ownedBalls: ownedBalls ?? this.ownedBalls,
      combo: combo ?? this.combo,
      canUseSkill: canUseSkill ?? this.canUseSkill,
      skillDisabledByBoss: skillDisabledByBoss ?? this.skillDisabledByBoss,
      isTurnInProgress: isTurnInProgress ?? this.isTurnInProgress,
      characterName: characterName ?? this.characterName,
      activeAugmentIds: activeAugmentIds ?? this.activeAugmentIds,
      runGoalTitle: runGoalTitle ?? this.runGoalTitle,
      runGoalProgress: runGoalProgress ?? this.runGoalProgress,
      runGoalCleared: runGoalCleared ?? this.runGoalCleared,
    );
  }

  static const GameUiModel initial = GameUiModel(
    loop: 1,
    gold: 0,
    mana: 0,
    manaCost: 0,
    ownedBalls: 1,
    combo: 0,
    canUseSkill: false,
    skillDisabledByBoss: false,
    isTurnInProgress: false,
    characterName: '',
    activeAugmentIds: <String>[],
    runGoalTitle: '',
    runGoalProgress: '',
    runGoalCleared: false,
  );
}

class ComboToast {
  const ComboToast({required this.message, required this.color});

  final String message;
  final Color color;
}

class AugmentOffer {
  const AugmentOffer({
    required this.reason,
    required this.options,
    required this.source,
  });

  final String reason;
  final List<AugmentData> options;
  final AugmentOfferSource source;
}

class GameOverNotice {
  const GameOverNotice({required this.reachedLoop});

  final int reachedLoop;
}

enum AugmentOfferSource { runStart, bossClear }

enum _BlockType { normal, triangle, steel, cactus, bomb, ballPickup }

enum _TriangleCorner { topLeft, topRight, bottomRight, bottomLeft }

enum _BossSpecial { none, cactusReflect, bombDeath, steelShield }

enum _CollisionKind { wall, floor, block, boss }

enum _TurnState { aiming, firing, simulating, resolving }

class _SweepHit {
  _SweepHit({
    required this.toi,
    required this.normal,
    required this.point,
    required this.cellX,
    required this.cellY,
  });

  final double toi;
  final Vector2 normal;
  final Vector2 point;
  final int cellX;
  final int cellY;
}

class _CollisionEvent {
  _CollisionEvent({
    required this.toi,
    required this.normal,
    required this.point,
    required this.kind,
    required this.cellX,
    required this.cellY,
    this.block,
    this.boss,
  });

  final double toi;
  final Vector2 normal;
  final Vector2 point;
  final _CollisionKind kind;
  final int cellX;
  final int cellY;
  final _GridBlock? block;
  final _BossEntity? boss;
}

class _GridBlock {
  _GridBlock({
    required this.id,
    required this.type,
    required this.col,
    required this.row,
    required this.hp,
    this.triangleCorner = _TriangleCorner.bottomLeft,
    this.steelLocked = false,
  });

  final int id;
  final _BlockType type;
  int col;
  int row;
  int hp;
  _TriangleCorner triangleCorner;
  bool steelLocked;
  bool alive = true;

  bool get isSpecial =>
      type == _BlockType.steel ||
      type == _BlockType.cactus ||
      type == _BlockType.bomb;
}

class _BossEntity {
  _BossEntity({
    required this.bossId,
    required this.codexId,
    required this.grade,
    required this.width,
    required this.height,
    required this.col,
    required this.row,
    required this.hp,
    required this.special,
  }) : maxHp = hp;

  final int bossId;
  final String codexId;
  final BossTier grade;
  final int width;
  final int height;
  int col;
  int row;
  int hp;
  final int maxHp;
  final _BossSpecial special;
  bool alive = true;
  bool steelShieldActive = false;
}

class _BossSizeOption {
  const _BossSizeOption(this.width, this.height);

  final int width;
  final int height;
}

class _PooledBall {
  _PooledBall({required this.id, required this.radius});

  static const int trailCapacity = 16;

  final int id;
  double radius;
  final Vector2 position = Vector2.zero();
  final Vector2 velocity = Vector2(0, -1);
  double speed = 0;
  bool active = false;
  final List<Offset> trailPoints = List<Offset>.filled(
    trailCapacity,
    Offset.zero,
  );
  int trailHead = 0;
  int trailCount = 0;

  void resetTrail() {
    trailHead = 0;
    trailCount = 1;
    trailPoints[0] = Offset(position.x, position.y);
  }

  void clearTrail() {
    trailHead = 0;
    trailCount = 0;
  }

  void pushTrailPoint() {
    trailHead = (trailHead + 1) % trailCapacity;
    trailPoints[trailHead] = Offset(position.x, position.y);
    if (trailCount < trailCapacity) {
      trailCount += 1;
    }
  }

  Offset trailPointAt(int indexFromOldest) {
    final oldest = (trailHead - trailCount + 1 + trailCapacity) % trailCapacity;
    final index = (oldest + indexFromOldest) % trailCapacity;
    return trailPoints[index];
  }
}

class _BoardModel {
  _BoardModel({required this.cols, required this.rows});

  final int cols;
  final int rows;

  Rect boardRect = Rect.zero;
  double cellSize = 1;

  final List<_GridBlock> blocks = <_GridBlock>[];
  final Map<int, _GridBlock> cellIndex = <int, _GridBlock>{};
  final Map<int, int> bossCellIndex = <int, int>{};

  int cellKey(int col, int row) => (row * cols) + col;

  int colFromCellKey(int key) => key % cols;

  int rowFromCellKey(int key) => key ~/ cols;

  int worldToCellX(double x) => ((x - boardRect.left) / cellSize).floor();

  int worldToCellY(double y) => ((y - boardRect.top) / cellSize).floor();

  void clear() {
    blocks.clear();
    cellIndex.clear();
    bossCellIndex.clear();
  }

  void addBlock(_GridBlock block) {
    blocks.add(block);
    indexBlock(block);
  }

  void removeBlock(_GridBlock block) {
    removeIndex(block);
    block.alive = false;
  }

  void indexBlock(_GridBlock block) {
    if (!block.alive) {
      return;
    }
    cellIndex[cellKey(block.col, block.row)] = block;
  }

  void removeIndex(_GridBlock block) {
    cellIndex.remove(cellKey(block.col, block.row));
  }

  void rebuildIndex() {
    cellIndex.clear();
    for (final block in blocks) {
      if (!block.alive) {
        continue;
      }
      indexBlock(block);
    }
  }

  void purgeDeadBlocks() {
    blocks.removeWhere((block) => !block.alive);
    rebuildIndex();
  }

  bool isCellOccupied(int col, int row, {_BossEntity? boss}) {
    if (cellIndex.containsKey(cellKey(col, row))) {
      return true;
    }
    if (bossCellIndex.containsKey(cellKey(col, row))) {
      return true;
    }
    if (boss != null && boss.alive) {
      if (col >= boss.col &&
          col < boss.col + boss.width &&
          row >= boss.row &&
          row < boss.row + boss.height) {
        return true;
      }
    }
    return false;
  }

  bool isBossCell(int col, int row, {int? bossId}) {
    final id = bossCellIndex[cellKey(col, row)];
    if (id == null) {
      return false;
    }
    if (bossId == null) {
      return true;
    }
    return id == bossId;
  }

  void clearBossCells() {
    bossCellIndex.clear();
  }

  void setBossCells({
    required int bossId,
    required int col,
    required int row,
    required int width,
    required int height,
  }) {
    bossCellIndex.clear();
    for (var y = row; y < row + height; y++) {
      for (var x = col; x < col + width; x++) {
        if (x < 0 || x >= cols || y < 0 || y >= rows) {
          continue;
        }
        bossCellIndex[cellKey(x, y)] = bossId;
      }
    }
  }

  Rect blockRect(_GridBlock block) {
    return Rect.fromLTWH(
      boardRect.left + (block.col * cellSize),
      boardRect.top + (block.row * cellSize),
      cellSize,
      cellSize,
    );
  }

  Rect cellRect(int col, int row) {
    return Rect.fromLTWH(
      boardRect.left + (col * cellSize),
      boardRect.top + (row * cellSize),
      cellSize,
      cellSize,
    );
  }

  Rect bossRect(_BossEntity boss) {
    return Rect.fromLTWH(
      boardRect.left + (boss.col * cellSize),
      boardRect.top + (boss.row * cellSize),
      cellSize * boss.width,
      cellSize * boss.height,
    );
  }

  void collectSweepCandidates({
    required Vector2 p0,
    required Vector2 p1,
    required double radius,
    required List<_GridBlock> outBuffer,
  }) {
    outBuffer.clear();
    if (cellSize <= 0 || boardRect == Rect.zero) {
      return;
    }

    final minX = math.min(p0.x, p1.x) - radius;
    final maxX = math.max(p0.x, p1.x) + radius;
    final minY = math.min(p0.y, p1.y) - radius;
    final maxY = math.max(p0.y, p1.y) + radius;

    var x0 = worldToCellX(minX);
    var x1 = worldToCellX(maxX);
    var y0 = worldToCellY(minY);
    var y1 = worldToCellY(maxY);

    x0 = x0.clamp(0, cols - 1).toInt();
    x1 = x1.clamp(0, cols - 1).toInt();
    y0 = y0.clamp(0, rows - 1).toInt();
    y1 = y1.clamp(0, rows - 1).toInt();

    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        final block = cellIndex[cellKey(x, y)];
        if (block == null || !block.alive) {
          continue;
        }
        outBuffer.add(block);
      }
    }
  }

  void collectSweepBossCandidates({
    required Vector2 p0,
    required Vector2 p1,
    required double radius,
    required int bossId,
    required List<int> outBuffer,
  }) {
    outBuffer.clear();
    if (cellSize <= 0 || boardRect == Rect.zero) {
      return;
    }

    final minX = math.min(p0.x, p1.x) - radius;
    final maxX = math.max(p0.x, p1.x) + radius;
    final minY = math.min(p0.y, p1.y) - radius;
    final maxY = math.max(p0.y, p1.y) + radius;

    var x0 = worldToCellX(minX);
    var x1 = worldToCellX(maxX);
    var y0 = worldToCellY(minY);
    var y1 = worldToCellY(maxY);

    x0 = x0.clamp(0, cols - 1).toInt();
    x1 = x1.clamp(0, cols - 1).toInt();
    y0 = y0.clamp(0, rows - 1).toInt();
    y1 = y1.clamp(0, rows - 1).toInt();

    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        final key = cellKey(x, y);
        final hitBossId = bossCellIndex[key];
        if (hitBossId == null || hitBossId != bossId) {
          continue;
        }
        outBuffer.add(key);
      }
    }
  }
}

class _PhysicsStepper {
  _PhysicsStepper({required this.fixedDt, required this.maxStepsPerFrame});

  final double fixedDt;
  final int maxStepsPerFrame;

  double _accumulator = 0;

  void reset() {
    _accumulator = 0;
  }

  void simulate({
    required double dt,
    required bool Function(double fixedDt) onStep,
  }) {
    _accumulator += dt.clamp(0.0, 0.25).toDouble();

    var stepCount = 0;
    while (_accumulator >= fixedDt && stepCount < maxStepsPerFrame) {
      _accumulator -= fixedDt;
      stepCount += 1;

      final keepGoing = onStep(fixedDt);
      if (!keepGoing) {
        break;
      }
    }
  }
}

class _BoardRenderer {
  _BoardRenderer({required this.debugDraw})
    : _uncertainTextPainter = TextPainter(
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.center,
        maxLines: 1,
      );

  static const double _aimDashSpeedTilesPerSec = 6.0;
  static const double _aimDashLengthFactor = 0.34;
  static const double _aimGapLengthFactor = 0.20;

  bool debugDraw;
  bool useFancyAimGuide = true;
  dart_ui.Image? radialGlowImage;

  final TextPainter _uncertainTextPainter;
  final List<Offset> _guidePointsBuffer = <Offset>[];
  int _simpleGuideGeometryHash = 0;
  dart_ui.Picture? _simpleGuidePicture;

  final Paint boardBorderPaint = BasicPalette.white.paint()
    ..style = PaintingStyle.stroke
    ..strokeWidth = 2;
  final Paint gridPaint = Paint()
    ..color = const Color(0x22FFFFFF)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1;
  final Paint collectLinePaint = Paint()
    ..color = const Color(0x66FFD54F)
    ..strokeWidth = 2;
  final Paint deadzonePaint = Paint()
    ..color = const Color(0x99FF5252)
    ..strokeWidth = 3;
  final Paint launchPointPaint = Paint()..color = const Color(0xFFFFEE58);
  final Paint _aimMarkerStrokePaint = Paint()
    ..color = const Color(0xDDE2F1FF)
    ..style = PaintingStyle.stroke;
  final Paint _aimUncertainFillPaint = Paint()
    ..color = const Color(0xCC2B2B2B)
    ..style = PaintingStyle.fill;
  final Paint _aimCometCorePaint = Paint()
    ..color = const Color(0xFFF6FCFF)
    ..style = PaintingStyle.fill;
  final Paint _aimCometHaloPaint = Paint()
    ..color = const Color(0x6640C4FF)
    ..style = PaintingStyle.fill;
  final Paint _aimSimpleLinePaint = Paint()
    ..color = const Color(0xFFFDFEFF)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 3.4
    ..strokeCap = StrokeCap.round;
  final Paint _aimLandingFillPaint = Paint()
    ..color = const Color(0xCCFFF59D)
    ..style = PaintingStyle.fill;
  final Paint _aimLandingStrokePaint = Paint()
    ..color = const Color(0xFF5D4037)
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.3;

  void drawBase({
    required Canvas canvas,
    required _BoardModel board,
    required int deadzoneRow,
    required double bottomCollectY,
  }) {
    final framePaint = Paint()
      ..color = const Color(0x88FFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    canvas.drawRect(board.boardRect, framePaint);

    if (!debugDraw) {
      return;
    }

    canvas.drawRect(board.boardRect, boardBorderPaint);

    for (var c = 1; c < board.cols; c++) {
      final x = board.boardRect.left + (board.cellSize * c);
      canvas.drawLine(
        Offset(x, board.boardRect.top),
        Offset(x, board.boardRect.bottom),
        gridPaint,
      );
    }
    for (var r = 1; r < board.rows; r++) {
      final y = board.boardRect.top + (board.cellSize * r);
      canvas.drawLine(
        Offset(board.boardRect.left, y),
        Offset(board.boardRect.right, y),
        gridPaint,
      );
    }

    final deadzoneY = board.boardRect.top + (deadzoneRow * board.cellSize);
    canvas.drawLine(
      Offset(board.boardRect.left, deadzoneY),
      Offset(board.boardRect.right, deadzoneY),
      deadzonePaint,
    );
    canvas.drawLine(
      Offset(board.boardRect.left, bottomCollectY),
      Offset(board.boardRect.right, bottomCollectY),
      collectLinePaint,
    );
  }

  void drawLaunchPoint({
    required Canvas canvas,
    required double x,
    required double y,
    required double cellSize,
  }) {
    final center = Offset(x, y);
    final outer = math.max(9.0, cellSize * 0.25);
    final inner = math.max(6.0, cellSize * 0.17);
    final glow = math.max(14.0, cellSize * 0.36);

    canvas.drawCircle(center, glow, Paint()..color = const Color(0x4DFFE082));
    canvas.drawCircle(center, outer, Paint()..color = const Color(0xB3FFF176));
    canvas.drawCircle(center, inner, launchPointPaint);
    canvas.drawCircle(
      center,
      inner,
      Paint()
        ..color = const Color(0xE68D6E63)
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.2, cellSize * 0.025),
    );
    final cross = math.max(6.0, cellSize * 0.14);
    final crossPaint = Paint()
      ..color = const Color(0xE6FFFFFF)
      ..strokeWidth = math.max(1.3, cellSize * 0.026)
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(center.dx - cross, center.dy),
      Offset(center.dx + cross, center.dy),
      crossPaint,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - cross),
      Offset(center.dx, center.dy + cross),
      crossPaint,
    );
  }

  void drawAimGuide({
    required Canvas canvas,
    required bool isAiming,
    required double shotX,
    required double shotY,
    required Vector2 aimDirection,
    required double cellSize,
    required double elapsedTimeSec,
    required List<Offset> pathPoints,
    required List<Offset> bounceMarkers,
    required List<Offset> uncertainMarkers,
    required Offset? landingMarker,
    required Offset? firstHitMarker,
    required bool firstHitUncertain,
  }) {
    if (!isAiming) {
      return;
    }

    if (aimDirection.length2 <= 1e-10) {
      return;
    }

    final dir = Vector2.copy(aimDirection)..normalize();
    if (dir.y >= 0) {
      return;
    }

    _guidePointsBuffer
      ..clear()
      ..add(Offset(shotX, shotY))
      ..addAll(pathPoints);
    if (_guidePointsBuffer.length < 2) {
      _guidePointsBuffer.add(
        Offset(shotX + dir.x * (cellSize * 8), shotY + dir.y * (cellSize * 8)),
      );
    } else {
      var totalLength = 0.0;
      for (var i = 0; i < _guidePointsBuffer.length - 1; i++) {
        totalLength +=
            (_guidePointsBuffer[i + 1] - _guidePointsBuffer[i]).distance;
      }
      if (totalLength < 2.0) {
        _guidePointsBuffer
          ..clear()
          ..add(Offset(shotX, shotY))
          ..add(
            Offset(
              shotX + dir.x * (cellSize * 8),
              shotY + dir.y * (cellSize * 8),
            ),
          );
      }
    }

    if (useFancyAimGuide) {
      _drawAnimatedDashedGuide(
        canvas: canvas,
        points: _guidePointsBuffer,
        cellSize: cellSize,
        elapsedTimeSec: elapsedTimeSec,
      );
      _drawAimMarkers(
        canvas: canvas,
        bounceMarkers: bounceMarkers,
        uncertainMarkers: uncertainMarkers,
        cellSize: cellSize,
      );
      _drawCometHead(
        canvas: canvas,
        point: _guidePointsBuffer.last,
        cellSize: cellSize,
        elapsedTimeSec: elapsedTimeSec,
      );
    } else {
      _drawSimpleGuideLine(canvas: canvas, points: _guidePointsBuffer);
    }
    _drawLandingMarker(
      canvas: canvas,
      marker: landingMarker,
      cellSize: cellSize,
      elapsedTimeSec: elapsedTimeSec,
    );
    _drawFirstHitMarker(
      canvas: canvas,
      marker: firstHitMarker,
      uncertain: firstHitUncertain,
      cellSize: cellSize,
      elapsedTimeSec: elapsedTimeSec,
    );
  }

  void _drawSimpleGuideLine({
    required Canvas canvas,
    required List<Offset> points,
  }) {
    if (points.length < 2) {
      return;
    }
    final nextHash = computeAimPreviewPointsHash(points);
    final shouldRebuild =
        _simpleGuidePicture == null ||
        shouldRebuildAimPictureCache(
          previousHash: _simpleGuideGeometryHash,
          nextHash: nextHash,
        );
    if (shouldRebuild) {
      final recorder = dart_ui.PictureRecorder();
      final pictureCanvas = Canvas(recorder);
      for (var i = 0; i < points.length - 1; i++) {
        pictureCanvas.drawLine(points[i], points[i + 1], _aimSimpleLinePaint);
      }
      _simpleGuidePicture = recorder.endRecording();
      _simpleGuideGeometryHash = nextHash;
    }
    final picture = _simpleGuidePicture;
    if (picture != null) {
      canvas.drawPicture(picture);
    }
  }

  void _drawAnimatedDashedGuide({
    required Canvas canvas,
    required List<Offset> points,
    required double cellSize,
    required double elapsedTimeSec,
  }) {
    if (points.length < 2) {
      return;
    }

    final dashLength = math.max(6.0, cellSize * _aimDashLengthFactor);
    final gapLength = math.max(4.0, cellSize * _aimGapLengthFactor);
    final patternLength = dashLength + gapLength;
    var phase =
        (elapsedTimeSec * (_aimDashSpeedTilesPerSec * cellSize)) %
        patternLength;

    final glowPaint = Paint()
      ..color = const Color(0x7A40C4FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(3.4, cellSize * 0.22)
      ..strokeCap = StrokeCap.round;
    final corePaint = Paint()
      ..color = const Color(0xFFF1F9FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.9, cellSize * 0.09)
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < points.length - 1; i++) {
      final a = points[i];
      final b = points[i + 1];
      final dx = b.dx - a.dx;
      final dy = b.dy - a.dy;
      final segmentLength = math.sqrt((dx * dx) + (dy * dy));
      if (segmentLength <= 1e-5) {
        continue;
      }

      final ux = dx / segmentLength;
      final uy = dy / segmentLength;
      var segmentProgress = 0.0;

      while (segmentProgress < segmentLength - 1e-5) {
        final remainingPattern = patternLength - phase;
        final step = math.min(
          remainingPattern,
          segmentLength - segmentProgress,
        );
        if (step <= 1e-8) {
          break;
        }

        if (phase < dashLength) {
          final drawLength = math.min(step, dashLength - phase);
          final startDistance = segmentProgress;
          final endDistance = segmentProgress + drawLength;

          final start = Offset(
            a.dx + (ux * startDistance),
            a.dy + (uy * startDistance),
          );
          final end = Offset(
            a.dx + (ux * endDistance),
            a.dy + (uy * endDistance),
          );

          canvas.drawLine(start, end, glowPaint);
          canvas.drawLine(start, end, corePaint);
        }

        segmentProgress += step;
        phase += step;
        if (phase >= patternLength - 1e-8) {
          phase = 0;
        }
      }
    }
  }

  void _drawCometHead({
    required Canvas canvas,
    required Offset point,
    required double cellSize,
    required double elapsedTimeSec,
  }) {
    final pulse = 1 + (math.sin(elapsedTimeSec * 8.0) * 0.16);
    final haloRadius = math.max(6.0, cellSize * 0.30) * pulse;
    final coreRadius = math.max(2.5, cellSize * 0.11) * pulse;

    if (radialGlowImage != null) {
      final image = radialGlowImage!;
      final src = Rect.fromLTWH(
        0,
        0,
        image.width.toDouble(),
        image.height.toDouble(),
      );
      final dst = Rect.fromCircle(center: point, radius: haloRadius * 1.15);
      canvas.drawImageRect(
        image,
        src,
        dst,
        Paint()
          ..filterQuality = FilterQuality.medium
          ..colorFilter = const ColorFilter.mode(
            Color(0xAA5FCBFF),
            BlendMode.modulate,
          ),
      );
    } else {
      canvas.drawCircle(point, haloRadius, _aimCometHaloPaint);
    }

    canvas.drawCircle(point, coreRadius, _aimCometCorePaint);
  }

  void _drawAimMarkers({
    required Canvas canvas,
    required List<Offset> bounceMarkers,
    required List<Offset> uncertainMarkers,
    required double cellSize,
  }) {
    final bounceRadius = math.max(2.0, cellSize * 0.10);
    _aimMarkerStrokePaint.strokeWidth = math.max(1.2, cellSize * 0.040);
    for (final marker in bounceMarkers) {
      canvas.drawCircle(marker, bounceRadius, _aimMarkerStrokePaint);
    }

    final uncertainRadius = math.max(4.0, cellSize * 0.16);
    final questionFontSize = math.max(8.0, cellSize * 0.26);
    _uncertainTextPainter.text = TextSpan(
      text: '?',
      style: TextStyle(
        color: const Color(0xFFFFF59D),
        fontSize: questionFontSize,
        fontWeight: FontWeight.w800,
      ),
    );
    _uncertainTextPainter.layout(minWidth: 0, maxWidth: questionFontSize * 1.3);

    for (final marker in uncertainMarkers) {
      canvas.drawCircle(marker, uncertainRadius, _aimUncertainFillPaint);
      canvas.drawCircle(marker, uncertainRadius, _aimMarkerStrokePaint);
      final offset = Offset(
        marker.dx - (_uncertainTextPainter.width / 2),
        marker.dy - (_uncertainTextPainter.height / 2),
      );
      _uncertainTextPainter.paint(canvas, offset);
    }
  }

  void _drawLandingMarker({
    required Canvas canvas,
    required Offset? marker,
    required double cellSize,
    required double elapsedTimeSec,
  }) {
    if (marker == null) {
      return;
    }

    if (!useFancyAimGuide) {
      canvas.drawCircle(
        marker,
        math.max(2.6, cellSize * 0.09),
        _aimLandingFillPaint,
      );
      return;
    }

    final pulse = 1 + (math.sin(elapsedTimeSec * 7.4) * 0.12);
    final radius = math.max(4.0, cellSize * 0.16) * pulse;
    canvas.drawCircle(marker, radius + 1.6, _aimLandingStrokePaint);
    canvas.drawCircle(marker, radius, _aimLandingFillPaint);
  }

  void _drawFirstHitMarker({
    required Canvas canvas,
    required Offset? marker,
    required bool uncertain,
    required double cellSize,
    required double elapsedTimeSec,
  }) {
    if (marker == null) {
      return;
    }
    final pulse = 1 + (math.sin(elapsedTimeSec * 6.8) * 0.10);
    final radius = math.max(4.2, cellSize * 0.17) * pulse;
    final fill = uncertain ? const Color(0xFFD7CCC8) : const Color(0xFFFFF176);
    final stroke = uncertain
        ? const Color(0xFF5D4037)
        : const Color(0xFF1565C0);
    canvas.drawCircle(
      marker,
      radius + 2.1,
      Paint()
        ..color = stroke.withValues(alpha: 0.55)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.4,
    );
    canvas.drawCircle(marker, radius, Paint()..color = fill);
    canvas.drawCircle(
      marker,
      radius,
      Paint()
        ..color = stroke
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );
  }
}

class _SweptCollisionResolver {
  _SweptCollisionResolver();

  static const double _eps = 1e-9;

  _SweepHit? segmentVsExpandedAabb({
    required Vector2 p0,
    required Vector2 p1,
    required Rect aabb,
    required double radius,
    required int cellX,
    required int cellY,
  }) {
    final expanded = Rect.fromLTRB(
      aabb.left - radius,
      aabb.top - radius,
      aabb.right + radius,
      aabb.bottom + radius,
    );

    final d = p1 - p0;
    final dx = d.x;
    final dy = d.y;

    double xEnter;
    double xExit;
    if (dx.abs() <= _eps) {
      if (p0.x < expanded.left || p0.x > expanded.right) {
        return null;
      }
      xEnter = double.negativeInfinity;
      xExit = double.infinity;
    } else {
      final tx1 = (expanded.left - p0.x) / dx;
      final tx2 = (expanded.right - p0.x) / dx;
      xEnter = math.min(tx1, tx2);
      xExit = math.max(tx1, tx2);
    }

    double yEnter;
    double yExit;
    if (dy.abs() <= _eps) {
      if (p0.y < expanded.top || p0.y > expanded.bottom) {
        return null;
      }
      yEnter = double.negativeInfinity;
      yExit = double.infinity;
    } else {
      final ty1 = (expanded.top - p0.y) / dy;
      final ty2 = (expanded.bottom - p0.y) / dy;
      yEnter = math.min(ty1, ty2);
      yExit = math.max(ty1, ty2);
    }

    final tEnter = math.max(xEnter, yEnter);
    final tExit = math.min(xExit, yExit);

    if (tEnter > tExit) {
      return null;
    }
    if (tEnter < 0 || tEnter > 1) {
      return null;
    }
    if (tExit < 0) {
      return null;
    }

    final equalEnter = (xEnter - yEnter).abs() <= 1e-6;
    late Vector2 normal;
    if (equalEnter) {
      normal = Vector2(dx >= 0 ? -1 : 1, dy >= 0 ? -1 : 1);
    } else if ((tEnter - xEnter).abs() <= 1e-6) {
      normal = Vector2(dx >= 0 ? -1 : 1, 0);
    } else {
      normal = Vector2(0, dy >= 0 ? -1 : 1);
    }

    final point = p0 + (d * tEnter);
    return _SweepHit(
      toi: tEnter,
      normal: normal,
      point: point,
      cellX: cellX,
      cellY: cellY,
    );
  }

  _SweepHit? segmentVsExpandedRightTriangle({
    required Vector2 p0,
    required Vector2 p1,
    required Rect cellRect,
    required double radius,
    required int cellX,
    required int cellY,
    required _TriangleCorner corner,
  }) {
    final d = p1 - p0;
    final motionLen2 = d.length2;
    if (motionLen2 <= _eps) {
      return null;
    }

    final vertices = _triangleVertices(cellRect, corner);
    final edges = <(Vector2 a, Vector2 b)>[
      (vertices[0], vertices[1]),
      (vertices[1], vertices[2]),
      (vertices[2], vertices[0]),
    ];

    _SweepHit? best;

    void consider(double t, Vector2 candidateNormal) {
      if (t < -_eps || t > 1 + _eps) {
        return;
      }
      final nLen2 = candidateNormal.length2;
      if (nLen2 <= _eps) {
        return;
      }
      final normal = Vector2.copy(candidateNormal)..normalize();
      if (d.dot(normal) >= -_eps) {
        return;
      }
      final point = p0 + (d * t);
      if (best == null || t < best!.toi - 1e-6) {
        best = _SweepHit(
          toi: t.clamp(0.0, 1.0).toDouble(),
          normal: normal,
          point: point,
          cellX: cellX,
          cellY: cellY,
        );
      }
    }

    for (final edge in edges) {
      final a = edge.$1;
      final b = edge.$2;
      final e = b - a;
      final len2 = e.length2;
      if (len2 <= _eps) {
        continue;
      }

      final baseNormal = Vector2(-e.y, e.x)..normalize();
      for (final sign in <double>[1, -1]) {
        final normal = Vector2.copy(baseNormal)..scale(sign);
        final denom = d.dot(normal);
        if (denom.abs() <= _eps || denom >= -_eps) {
          continue;
        }
        final numer = radius - (p0 - a).dot(normal);
        final t = numer / denom;
        if (t < -_eps || t > 1 + _eps) {
          continue;
        }

        final q = p0 + (d * t);
        final u = (q - a).dot(e) / len2;
        if (u < -1e-6 || u > 1 + 1e-6) {
          continue;
        }

        final closest = a + (e * u.clamp(0.0, 1.0));
        final toward = q - closest;
        if (toward.length2 <= _eps) {
          continue;
        }
        consider(t, toward);
      }
    }

    final qa = motionLen2;
    for (final vertex in vertices) {
      final rel = p0 - vertex;
      final qb = 2 * rel.dot(d);
      final qc = rel.length2 - (radius * radius);
      final disc = (qb * qb) - (4 * qa * qc);
      if (disc < 0) {
        continue;
      }
      final sqrtDisc = math.sqrt(disc);
      final denom = 2 * qa;
      final roots = <double>[
        (-qb - sqrtDisc) / denom,
        (-qb + sqrtDisc) / denom,
      ];
      for (final t in roots) {
        if (t < -_eps || t > 1 + _eps) {
          continue;
        }
        final q = p0 + (d * t);
        final normal = q - vertex;
        if (normal.length2 <= _eps) {
          continue;
        }
        consider(t, normal);
      }
    }

    return best;
  }

  List<Vector2> _triangleVertices(Rect rect, _TriangleCorner corner) {
    switch (corner) {
      case _TriangleCorner.topLeft:
        return <Vector2>[
          Vector2(rect.left, rect.top),
          Vector2(rect.right, rect.top),
          Vector2(rect.left, rect.bottom),
        ];
      case _TriangleCorner.topRight:
        return <Vector2>[
          Vector2(rect.left, rect.top),
          Vector2(rect.right, rect.top),
          Vector2(rect.right, rect.bottom),
        ];
      case _TriangleCorner.bottomRight:
        return <Vector2>[
          Vector2(rect.right, rect.top),
          Vector2(rect.left, rect.bottom),
          Vector2(rect.right, rect.bottom),
        ];
      case _TriangleCorner.bottomLeft:
        return <Vector2>[
          Vector2(rect.left, rect.top),
          Vector2(rect.left, rect.bottom),
          Vector2(rect.right, rect.bottom),
        ];
    }
  }

  _CollisionEvent? findEarliestCollision({
    required _BoardModel board,
    required _BossEntity? boss,
    required _PooledBall ball,
    required Vector2 p0,
    required Vector2 p1,
    required double bottomCollectY,
    required Set<int> ignoredTriggerBlockIds,
    required List<_GridBlock> candidateBuffer,
    required List<int> bossCandidateBuffer,
  }) {
    _CollisionEvent? best;

    void consider(_CollisionEvent event) {
      if (event.toi < -_eps || event.toi > 1 + _eps) {
        return;
      }
      if (best == null || event.toi < best!.toi) {
        best = event;
      }
    }

    final d = p1 - p0;
    final leftBoundary = board.boardRect.left + ball.radius;
    final rightBoundary = board.boardRect.right - ball.radius;
    final topBoundary = board.boardRect.top + ball.radius;

    if (d.x < -_eps) {
      final t = (leftBoundary - p0.x) / d.x;
      if (t >= 0 && t <= 1) {
        final point = p0 + (d * t);
        if (point.y >= topBoundary - _eps && point.y <= bottomCollectY + _eps) {
          consider(
            _CollisionEvent(
              toi: t,
              normal: Vector2(1, 0),
              point: point,
              kind: _CollisionKind.wall,
              cellX: -1,
              cellY: -1,
            ),
          );
        }
      }
    } else if (d.x > _eps) {
      final t = (rightBoundary - p0.x) / d.x;
      if (t >= 0 && t <= 1) {
        final point = p0 + (d * t);
        if (point.y >= topBoundary - _eps && point.y <= bottomCollectY + _eps) {
          consider(
            _CollisionEvent(
              toi: t,
              normal: Vector2(-1, 0),
              point: point,
              kind: _CollisionKind.wall,
              cellX: -1,
              cellY: -1,
            ),
          );
        }
      }
    }

    if (d.y < -_eps) {
      final t = (topBoundary - p0.y) / d.y;
      if (t >= 0 && t <= 1) {
        final point = p0 + (d * t);
        if (point.x >= leftBoundary - _eps && point.x <= rightBoundary + _eps) {
          consider(
            _CollisionEvent(
              toi: t,
              normal: Vector2(0, 1),
              point: point,
              kind: _CollisionKind.wall,
              cellX: -1,
              cellY: -1,
            ),
          );
        }
      }
    }

    if (d.y > _eps) {
      final t = (bottomCollectY - p0.y) / d.y;
      if (t > _eps && t <= 1) {
        final point = p0 + (d * t);
        if (point.x >= leftBoundary - _eps && point.x <= rightBoundary + _eps) {
          consider(
            _CollisionEvent(
              toi: t,
              normal: Vector2.zero(),
              point: point,
              kind: _CollisionKind.floor,
              cellX: -1,
              cellY: -1,
            ),
          );
        }
      }
    }

    board.collectSweepCandidates(
      p0: p0,
      p1: p1,
      radius: ball.radius,
      outBuffer: candidateBuffer,
    );

    for (final block in candidateBuffer) {
      if (!block.alive) {
        continue;
      }
      if (block.type == _BlockType.ballPickup &&
          ignoredTriggerBlockIds.contains(block.id)) {
        continue;
      }

      final hit = block.type == _BlockType.triangle
          ? segmentVsExpandedRightTriangle(
              p0: p0,
              p1: p1,
              cellRect: board.blockRect(block),
              radius: ball.radius,
              cellX: block.col,
              cellY: block.row,
              corner: block.triangleCorner,
            )
          : segmentVsExpandedAabb(
              p0: p0,
              p1: p1,
              aabb: board.blockRect(block),
              radius: ball.radius,
              cellX: block.col,
              cellY: block.row,
            );
      if (hit == null) {
        continue;
      }

      consider(
        _CollisionEvent(
          toi: hit.toi,
          normal: hit.normal,
          point: hit.point,
          kind: _CollisionKind.block,
          cellX: hit.cellX,
          cellY: hit.cellY,
          block: block,
        ),
      );
    }

    if (boss != null && boss.alive) {
      board.collectSweepBossCandidates(
        p0: p0,
        p1: p1,
        radius: ball.radius,
        bossId: boss.bossId,
        outBuffer: bossCandidateBuffer,
      );
      for (final key in bossCandidateBuffer) {
        final col = board.colFromCellKey(key);
        final row = board.rowFromCellKey(key);
        final hit = segmentVsExpandedAabb(
          p0: p0,
          p1: p1,
          aabb: board.cellRect(col, row),
          radius: ball.radius,
          cellX: col,
          cellY: row,
        );
        if (hit == null) {
          continue;
        }
        consider(
          _CollisionEvent(
            toi: hit.toi,
            normal: hit.normal,
            point: hit.point,
            kind: _CollisionKind.boss,
            cellX: hit.cellX,
            cellY: hit.cellY,
            boss: boss,
          ),
        );
      }
    }

    return best;
  }
}

class BreakingBlockGame extends FlameGame {
  BreakingBlockGame({
    required this.character,
    required this.onGameOver,
    required this.onBossSeen,
    required this.onAugmentSeen,
    this.uiLanguage = UiLanguage.ko,
    this.onReplayShot,
    this.onReplayRecall,
    this.onReplaySkill,
    this.onReplayChooseAugment,
    this.onRunGoalReward,
    this.startingGoldBonus = 0,
    this.runSeed = 1,
    this.initialRngState,
    this.initialSnapshot,
    this.initialSimulationSpeed = 1,
    this.blockSkinStyleId = 'block_default',
    this.ballTrailStyleId = 'trail_default',
    this.debugDraw = false,
  });

  static const int boardCols = 8;
  static const int boardRows = 12;
  static const double _fixedStep = 1 / 120;
  static const int _maxFixedStepsPerFrame = 16;
  static const int maxBouncesPerStep = 3;
  static const double launchIntervalSec = 0.05;
  static const double _minLaunchAbsY = 0.15;
  static const double _minShootAngleDeg = 10;
  static const double _maxShootAngleDeg = 170;
  static const double _aimPreviewCastDistanceTiles = 22;
  static const double _pickupBobFrequencyHz = 1.8;
  static const double _cellFlashDurationSec = 0.10;
  static const double _turnDropAnimDurationSec = 0.19;
  static const double _minBallRadiusPx = 6.0;
  static final bool _selfTestByDefine = DebugFlags.selfTest;
  static final bool _ballDebugByDefine = DebugFlags.ballDebug;
  static final bool _layoutDebugByDefine = DebugFlags.layoutDebug;
  static final bool _aimSelfTestByDefine = DebugFlags.aimSelfTest;
  static final bool _boardFitSelfTestByDefine = DebugFlags.boardFitSelfTest;
  static final bool _aimVisibilitySelfTestByDefine =
      DebugFlags.aimVisibilitySelfTest;
  static final bool _perfDebugByDefine = DebugFlags.perfDebug;
  static final bool _perfSelfTestByDefine = DebugFlags.perfSelfTest;
  static final bool _bossSelfTestByDefine = DebugFlags.bossSelfTest;
  static final bool _vfxSelfTestByDefine = DebugFlags.vfxSelfTest;
  static const List<_BossSizeOption> _bossSizeOptions = <_BossSizeOption>[
    _BossSizeOption(2, 2),
    _BossSizeOption(3, 2),
    _BossSizeOption(3, 3),
  ];

  static const double baseFillRate = 0.8;
  static const int minimumInstantBallFromAugment = 1;
  static const int clearGoalLoop = 100;
  static const int clearGoalBosses = 5;
  static const int _goldPerBlockBreak = 1;
  static const int _goldPerBossKill = 25;
  static const int _goldPerTurnBase = 1;
  static const int _goldPerTurnComboDivisor = 8;

  final CharacterData character;
  final void Function(int reachedLoop) onGameOver;
  final void Function(String bossId) onBossSeen;
  final void Function(String augmentId) onAugmentSeen;
  final UiLanguage uiLanguage;
  final void Function(int angleMilliDeg, int turnIndex, int simTick)?
  onReplayShot;
  final void Function(int turnIndex, int simTick)? onReplayRecall;
  final void Function(String characterId, int turnIndex, int simTick)?
  onReplaySkill;
  final void Function(String augmentId, int turnIndex, int simTick)?
  onReplayChooseAugment;
  final void Function(int diamonds)? onRunGoalReward;
  final int startingGoldBonus;
  final int runSeed;
  final int? initialRngState;
  final Map<String, dynamic>? initialSnapshot;
  final int initialSimulationSpeed;
  final String blockSkinStyleId;
  final String ballTrailStyleId;
  final bool debugDraw;

  final ValueNotifier<GameUiModel> ui = ValueNotifier<GameUiModel>(
    GameUiModel.initial,
  );
  final ValueNotifier<ComboToast?> comboToast = ValueNotifier<ComboToast?>(
    null,
  );
  final ValueNotifier<AugmentOffer?> augmentOffer =
      ValueNotifier<AugmentOffer?>(null);
  final ValueNotifier<GameOverNotice?> gameOver =
      ValueNotifier<GameOverNotice?>(null);
  final ValueNotifier<int> turnResolvedTick = ValueNotifier<int>(0);

  late final DeterministicRng _rng;
  late final math.Random _vfxRng;
  final List<_PooledBall> _ballPool = <_PooledBall>[];
  final _BoardModel _boardModel = _BoardModel(cols: boardCols, rows: boardRows);
  final _PhysicsStepper _physicsStepper = _PhysicsStepper(
    fixedDt: _fixedStep,
    maxStepsPerFrame: _maxFixedStepsPerFrame,
  );
  final _SweptCollisionResolver _collisionResolver = _SweptCollisionResolver();
  final List<_GridBlock> _candidateBuffer = <_GridBlock>[];
  final List<int> _bossCandidateBuffer = <int>[];
  final Set<int> _ignoredTriggerBlockIdsBuffer = <int>{};
  final List<_GridBlock> _aimCandidateBuffer = <_GridBlock>[];
  final List<int> _aimBossCandidateBuffer = <int>[];
  final Set<int> _aimIgnoredTriggerIds = <int>{};
  final List<double> _cellFlashTimers = List<double>.filled(
    boardCols * boardRows,
    0,
  );
  final List<Offset> _aimPathPoints = <Offset>[];
  final List<Offset> _aimBounceMarkers = <Offset>[];
  final List<Offset> _aimUncertainMarkers = <Offset>[];
  Offset? _aimLandingMarker;
  Offset? _aimFirstHitMarker;
  bool _aimFirstHitUncertain = false;
  final Set<int> _newSpawnBlockIds = <int>{};
  final _PooledBall _aimPreviewBall = _PooledBall(id: -1, radius: 5);
  late final VfxManager _vfxManager;
  late final _BoardRenderer _boardRenderer;
  bool _didLoad = false;
  PlayfieldLayout? _playfieldLayoutOverride;
  Rect _playfieldRect = Rect.zero;

  _BossEntity? _boss;

  double _floorY = 0;
  double _shotY = 0;
  double _nextShotX = 0;
  double _visualElapsedSec = 0;

  late final TextPaint _hpTextPaint;
  late final TextPainter _tileLabelPainter;

  dart_ui.Image? _lockIconImage;
  dart_ui.Image? _bombIconImage;
  dart_ui.Image? _plusOneIconImage;
  dart_ui.Image? _perlinNoiseImage;
  dart_ui.Image? _aimHeadRadialImage;

  int _loop = 1;
  int _ownedBalls = 1;
  int _comboThisTurn = 0;
  int _mana = 0;
  int _launchCountThisTurn = 1;

  _TurnState _turnState = _TurnState.aiming;
  int _replayTurnIndex = 0;
  int _replaySimTick = 0;
  bool _isTurnActive = false;
  bool _isDraggingAim = false;
  int? _aimPointerId;
  bool _isGameOver = false;
  bool _pauseForChoice = false;

  int _pendingLaunchCount = 0;
  double _launchAccumulator = 0;

  final Vector2 _launchDirection = Vector2(0, -1);
  final Vector2 _aimPosition = Vector2.zero();
  final Vector2 _lastPointerPosWorld = Vector2.zero();
  final Vector2 _debugAimDirection = Vector2(0, -1);
  double _debugRawDx = 0;
  double _debugRawDy = -1;
  double _debugAngleRawBeforeDeg = 0;
  double _debugAngleRawAfterDeg = 90;
  double _debugAngleClampedDeg = 90;
  double _aimPredictLastMs = 0;
  double _aimPredictMaxMs = 0;
  double _aimPredictAvgMs = 0;
  int _aimPredictSampleCount = 0;
  int _aimPreviewSegmentCount = 0;
  int _aimPreviewBounceCount = 0;
  double _aimPreviewTotalLengthPx = 0;
  double _aimLastComputeSec = double.negativeInfinity;
  double _aimLastComputedAngleDeg = double.nan;
  bool _aimPreviewDirty = true;
  bool _aimSelfTestDone = false;
  double _aimSelfTestTimer = 0;
  bool _aimSelfTestLogged = false;
  bool _aimVisibilitySelfTestDone = false;
  double _aimVisibilitySelfTestTimer = 0;
  bool _boardFitSelfTestDone = false;
  double _boardFitSelfTestTimer = 0;
  bool _boardFitSelfTestLogged = false;
  bool _perfSelfTestDone = false;
  double _perfSelfTestTimer = 0;
  bool _perfSelfTestDragActive = false;
  bool _perfSelfTestRestorePause = false;
  _TurnState _perfSelfTestRestoreTurnState = _TurnState.aiming;
  bool _bossSelfTestDone = false;
  double _bossSelfTestTimer = 0;
  bool _vfxSelfTestDone = false;
  double _vfxSelfTestTimer = 0;

  double? _firstGroundX;
  bool _endedByRecallThisTurn = false;

  final Set<String> _activeAugmentIds = <String>{};
  int _pickupHitCounter = 0;
  int _bossDamageAccumulator = 0;
  int _runMaxCombo = 0;
  int _runBossKills = 0;
  int _runTotalBlocksBroken = 0;
  int _runBombBlocksBroken = 0;
  int _runBallPlusPickups = 0;
  int _runGold = 0;
  int _runMaxLoopReached = 1;
  RunGoalType _runGoal = RunGoalType.surviveLoop20;
  bool _runGoalCleared = false;
  final Set<int> _claimedMilestoneLoops = <int>{};
  double _turnDropAnimTimer = 0;
  double _turnDropAnimOffsetStart = 0;
  final Map<String, int> _augmentStacks = <String, int>{};
  final Map<String, int> _relicStacks = <String, int>{};

  int _blockIdSeed = 0;
  int _ballIdSeed = 0;
  int _bossIdSeed = 1;
  int _bossSpawnAttemptSeed = 0;
  String _bossSpawnDebug = '-';
  int _simSpeedMultiplier = 1;
  bool _fastForwardHeld = false;
  bool _bombChainActive = false;
  bool _selfTestDone = false;
  double _selfTestTimer = 0;
  String? _selfTestFailureReason;
  bool _selfTestOkLogged = false;
  bool _cameraInfoLogged = false;
  int _ballRenderCallCount = 0;
  double _ballBoundsProbeTimer = 0;
  final List<Offset> _ballScreenProbeBuffer = <Offset>[];
  bool _suppressAimFireForSelfTest = false;
  bool _frameTimingHookAttached = false;
  final List<double> _frameTimingsMs = <double>[];
  double _frameTimingLogTimer = 0;
  double _frameTimingP95Ms = 0;
  double _frameTimingWorstMs = 0;
  bool _vfxPerfDowngraded = false;

  bool _sfxEnabled = true;
  bool _vibrationEnabled = true;
  VfxIntensity _vfxIntensity = VfxIntensity.medium;
  AimLineStyle _aimLineStyle = AimLineStyle.simple;
  AimPreviewLength _aimPreviewLength = AimPreviewLength.standard;

  List<_GridBlock> get _blocks => _boardModel.blocks;

  Rect get _boardRect => _boardModel.boardRect;

  set _boardRect(Rect value) => _boardModel.boardRect = value;

  double get _cellSize => _boardModel.cellSize;

  set _cellSize(double value) => _boardModel.cellSize = value;

  double get _aimDeadzoneWorld => math.max(6.0, _cellSize * 0.2);

  int get _downShiftPerTurn => _isStrongBossDebuffActive ? 2 : 1;

  int get _deadzoneOffset {
    final bossOffset = _isStrongBossDebuffActive ? 1 : 0;
    final shieldBonus = _relicStack('relic_shield');
    return math.max(0, bossOffset - shieldBonus);
  }

  double get _ballSpeedMultiplier => 1 + (0.10 * _relicStack('relic_polish'));

  int get _extraGuaranteedPickupsFromRelic => _relicStack('relic_magnet');

  double get _aimPreviewDistanceTiles => _aimPreviewCastDistanceTiles;

  AimPreviewConfig get _aimPreviewConfig {
    final playfield = _playfieldRect == Rect.zero ? _boardRect : _playfieldRect;
    final height = playfield == Rect.zero
        ? (_cellSize * boardRows)
        : playfield.height;
    return resolveAimPreviewConfig(
      preset: _aimPreviewLength,
      playfieldHeightPx: math.max(120.0, height),
      hasFocusRelic: hasRelic('relic_focus'),
    );
  }

  bool get bossAlive => _boss != null && _boss!.alive;

  int get bossHp => _boss?.hp ?? 0;

  int get bossMaxHp => _boss?.maxHp ?? 0;

  String get bossGradeLabel {
    final boss = _boss;
    if (boss == null || !boss.alive) {
      return '-';
    }
    return _bossTierLabel(boss.grade);
  }

  int get runMaxCombo => _runMaxCombo;

  int get runBossKills => _runBossKills;

  int get runGold => _runGold;

  int get runTotalBlocksBroken => _runTotalBlocksBroken;

  int get runBombBlocksBroken => _runBombBlocksBroken;

  int get runBallPlusPickups => _runBallPlusPickups;

  int get runMaxLoopReached => _runMaxLoopReached;

  int get activeAugmentCount => _activeAugmentIds.length;

  RunGoalType get runGoal => _runGoal;

  bool get runGoalCleared => _runGoalCleared;

  String get runGoalTitle => localizedRunGoalTitle(_runGoal, uiLanguage);

  String get runGoalDescription =>
      localizedRunGoalDescription(_runGoal, uiLanguage);

  String get runGoalProgress => runGoalProgressText(
    goal: _runGoal,
    maxLoopReached: _runMaxLoopReached,
    bossesKilled: _runBossKills,
    maxComboReached: _runMaxCombo,
  );

  bool get runClearAchieved =>
      _runMaxLoopReached >= clearGoalLoop || _runBossKills >= clearGoalBosses;

  int get simulationSpeedMultiplier =>
      _fastForwardHeld ? 4 : _simSpeedMultiplier;

  int get rngState => _rng.state;
  int get replayTurnIndex => _replayTurnIndex;
  int get replaySimTick => _replaySimTick;

  bool get isBossApproachingTurn => !bossAlive && (_loop % 20 == 19);

  bool get showDebugHud => debugDraw;
  bool get selfTestEnabled => debugDraw || _selfTestByDefine;
  bool get _ballDebugEnabled => _ballDebugByDefine;
  bool get _showLayoutDebug => debugDraw || _layoutDebugByDefine;
  bool get _perfDiagnosticsEnabled =>
      debugDraw || _perfDebugByDefine || _perfSelfTestByDefine;
  bool get _bossDiagnosticsEnabled =>
      debugDraw || selfTestEnabled || _bossSelfTestByDefine || _showLayoutDebug;
  bool get _inputLockedForAim =>
      _pauseForChoice ||
      _isGameOver ||
      _isTurnActive ||
      isBoardTransitionAnimating;
  bool get _shouldShowAimPreview {
    return shouldShowAimPreview(
      AimVisibilityState(
        isAiming: _turnState == _TurnState.aiming,
        pointerDown: _aimPointerId != null && _isDraggingAim,
        dragStartedInBoard: _isDraggingAim,
        inputLocked: _inputLockedForAim,
      ),
    );
  }

  bool get showSelfTestBanner =>
      selfTestEnabled && _selfTestFailureReason != null;
  String get selfTestBannerText => _selfTestFailureReason == null
      ? ''
      : 'SELFTEST_FAIL: ${_selfTestFailureReason!}';

  bool get isBoardTransitionAnimating => _turnDropAnimTimer > 0;

  String get debugHudLine {
    final activeBalls = _activeBallCount();
    return 'DBG3 origin=(${_nextShotX.toStringAsFixed(1)},${_shotY.toStringAsFixed(1)}) '
        'board=(${_boardRect.top.toStringAsFixed(1)},${_boardRect.bottom.toStringAsFixed(1)}) '
        'pfr=(${_playfieldRect.top.toStringAsFixed(1)},${_playfieldRect.bottom.toStringAsFixed(1)}) '
        'cell=${_cellSize.toStringAsFixed(1)} '
        'ptr=(${_lastPointerPosWorld.x.toStringAsFixed(1)},${_lastPointerPosWorld.y.toStringAsFixed(1)}) '
        'state=${_turnStateLabel()} '
        'T$_replayTurnIndex/$_replaySimTick '
        'a=$activeBalls p=$_pendingLaunchCount '
        'balls=$_ownedBalls '
        'g=$_runGold spd=${simulationSpeedMultiplier}x blk=$_runTotalBlocksBroken '
        'raw=(${_debugRawDx.toStringAsFixed(2)},${_debugRawDy.toStringAsFixed(2)}) '
        'ang=${_debugAngleClampedDeg.toStringAsFixed(1)} '
        'aim=${_aimPathPoints.isNotEmpty ? 'on' : 'off'} '
        'bsp=$_bossSpawnDebug '
        'goal=${_runGoal.name}:${_runGoalCleared ? 'ok' : runGoalProgress} '
        'st=${_selfTestDone ? (_selfTestFailureReason == null ? 'ok' : 'fail') : 'wait'} '
        'ballR=$_ballRenderCallCount '
        'aimSeg=$_aimPreviewSegmentCount '
        'aimBnc=$_aimPreviewBounceCount '
        'aimLen=${_aimPreviewTotalLengthPx.toStringAsFixed(1)} '
        'aimMs=${_aimPredictLastMs.toStringAsFixed(2)}/${_aimPredictAvgMs.toStringAsFixed(2)}/${_aimPredictMaxMs.toStringAsFixed(2)} '
        'dir=(${_debugAimDirection.x.toStringAsFixed(2)},${_debugAimDirection.y.toStringAsFixed(2)}) '
        'evt=${_vfxManager.debugEventLabel}';
  }

  double get _turnDropProgress {
    if (_turnDropAnimTimer <= 0 || _turnDropAnimDurationSec <= 0) {
      return 1.0;
    }
    final raw = 1 - (_turnDropAnimTimer / _turnDropAnimDurationSec);
    return Curves.easeOutCubic.transform(raw.clamp(0.0, 1.0).toDouble());
  }

  double get _currentDropRenderOffsetY {
    if (_turnDropAnimTimer <= 0) {
      return 0.0;
    }
    return _turnDropAnimOffsetStart * (1 - _turnDropProgress);
  }

  double get _currentSpawnFade {
    if (_turnDropAnimTimer <= 0) {
      return 1.0;
    }
    return _turnDropProgress;
  }

  double _shotMinX() => _boardRect.left + (_cellSize * 0.5);

  double _shotMaxX() => _boardRect.right - (_cellSize * 0.5);

  double _sanitizeShotX(double value, {bool preferCenterForZero = false}) {
    if (_boardRect == Rect.zero || _cellSize <= 0) {
      if (!value.isFinite || value.isNaN) {
        return 0;
      }
      return value;
    }
    final centerX = _boardRect.center.dx;
    if (!value.isFinite || value.isNaN) {
      return centerX;
    }
    if (preferCenterForZero && value.abs() <= 1e-6) {
      return centerX;
    }
    return value.clamp(_shotMinX(), _shotMaxX()).toDouble();
  }

  void setSimulationSpeed(int multiplier) {
    final next = multiplier.clamp(1, 4).toInt();
    if (next != 1 && next != 2 && next != 4) {
      return;
    }
    _simSpeedMultiplier = next;
  }

  void setPlayfieldLayout(PlayfieldLayout layout) {
    final previous = _playfieldLayoutOverride;
    if (previous != null && previous.closeTo(layout)) {
      return;
    }
    _playfieldLayoutOverride = layout;
    try {
      final current = size;
      if (current.x > 0 && current.y > 0) {
        onGameResize(current);
      }
    } catch (_) {
      // Size is not available before GameWidget lays out.
    }
  }

  void setFastForwardHeld(bool held) {
    _fastForwardHeld = held;
  }

  int runRandomInt(int max) => _rng.nextInt(max);

  double runRandomDouble() => _rng.nextDouble();

  @override
  Future<void> onLoad() async {
    _rng = DeterministicRng(seed: runSeed);
    if (initialRngState != null) {
      _rng.state = initialRngState!;
    }
    _vfxRng = math.Random(runSeed ^ 0x9E3779B9);
    _simSpeedMultiplier = initialSimulationSpeed.clamp(1, 4).toInt();
    if (_simSpeedMultiplier != 1 &&
        _simSpeedMultiplier != 2 &&
        _simSpeedMultiplier != 4) {
      _simSpeedMultiplier = 1;
    }

    _hpTextPaint = TextPaint(
      style: const TextStyle(
        color: Colors.white,
        fontSize: 12,
        fontWeight: FontWeight.bold,
      ),
    );
    _tileLabelPainter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
      maxLines: 1,
    );
    _vfxManager = VfxManager(random: _vfxRng);
    await _vfxManager.initialize();
    _boardRenderer = _BoardRenderer(debugDraw: debugDraw);
    await _loadOptionalRenderAssets();
    _boardRenderer.radialGlowImage = _aimHeadRadialImage;
    _didLoad = true;
    _applyRuntimeOptionsToSystems();
    _attachFrameTimingCallback();

    for (var i = 0; i < 64; i++) {
      _ballPool.add(_PooledBall(id: _ballIdSeed++, radius: 5));
    }

    if (initialSnapshot != null) {
      _restoreSnapshot(initialSnapshot!);
      _syncUi();
    } else {
      _spawnInitialBoard();
      _syncUi();
      _offerAugments(
        reason: _tr(ko: '?쒖옉 利앷컯???좏깮?섏꽭??', en: 'Choose your starting augment.'),
        source: AugmentOfferSource.runStart,
      );
    }
  }

  String _tr({required String ko, required String en}) {
    return uiLanguage == UiLanguage.ko ? ko : en;
  }

  @override
  void onRemove() {
    _detachFrameTimingCallback();
    unawaited(_vfxManager.dispose());
    super.onRemove();
  }

  void _attachFrameTimingCallback() {
    if (_frameTimingHookAttached) {
      return;
    }
    SchedulerBinding.instance.addTimingsCallback(_handleFrameTimings);
    _frameTimingHookAttached = true;
  }

  void _detachFrameTimingCallback() {
    if (!_frameTimingHookAttached) {
      return;
    }
    SchedulerBinding.instance.removeTimingsCallback(_handleFrameTimings);
    _frameTimingHookAttached = false;
  }

  void _handleFrameTimings(List<FrameTiming> timings) {
    if (!_perfDiagnosticsEnabled || timings.isEmpty) {
      return;
    }
    for (final timing in timings) {
      final totalMs =
          (timing.buildDuration.inMicroseconds +
              timing.rasterDuration.inMicroseconds) /
          1000.0;
      _frameTimingsMs.add(totalMs);
    }
    if (_frameTimingsMs.length > 240) {
      _frameTimingsMs.removeRange(0, _frameTimingsMs.length - 240);
    }
  }

  void applyRuntimeOptions({
    required bool sfxEnabled,
    required bool vibrationEnabled,
    required VfxIntensity vfxIntensity,
    required AimLineStyle aimLineStyle,
    required AimPreviewLength aimPreviewLength,
  }) {
    _sfxEnabled = sfxEnabled;
    _vibrationEnabled = vibrationEnabled;
    _vfxIntensity = vfxIntensity;
    _aimLineStyle = aimLineStyle;
    _aimPreviewLength = aimPreviewLength;
    _aimPreviewDirty = true;

    if (_didLoad) {
      _applyRuntimeOptionsToSystems();
      if (_turnState == _TurnState.aiming && _shouldShowAimPreview) {
        _refreshDebugAimDirection(force: true);
      } else {
        _hideAimPreview();
      }
    }
  }

  void _applyRuntimeOptionsToSystems() {
    _boardRenderer.useFancyAimGuide = _aimLineStyle == AimLineStyle.fancy;
    _vfxManager.configure(
      sfxEnabled: _sfxEnabled,
      vibrationEnabled: _vibrationEnabled,
      intensity: _vfxIntensity,
    );
    _vfxManager.setPerfDegraded(_vfxPerfDowngraded);
  }

  Future<void> _loadOptionalRenderAssets() async {
    _aimHeadRadialImage = await _tryLoadOptionalImage(
      'assets/vfx/gradient_radial.png',
    );
    _perlinNoiseImage = await _tryLoadOptionalImage(
      'assets/vfx/perlin_noise.png',
    );
    _lockIconImage = await _tryLoadOptionalImage('assets/icons/lock.png');
    _bombIconImage = await _tryLoadOptionalImage('assets/icons/bomb.png');
    _plusOneIconImage = await _tryLoadOptionalImage('assets/icons/plus1.png');
  }

  Future<dart_ui.Image?> _tryLoadOptionalImage(String assetPath) async {
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

  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size);
    Rect nextPlayfieldRect;
    final override = _playfieldLayoutOverride;
    if (override != null) {
      nextPlayfieldRect = override.playfieldRect(Size(size.x, size.y));
    } else {
      final topHudReserve = (size.y * 0.145).clamp(120.0, 176.0).toDouble();
      final bottomHudReserve = (size.y * 0.285).clamp(212.0, 302.0).toDouble();
      nextPlayfieldRect = Rect.fromLTRB(
        0,
        topHudReserve,
        size.x,
        math.max(topHudReserve + 32, size.y - bottomHudReserve),
      );
    }
    _playfieldRect = nextPlayfieldRect;
    _cameraInfoLogged = false;
    _aimPreviewDirty = true;
    _aimLastComputeSec = double.negativeInfinity;

    final fit = computeBoardFit(
      playfieldRect: _playfieldRect,
      cols: boardCols,
      rows: boardRows,
      bottomAlign: true,
    );
    _cellSize = fit.tileSize;
    _boardRect = fit.boardRect;

    final targetRadius = resolveBallRadius(
      computedRadius: _cellSize * 0.15,
      minRadiusPx: _minBallRadiusPx,
    );
    final launchMargin = math.max(2.0, _cellSize * 0.03);
    final launchInset =
        targetRadius + launchMargin + math.max(8.0, _cellSize * 0.12);
    final preferredShotY = (_boardRect.bottom - launchInset)
        .clamp(
          _boardRect.top + targetRadius + launchMargin,
          _boardRect.bottom - targetRadius - launchMargin,
        )
        .toDouble();
    final spawn = computeSpawnInsidePlayfield(
      playfieldRect: _boardRect,
      preferredX: _nextShotX,
      preferredY: preferredShotY,
      radius: targetRadius,
      margin: launchMargin + 2,
    );
    _shotY = spawn.dy;
    _floorY = _boardRect.bottom + targetRadius + launchMargin;

    _nextShotX = _sanitizeShotX(spawn.dx, preferCenterForZero: true);

    for (final ball in _ballPool) {
      ball.radius = targetRadius;
      if (!ball.active) {
        ball.position.setValues(_nextShotX, _shotY);
      }
    }
    _aimPreviewBall.radius = targetRadius;

    if (!_isDraggingAim) {
      _lastPointerPosWorld.setValues(_nextShotX, _shotY - (_cellSize * 0.6));
      _aimPosition.setFrom(_lastPointerPosWorld);
      _hideAimPreview();
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    _ensureShotOriginState();
    _probeBallBounds(dt);
    _runSelfTestCheck(dt);
    _runAimSelfTestCheck(dt);
    _runAimVisibilitySelfTestCheck(dt);
    _runPerfSelfTestCheck(dt);
    _runBoardFitSelfTestCheck(dt);
    _runBossSelfTestCheck(dt);
    _runVfxSelfTestCheck(dt);
    _visualElapsedSec += dt;
    _updatePerfDiagnostics(dt);
    _vfxManager.update(dt);
    _updateCellFlashTimers(dt);
    _updateTurnDropAnimation(dt);

    final simDt = dt * simulationSpeedMultiplier;

    _physicsStepper.simulate(
      dt: simDt,
      onStep: (fixedDt) {
        if (_isGameOver || _pauseForChoice) {
          return false;
        }
        _simulateFixedStep(fixedDt);
        return !_isGameOver && !_pauseForChoice;
      },
    );
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    _ballRenderCallCount = 0;
    final safeShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    final shake = _vfxManager.shakeOffset;
    _boardRenderer.drawBase(
      canvas: canvas,
      board: _boardModel,
      deadzoneRow: boardRows - 1 - _deadzoneOffset,
      bottomCollectY: _floorY,
    );
    if (_showLayoutDebug && _playfieldRect != Rect.zero) {
      _drawLayoutDebugOverlay(canvas);
    }
    if (debugDraw && _playfieldRect != Rect.zero) {
      canvas.drawRect(
        _playfieldRect,
        Paint()
          ..color = const Color(0xAA4FC3F7)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4,
      );
    }
    canvas.save();
    if (shake.dx != 0 || shake.dy != 0) {
      // Keep board frame anchored; only animate gameplay layers.
      canvas.translate(shake.dx, shake.dy * 0.65);
    }
    canvas.save();
    canvas.clipRect(_boardRect.inflate(1));
    _drawBlocks(canvas);
    _drawBoss(canvas);
    canvas.restore();
    _vfxManager.render(
      canvas: canvas,
      boardRect: _boardRect,
      elapsedSec: _visualElapsedSec,
    );
    _boardRenderer.drawAimGuide(
      canvas: canvas,
      isAiming: _shouldShowAimPreview,
      shotX: safeShotX,
      shotY: _shotY,
      aimDirection: _debugAimDirection,
      cellSize: _cellSize,
      elapsedTimeSec: _visualElapsedSec,
      pathPoints: _aimPathPoints,
      bounceMarkers: _aimBounceMarkers,
      uncertainMarkers: _aimUncertainMarkers,
      landingMarker: _aimLandingMarker,
      firstHitMarker: _aimFirstHitMarker,
      firstHitUncertain: _aimFirstHitUncertain,
    );
    _drawBalls(canvas);
    _boardRenderer.drawLaunchPoint(
      canvas: canvas,
      x: safeShotX,
      y: _shotY,
      cellSize: _cellSize,
    );
    canvas.restore();
  }

  bool _canBeginAimAt(Offset position) {
    if (_pauseForChoice || _isGameOver || _isTurnActive) {
      return false;
    }
    if (isBoardTransitionAnimating) {
      return false;
    }
    if (_turnState != _TurnState.aiming) {
      return false;
    }
    if (_pendingLaunchCount != 0 || _activeBallCount() != 0) {
      return false;
    }
    return _boardRect.contains(position);
  }

  bool _isCurrentAimPointer(int pointerId) {
    return _aimPointerId != null && _aimPointerId == pointerId;
  }

  void handleAimPointerDown({
    required int pointerId,
    required Offset position,
  }) {
    if (_isDraggingAim || _aimPointerId != null) {
      return;
    }
    if (!_canBeginAimAt(position)) {
      return;
    }

    _isDraggingAim = true;
    _aimPointerId = pointerId;
    _turnState = _TurnState.aiming;
    _lastPointerPosWorld.setValues(position.dx, position.dy);
    _aimPosition.setFrom(_lastPointerPosWorld);
    _refreshDebugAimDirection(force: true);
  }

  void handleAimPointerMove({
    required int pointerId,
    required Offset position,
  }) {
    if (!_isCurrentAimPointer(pointerId)) {
      return;
    }
    if (!_isDraggingAim || _pauseForChoice || _isGameOver || _isTurnActive) {
      return;
    }
    if (_turnState != _TurnState.aiming) {
      return;
    }

    _lastPointerPosWorld.setValues(position.dx, position.dy);
    _aimPosition.setFrom(_lastPointerPosWorld);
    _refreshDebugAimDirection(force: true);
  }

  void handleAimPointerUp({required int pointerId, required Offset position}) {
    if (!_isCurrentAimPointer(pointerId)) {
      return;
    }

    _lastPointerPosWorld.setValues(position.dx, position.dy);
    _aimPosition.setFrom(_lastPointerPosWorld);
    _refreshDebugAimDirection(force: true);

    final shouldTryFire = _isDraggingAim;
    _isDraggingAim = false;
    _aimPointerId = null;
    _hideAimPreview(keepDirection: true);

    if (!shouldTryFire) {
      return;
    }

    if (_suppressAimFireForSelfTest) {
      return;
    }
    _tryFireFromLastPointer();
  }

  void handleAimPointerCancel({required int pointerId}) {
    if (!_isCurrentAimPointer(pointerId)) {
      return;
    }
    _isDraggingAim = false;
    _aimPointerId = null;
    _hideAimPreview();
  }

  void beginAim(Offset position) {
    handleAimPointerDown(pointerId: -1, position: position);
  }

  void updateAim(Offset position) {
    handleAimPointerMove(pointerId: _aimPointerId ?? -1, position: position);
  }

  void endAim() {
    handleAimPointerUp(
      pointerId: _aimPointerId ?? -1,
      position: Offset(_lastPointerPosWorld.x, _lastPointerPosWorld.y),
    );
  }

  bool replayShootByAngleMilliDeg(int angleMilliDeg) {
    if (_pauseForChoice || _isGameOver || _isTurnActive) {
      return false;
    }
    if (isBoardTransitionAnimating) {
      return false;
    }
    if (_turnState != _TurnState.aiming) {
      return false;
    }
    if ((_pendingLaunchCount + _activeBallCount()) != 0) {
      return false;
    }

    _nextShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    final angleDeg = (angleMilliDeg / 1000.0).clamp(
      _minShootAngleDeg,
      _maxShootAngleDeg,
    );
    final rad = angleDeg * math.pi / 180.0;
    final direction = Vector2(math.cos(rad), -math.sin(rad));
    if (direction.y >= 0) {
      direction.y = -math.max(direction.y.abs(), _minLaunchAbsY);
    }
    if (direction.y.abs() < _minLaunchAbsY) {
      final preservedSign = direction.x == 0 ? 1.0 : direction.x.sign;
      final clampedY = -_minLaunchAbsY;
      direction
        ..setValues(preservedSign * math.max(1e-4, direction.x.abs()), clampedY)
        ..normalize();
    } else {
      direction.normalize();
    }

    _debugAimDirection.setFrom(direction);
    _hideAimPreview(keepDirection: true);
    _startTurnWithDirection(direction);
    return true;
  }

  void _tryFireFromLastPointer() {
    if (_pauseForChoice || _isGameOver || _isTurnActive) {
      return;
    }
    if (isBoardTransitionAnimating) {
      return;
    }
    if (_turnState != _TurnState.aiming) {
      return;
    }
    if ((_pendingLaunchCount + _activeBallCount()) != 0) {
      return;
    }

    _nextShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    final shotDirection = computeClampedShotDir(
      shotOriginWorld: Vector2(_nextShotX, _shotY),
      pointerWorld: _lastPointerPosWorld,
      minShootAngleDeg: _minShootAngleDeg,
      maxShootAngleDeg: _maxShootAngleDeg,
      minAbsVy: _minLaunchAbsY,
      deadzoneWorld: _aimDeadzoneWorld,
    );
    if (shotDirection == null) {
      return;
    }

    // Final guard: keep launch x sign aligned with current pointer intent.
    final rawDx = _lastPointerPosWorld.x - _nextShotX;
    if (rawDx.abs() > 1e-6) {
      final intendedSign = rawDx < 0 ? -1.0 : 1.0;
      if (shotDirection.x.sign != intendedSign) {
        final safeY = shotDirection.y < 0
            ? shotDirection.y
            : -math.max(shotDirection.y.abs(), 1e-6);
        shotDirection
          ..setValues(
            intendedSign * math.max(shotDirection.x.abs(), 1e-6),
            safeY,
          )
          ..normalize();
      }
    }

    _debugAimDirection.setFrom(shotDirection);
    _hideAimPreview(keepDirection: true);
    _startTurnWithDirection(shotDirection);
  }

  bool useCharacterSkill() {
    if (_isGameOver || _pauseForChoice) {
      return false;
    }
    if (isBoardTransitionAnimating) {
      return false;
    }
    if (_isWeakBossDebuffActive) {
      return false;
    }
    if (_mana < character.skillManaCost) {
      return false;
    }

    _mana -= character.skillManaCost;

    switch (character.id) {
      case 'chocorone':
        _skillEngineer();
        break;
      case 'dos':
        _skillDesigner();
        break;
      case 'ratk':
        _skillRatK();
        break;
      case 'monsung':
        _skillBarbarian();
        break;
      case 'outer':
        _skillMerchant();
        break;
      default:
        break;
    }

    onReplaySkill?.call(character.id, _replayTurnIndex, _replaySimTick);
    _syncUi();
    return true;
  }

  bool forceRecall() {
    if (_isGameOver || _pauseForChoice || !_isTurnActive) {
      return false;
    }

    final recallStarts = <Vector2>[];
    double? closestX;
    var maxY = -1.0;
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      recallStarts.add(Vector2.copy(ball.position));
      if (ball.position.y > maxY) {
        maxY = ball.position.y;
        closestX = ball.position.x;
      }
      ball.active = false;
      ball.velocity.setZero();
      ball.speed = 0;
      ball.position.setValues(_nextShotX, _shotY);
      ball.clearTrail();
    }

    if (closestX != null) {
      _nextShotX = closestX
          .clamp(
            _boardRect.left + _cellSize * 0.5,
            _boardRect.right - _cellSize * 0.5,
          )
          .toDouble();
    }

    _vfxManager.onRecallPressed(
      ballPositions: recallStarts,
      bottomCollectY: _floorY,
    );

    _pendingLaunchCount = 0;
    _launchAccumulator = 0;
    _turnState = _TurnState.resolving;
    _endedByRecallThisTurn = true;
    onReplayRecall?.call(_replayTurnIndex, _replaySimTick);

    _finishTurn();
    return true;
  }

  bool selectAugment(String augmentId) {
    final offer = augmentOffer.value;
    if (offer == null) {
      return false;
    }

    final valid = offer.options.any((option) => option.id == augmentId);
    if (!valid) {
      return false;
    }

    _gainAugment(augmentId, markCodexSeen: true);

    _pauseForChoice = false;
    augmentOffer.value = null;
    overlays.remove('augmentPicker');

    onReplayChooseAugment?.call(augmentId, _replayTurnIndex, _replaySimTick);
    _syncUi();
    return true;
  }

  List<AugmentData> activeAugmentList() {
    return _activeAugmentIds.map(GameCatalog.augmentById).toList();
  }

  Map<String, int> get activeAugmentStacks =>
      Map<String, int>.from(_augmentStacks);

  Map<String, int> get activeRelicStacks => Map<String, int>.from(_relicStacks);

  bool hasRelic(String relicId) => (_relicStacks[relicId] ?? 0) > 0;

  int augmentStack(String augmentId) => _augmentStack(augmentId);

  int relicStack(String relicId) => _relicStack(relicId);

  bool canAcquireAugment(
    String augmentId, {
    int maxStack = 1,
    bool stackable = false,
  }) {
    final current = _augmentStack(augmentId);
    if (stackable) {
      return current < maxStack;
    }
    return current == 0;
  }

  bool addAugmentFromShop(
    String augmentId, {
    int maxStack = 1,
    bool stackable = false,
  }) {
    if (!canAcquireAugment(
      augmentId,
      maxStack: maxStack,
      stackable: stackable,
    )) {
      return false;
    }
    _gainAugment(augmentId, markCodexSeen: true);
    return true;
  }

  bool removeAugmentFromShop(String augmentId) {
    final current = _augmentStack(augmentId);
    if (current <= 0) {
      return false;
    }
    if (current <= 1) {
      _augmentStacks.remove(augmentId);
      _activeAugmentIds.remove(augmentId);
    } else {
      _augmentStacks[augmentId] = current - 1;
    }
    _syncUi();
    return true;
  }

  bool canAcquireRelic(
    String relicId, {
    int maxStack = 1,
    bool stackable = false,
  }) {
    final current = _relicStack(relicId);
    if (stackable) {
      return current < maxStack;
    }
    return current == 0;
  }

  bool addRelicFromShop(
    String relicId, {
    int maxStack = 1,
    bool stackable = false,
  }) {
    if (!canAcquireRelic(relicId, maxStack: maxStack, stackable: stackable)) {
      return false;
    }
    final current = _relicStack(relicId);
    _relicStacks[relicId] = current + 1;
    _syncUi();
    return true;
  }

  bool removeRelicFromShop(String relicId) {
    final current = _relicStack(relicId);
    if (current <= 0) {
      return false;
    }
    if (current <= 1) {
      _relicStacks.remove(relicId);
    } else {
      _relicStacks[relicId] = current - 1;
    }
    _syncUi();
    return true;
  }

  bool spendRunGold(int amount) {
    if (amount <= 0) {
      return true;
    }
    if (_runGold < amount) {
      return false;
    }
    _runGold -= amount;
    _syncUi();
    return true;
  }

  void addRunGold(int amount) {
    if (amount <= 0) {
      return;
    }
    _runGold += amount;
    _syncUi();
  }

  int _augmentStack(String augmentId) {
    final stored = _augmentStacks[augmentId];
    if (stored != null) {
      return stored;
    }
    return _activeAugmentIds.contains(augmentId) ? 1 : 0;
  }

  int _relicStack(String relicId) => _relicStacks[relicId] ?? 0;

  void _gainAugment(String augmentId, {required bool markCodexSeen}) {
    final stackable =
        augmentId == 'augment_more_bomb' || augmentId == 'augment_more_cactus';
    final maxStack = stackable ? 3 : 1;
    final current = _augmentStack(augmentId);
    if (current >= maxStack) {
      return;
    }

    _activeAugmentIds.add(augmentId);
    _augmentStacks[augmentId] = current + 1;
    if (markCodexSeen) {
      onAugmentSeen(augmentId);
    }

    if (augmentId == 'augment_instant_balls') {
      final gain = math.max(minimumInstantBallFromAugment, _loop ~/ 10);
      _ownedBalls += gain;
    }
  }

  void clearComboToast() {
    comboToast.value = null;
  }

  void clearGameOverNotice() {
    gameOver.value = null;
  }

  void ensureChoicePauseReleased() {
    if (_pauseForChoice && augmentOffer.value == null) {
      _pauseForChoice = false;
      if (_turnState != _TurnState.firing &&
          _turnState != _TurnState.simulating) {
        _turnState = _TurnState.aiming;
      }
      _syncUi();
    }
  }

  void restoreVisualStateAfterOverlayClose() {
    ensureChoicePauseReleased();
    _ensureShotOriginState();
    if (_turnState == _TurnState.aiming &&
        !_isDraggingAim &&
        !_isTurnActive &&
        _pendingLaunchCount == 0 &&
        _activeBallCount() == 0) {
      _lastPointerPosWorld.setValues(_nextShotX, _shotY - (_cellSize * 0.6));
      _aimPosition.setFrom(_lastPointerPosWorld);
      _hideAimPreview();
    }
  }

  void _spawnInitialBoard() {
    _boardModel.clear();
    _boss = null;
    _bossSpawnDebug = '-';
    _bossSpawnAttemptSeed = 0;
    _loop = 1;
    _runMaxLoopReached = 1;
    _ownedBalls = 1;
    _comboThisTurn = 0;
    _mana = 0;
    _launchCountThisTurn = 1;
    _pickupHitCounter = 0;
    _bossDamageAccumulator = 0;
    _runMaxCombo = 0;
    _runBossKills = 0;
    _runTotalBlocksBroken = 0;
    _runBombBlocksBroken = 0;
    _runBallPlusPickups = 0;
    _runGold = math.max(0, startingGoldBonus);
    _runGoal = selectRunGoalByRoll(_rng.nextInt(1 << 30));
    _runGoalCleared = false;
    _claimedMilestoneLoops.clear();
    final initialShotX = _boardRect != Rect.zero ? _boardRect.center.dx : 0.0;
    _nextShotX = _sanitizeShotX(initialShotX, preferCenterForZero: true);
    _turnState = _TurnState.aiming;
    _replayTurnIndex = 0;
    _replaySimTick = 0;
    _isTurnActive = false;
    _pendingLaunchCount = 0;
    _launchAccumulator = 0;
    _turnDropAnimTimer = 0;
    _turnDropAnimOffsetStart = 0;
    _newSpawnBlockIds.clear();
    _clearAimPreviewPath();
    _aimPreviewDirty = true;
    _aimLastComputeSec = double.negativeInfinity;
    _aimLastComputedAngleDeg = double.nan;
    _aimPredictLastMs = 0;
    _aimPredictMaxMs = 0;
    _aimPredictAvgMs = 0;
    _aimPredictSampleCount = 0;
    _selfTestDone = false;
    _selfTestTimer = 0;
    _selfTestFailureReason = null;
    _selfTestOkLogged = false;
    _aimSelfTestDone = false;
    _aimSelfTestTimer = 0;
    _aimSelfTestLogged = false;
    _boardFitSelfTestDone = false;
    _boardFitSelfTestTimer = 0;
    _boardFitSelfTestLogged = false;
    _vfxSelfTestDone = false;
    _vfxSelfTestTimer = 0;
    _claimedMilestoneLoops.clear();
    _activeAugmentIds.clear();
    _augmentStacks.clear();
    _relicStacks.clear();
    _bombChainActive = false;
    _physicsStepper.reset();
    for (final ball in _ballPool) {
      ball.active = false;
      ball.velocity.setZero();
      ball.speed = 0;
      ball.position.setValues(_nextShotX, _shotY);
      ball.clearTrail();
    }

    if (_boardRect != Rect.zero && _cellSize > 0) {
      _lastPointerPosWorld.setValues(_nextShotX, _shotY - (_cellSize * 0.6));
      _aimPosition.setFrom(_lastPointerPosWorld);
      _hideAimPreview();
    }

    _spawnTopRow();
    _spawnGuaranteedPickup();
  }

  void _startTurnWithDirection(Vector2 direction) {
    if (_pauseForChoice || _isGameOver) {
      return;
    }

    _isTurnActive = true;
    _turnState = _TurnState.firing;
    _isDraggingAim = false;
    _aimPointerId = null;
    _hideAimPreview(keepDirection: true);
    _comboThisTurn = 0;
    _endedByRecallThisTurn = false;
    _firstGroundX = null;

    _launchDirection
      ..setFrom(direction)
      ..normalize();
    _replayTurnIndex += 1;
    _replaySimTick = 0;
    final launchAngleDeg =
        (math.atan2(-_launchDirection.y, _launchDirection.x) * 180 / math.pi)
            .clamp(0.0, 180.0)
            .toDouble();
    onReplayShot?.call(
      (launchAngleDeg * 1000).round(),
      _replayTurnIndex,
      _replaySimTick,
    );

    _launchCountThisTurn = _effectiveBallCountThisTurn();
    _pendingLaunchCount = _launchCountThisTurn;
    _launchAccumulator = 0;
    if (_pendingLaunchCount > 0) {
      _launchBall();
    }
    if (_pendingLaunchCount == 0) {
      _turnState = _hasAnyActiveBall()
          ? _TurnState.simulating
          : _TurnState.resolving;
    }

    _syncUi();
  }

  int _effectiveBallCountThisTurn() {
    if (!_isMediumBossDebuffActive) {
      return _ownedBalls;
    }
    final reduced = _ownedBalls - (_loop ~/ 10);
    return math.max(1, reduced);
  }

  void _launchBall() {
    if (_pendingLaunchCount <= 0) {
      return;
    }

    _nextShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    final ball = _acquireBall();
    ball.active = true;
    ball.position.setValues(_nextShotX, _shotY);
    ball.speed = _cellSize * 18 * _ballSpeedMultiplier;
    ball.velocity
      ..setFrom(_launchDirection)
      ..normalize();
    ball.resetTrail();

    _pendingLaunchCount -= 1;
  }

  _PooledBall _acquireBall() {
    for (final ball in _ballPool) {
      if (!ball.active) {
        return ball;
      }
    }

    final ball = _PooledBall(
      id: _ballIdSeed++,
      radius: resolveBallRadius(
        computedRadius: _cellSize * 0.15,
        minRadiusPx: _minBallRadiusPx,
      ),
    );
    _ballPool.add(ball);
    return ball;
  }

  void _simulateFixedStep(double dt) {
    if (_isTurnActive) {
      _replaySimTick += 1;
    }
    _updateLaunch(dt);
    _updateBallsSwept(dt);

    if (!_isTurnActive) {
      return;
    }
    if (_turnState == _TurnState.firing) {
      return;
    }

    if ((_pendingLaunchCount + _activeBallCount()) == 0) {
      _turnState = _TurnState.resolving;
      _finishTurn();
    }
  }

  void _updateLaunch(double dt) {
    if (_turnState != _TurnState.firing) {
      return;
    }

    _launchAccumulator += dt;
    while (_pendingLaunchCount > 0 && _launchAccumulator >= launchIntervalSec) {
      _launchAccumulator -= launchIntervalSec;
      _launchBall();
    }

    if (_pendingLaunchCount == 0) {
      _turnState = _hasAnyActiveBall()
          ? _TurnState.simulating
          : _TurnState.resolving;
    }
  }

  void _updateBallsSwept(double dt) {
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      _ignoredTriggerBlockIdsBuffer.clear();
      _simulateBallMotionStep(ball, dt, _ignoredTriggerBlockIdsBuffer);
    }
  }

  void _simulateBallMotionStep(
    _PooledBall ball,
    double stepDt,
    Set<int> ignoredTriggerBlockIds,
  ) {
    var remainingDt = stepDt;
    var bounceCount = 0;

    while (remainingDt > 1e-6 &&
        ball.active &&
        bounceCount < maxBouncesPerStep) {
      final from = Vector2.copy(ball.position);
      final to = from + (ball.velocity * (ball.speed * remainingDt));
      final collision = _findEarliestCollision(
        ball: ball,
        from: from,
        to: to,
        ignoredTriggerBlockIds: ignoredTriggerBlockIds,
      );

      if (collision == null) {
        ball.position.setFrom(to);
        ball.pushTrailPoint();
        remainingDt = 0;
        continue;
      }

      ball.position.setFrom(collision.point);

      var bounced = false;
      if (collision.kind == _CollisionKind.floor) {
        _collectBall(ball);
        return;
      } else if (collision.kind == _CollisionKind.wall) {
        _reflectBallVelocity(ball, collision.normal);
        _nudgeAlongNormal(ball, collision.normal);
        _vfxManager.onBallBounce(collision.point);
        bounced = true;
      } else if (collision.kind == _CollisionKind.block) {
        final block = collision.block;
        if (block != null && block.alive) {
          bounced = _handleBlockCollision(
            ball: ball,
            block: block,
            normal: collision.normal,
            hitPoint: collision.point,
            ignoredTriggerBlockIds: ignoredTriggerBlockIds,
          );
        }
      } else if (collision.kind == _CollisionKind.boss) {
        final boss = collision.boss;
        if (boss != null && boss.alive) {
          bounced = _handleBossCollision(
            ball: ball,
            boss: boss,
            normal: collision.normal,
            hitPoint: collision.point,
          );
        }
      }

      if (bounced) {
        if (collision.kind == _CollisionKind.block ||
            collision.kind == _CollisionKind.boss) {
          _vfxManager.onBallBounce(collision.point);
        }
        bounceCount += 1;
      }
      if (ball.active) {
        ball.pushTrailPoint();
      }

      remainingDt = remainingDt * (1.0 - collision.toi);
      if (collision.toi <= 1e-6) {
        remainingDt -= 1e-6;
      }
      if (remainingDt < 0) {
        remainingDt = 0;
      }
    }

    if (ball.active && ball.position.y > (_floorY + 1e-6)) {
      _collectBall(ball);
    }
  }

  _CollisionEvent? _findEarliestCollision({
    required _PooledBall ball,
    required Vector2 from,
    required Vector2 to,
    required Set<int> ignoredTriggerBlockIds,
  }) {
    return _collisionResolver.findEarliestCollision(
      board: _boardModel,
      boss: _boss,
      ball: ball,
      p0: from,
      p1: to,
      bottomCollectY: _floorY,
      ignoredTriggerBlockIds: ignoredTriggerBlockIds,
      candidateBuffer: _candidateBuffer,
      bossCandidateBuffer: _bossCandidateBuffer,
    );
  }

  bool _handleBlockCollision({
    required _PooledBall ball,
    required _GridBlock block,
    required Vector2 normal,
    required Vector2 hitPoint,
    required Set<int> ignoredTriggerBlockIds,
  }) {
    if (block.type == _BlockType.ballPickup) {
      if (_isWeakBossDebuffActive) {
        ignoredTriggerBlockIds.add(block.id);
      } else {
        _consumeBallPickup(block);
      }
      _nudgeAlongVelocity(ball);
      return false;
    }

    _triggerCellFlash(block.col, block.row);
    _vfxManager.onBlockHit(
      cellCol: block.col,
      cellRow: block.row,
      position: hitPoint,
    );

    if (!(block.type == _BlockType.steel && block.steelLocked)) {
      final damage = _computeDamage(
        targetHp: block.hp,
        isSpecial: block.isSpecial,
        isBoss: false,
      );
      if (damage > 0) {
        _applyDamageToBlock(block, damage);
      }
    }

    if (block.type == _BlockType.cactus) {
      _bounceRandom(ball);
    } else {
      _reflectBallVelocity(ball, normal);
    }
    _nudgeAlongNormal(ball, normal);
    return true;
  }

  bool _handleBossCollision({
    required _PooledBall ball,
    required _BossEntity boss,
    required Vector2 normal,
    required Vector2 hitPoint,
  }) {
    _vfxManager.onBlockHit(cellCol: -1, cellRow: -1, position: hitPoint);

    if (!(boss.special == _BossSpecial.steelShield && boss.steelShieldActive)) {
      final damage = _computeDamage(
        targetHp: boss.hp,
        isSpecial: false,
        isBoss: true,
      );
      if (damage > 0) {
        _applyDamageToBoss(boss, damage);
      }
    }

    if (boss.special == _BossSpecial.cactusReflect) {
      _bounceRandom(ball);
    } else {
      _reflectBallVelocity(ball, normal);
    }
    _nudgeAlongNormal(ball, normal);
    return true;
  }

  void _consumeBallPickup(_GridBlock block) {
    _vfxManager.onPickupBallPlus(_cellCenter(block.col, block.row));
    _destroyBlock(block);
    _ownedBalls += 1;
    _runBallPlusPickups += 1;

    if (_activeAugmentIds.contains('augment_ball_triple')) {
      _pickupHitCounter += 1;
      while (_pickupHitCounter >= 3) {
        _pickupHitCounter -= 3;
        _ownedBalls += 1;
      }
    }
    _syncUi();
  }

  void _collectBall(_PooledBall ball) {
    _firstGroundX ??= ball.position.x;
    ball.active = false;
    ball.position.setValues(_nextShotX, _shotY);
    ball.velocity.setZero();
    ball.speed = 0;
  }

  int _computeDamage({
    required int targetHp,
    required bool isSpecial,
    required bool isBoss,
  }) {
    var damage = 1;

    if (_activeAugmentIds.contains('augment_special_plus1') && isSpecial) {
      damage += 1;
    }

    if (_activeAugmentIds.contains('augment_crit10') &&
        _rng.nextDouble() < 0.1) {
      damage *= 2;
    }

    if (_activeAugmentIds.contains('augment_hp100_double') && targetHp <= 100) {
      damage *= 2;
    }

    if (isBoss && _activeAugmentIds.contains('augment_boss_bonus')) {
      _bossDamageAccumulator += damage;
      while (_bossDamageAccumulator >= 100) {
        _bossDamageAccumulator -= 100;
        damage += 10;
      }
    }

    return damage;
  }

  void _applyDamageToBlock(_GridBlock block, int damage) {
    if (!block.alive) {
      return;
    }

    block.hp -= damage;
    if (block.hp > 0) {
      return;
    }

    _destroyBlock(block);
  }

  void _applyDamageToBoss(_BossEntity boss, int damage) {
    if (!boss.alive) {
      return;
    }

    boss.hp -= damage;
    if (boss.hp > 0) {
      return;
    }

    boss.hp = 0;
    boss.alive = false;
    _comboThisTurn += 1;
    _runBossKills += 1;
    _runGold += _goldPerBossKill;
    _applyRunProgressRewards();

    if (boss.special == _BossSpecial.bombDeath) {
      _triggerBossBombLikeDeath(boss);
    }

    comboToast.value = ComboToast(
      message: _tr(ko: '蹂댁뒪 泥섏튂!', en: 'Boss Cleared'),
      color: Colors.amberAccent,
    );
    _boss = null;
    _boardModel.clearBossCells();
    _bossSpawnDebug = 'cleared@loop=$_loop';
    _offerAugments(
      reason: _tr(
        ko: '蹂댁뒪瑜?泥섏튂?덉뒿?덈떎. ?ㅼ쓬 利앷컯???좏깮?섏꽭??',
        en: 'Boss down. Choose your next augment.',
      ),
      source: AugmentOfferSource.bossClear,
    );
    _syncUi();
  }

  void _destroyBlock(_GridBlock block) {
    if (!block.alive) {
      return;
    }

    final blockCenter = _cellCenter(block.col, block.row);
    _removeBlockIndex(block);
    block.alive = false;
    _newSpawnBlockIds.remove(block.id);
    _comboThisTurn += 1;
    if (block.type != _BlockType.ballPickup) {
      _runTotalBlocksBroken += 1;
      if (_bombChainActive) {
        _runBombBlocksBroken += 1;
      }
      _runGold += _goldPerBlockBreak;
    }

    _vfxManager.onBlockBreak(
      cellCol: block.col,
      cellRow: block.row,
      position: blockCenter,
      type: _toVfxBlockType(block.type),
    );

    if (block.type != _BlockType.ballPickup &&
        _boss != null &&
        _boss!.alive &&
        _boss!.special == _BossSpecial.steelShield) {
      _boss!.steelShieldActive = false;
    }

    _unlockAdjacentSteels(block.col, block.row);

    if (block.type == _BlockType.bomb) {
      _triggerBombExplosion(block.col, block.row);
    }

    _syncUi();
  }

  void _triggerBombExplosion(int centerCol, int centerRow) {
    final queue = <_GridBlock>[];

    for (final block in _blocks) {
      if (!block.alive || (block.col == centerCol && block.row == centerRow)) {
        continue;
      }
      if ((block.col - centerCol).abs() <= 1 &&
          (block.row - centerRow).abs() <= 1) {
        queue.add(block);
      }
    }

    var affectedCount = queue.length;

    final previousBombChainState = _bombChainActive;
    _bombChainActive = true;
    try {
      for (final target in queue) {
        if (!target.alive) {
          continue;
        }
        final reduced = target.hp ~/ 2;
        target.hp = reduced;
        if (target.hp <= 0) {
          _destroyBlock(target);
        }
      }
    } finally {
      _bombChainActive = previousBombChainState;
    }

    final boss = _boss;
    if (boss != null &&
        boss.alive &&
        _isCellAdjacentToBoss(centerCol, centerRow, boss)) {
      affectedCount += 1;
      final reduced = boss.hp ~/ 2;
      if (reduced <= 0) {
        _applyDamageToBoss(boss, boss.hp);
      } else {
        boss.hp = reduced;
      }
    }

    _vfxManager.onBombExplode(
      position: _cellCenter(centerCol, centerRow),
      affectedCellsCount: affectedCount,
    );

    final alchemyStack = _relicStack('relic_alchemy');
    if (alchemyStack > 0) {
      _runGold += (2 * alchemyStack);
      _syncUi();
    }
  }

  bool _isCellAdjacentToBoss(int col, int row, _BossEntity boss) {
    for (var c = boss.col; c < boss.col + boss.width; c++) {
      for (var r = boss.row; r < boss.row + boss.height; r++) {
        if ((c - col).abs() <= 1 && (r - row).abs() <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  void _triggerBossBombLikeDeath(_BossEntity boss) {
    final minCol = boss.col - 1;
    final maxCol = boss.col + boss.width;
    final minRow = boss.row - 1;
    final maxRow = boss.row + boss.height;

    final affected = <_GridBlock>[];
    for (final block in _blocks) {
      if (!block.alive || block.type == _BlockType.ballPickup) {
        continue;
      }
      if (block.col < minCol ||
          block.col > maxCol ||
          block.row < minRow ||
          block.row > maxRow) {
        continue;
      }

      final insideBoss =
          block.col >= boss.col &&
          block.col < boss.col + boss.width &&
          block.row >= boss.row &&
          block.row < boss.row + boss.height;
      if (insideBoss) {
        continue;
      }

      affected.add(block);
    }

    final previousBombChainState = _bombChainActive;
    _bombChainActive = true;
    try {
      for (final block in affected) {
        if (!block.alive) {
          continue;
        }
        block.hp = block.hp ~/ 2;
        if (block.hp <= 0) {
          _destroyBlock(block);
        }
      }
    } finally {
      _bombChainActive = previousBombChainState;
    }

    final bossRect = _bossRect(boss);
    _vfxManager.onBombExplode(
      position: Vector2(bossRect.center.dx, bossRect.center.dy),
      affectedCellsCount: affected.length,
    );
  }

  void _unlockAdjacentSteels(int col, int row) {
    for (final block in _blocks) {
      if (!block.alive ||
          block.type != _BlockType.steel ||
          !block.steelLocked) {
        continue;
      }
      if ((block.col - col).abs() <= 1 && (block.row - row).abs() <= 1) {
        block.steelLocked = false;
      }
    }
  }

  void _finishTurn() {
    if (!_isTurnActive) {
      return;
    }

    _turnState = _TurnState.resolving;
    _isTurnActive = false;
    _pendingLaunchCount = 0;
    _launchAccumulator = 0;

    if (!_endedByRecallThisTurn && _firstGroundX != null) {
      _nextShotX = _firstGroundX!
          .clamp(
            _boardRect.left + _cellSize * 0.5,
            _boardRect.right - _cellSize * 0.5,
          )
          .toDouble();
    }

    if (_endedByRecallThisTurn &&
        _activeAugmentIds.contains('augment_recall_aoe')) {
      _damageAllBlocks(10, includeBoss: true);
    }

    _applyManaGain();

    final downShiftAmount = _descendBlocksAndBoss();
    _loop += 1;
    if (_loop > _runMaxLoopReached) {
      _runMaxLoopReached = _loop;
    }
    _applyRunProgressRewards();

    _newSpawnBlockIds.clear();
    _spawnTopRow(markAsNew: true);
    _spawnGuaranteedPickup(markAsNew: true);
    for (var i = 0; i < _extraGuaranteedPickupsFromRelic; i++) {
      _spawnGuaranteedPickup(markAsNew: true);
    }
    _startTurnDropAnimation(downShiftAmount);

    if (_checkDeadzoneOrDeathSave()) {
      _syncUi();
      return;
    }

    final bossAlive = _boss?.alive ?? false;
    final shouldSpawn = shouldSpawnBoss(loop: _loop, bossAlive: bossAlive);
    final skipReason = bossSpawnSkipReason(loop: _loop, bossAlive: bossAlive);
    if (_bossDiagnosticsEnabled) {
      DebugLoggerService.instance.info(
        formatBossCheckLog(
          loop: _loop,
          bossAlive: bossAlive,
          shouldSpawn: shouldSpawn,
          reasonSkip: skipReason,
        ),
      );
    }
    if (shouldSpawn) {
      _spawnBossForLoop(spawnTiming: 'resolving_end');
    } else {
      _bossSpawnDebug = 'skip@loop=$_loop($skipReason)';
    }

    _turnState = _TurnState.aiming;
    _syncUi();
    turnResolvedTick.value += 1;
  }

  void _startTurnDropAnimation(int downShiftAmount) {
    if (downShiftAmount <= 0) {
      _turnDropAnimTimer = 0;
      _turnDropAnimOffsetStart = 0;
      return;
    }
    _turnDropAnimTimer = _turnDropAnimDurationSec;
    _turnDropAnimOffsetStart = -(_cellSize * downShiftAmount * 0.7);
  }

  void _applyManaGain() {
    if (_comboThisTurn > _runMaxCombo) {
      _runMaxCombo = _comboThisTurn;
    }
    final bonus = _tierBonus(_comboThisTurn);
    final gain = _comboThisTurn + 1 + bonus;
    _mana += gain;
    final turnGold =
        _goldPerTurnBase + (_comboThisTurn ~/ _goldPerTurnComboDivisor);
    _runGold += turnGold;

    final toast = ComboToast(
      message: 'Combo $_comboThisTurn / Mana +$gain / Gold +$turnGold',
      color: _tierColor(_comboThisTurn),
    );
    comboToast.value = toast;
    _vfxManager.onTurnResolved(
      combo: _comboThisTurn,
      manaGained: gain,
      boardRect: _boardRect,
    );
  }

  void _applyRunProgressRewards() {
    final milestone = evaluateMilestoneReward(
      loop: _runMaxLoopReached,
      claimedMilestones: _claimedMilestoneLoops,
    );
    if (milestone.reachedLoops.isNotEmpty) {
      _claimedMilestoneLoops.addAll(milestone.reachedLoops);
      _runGold += milestone.rewardGold;
      comboToast.value = ComboToast(
        message:
            '${_tr(ko: '\ub9c8\uc77c\uc2a4\ud1a4', en: 'Milestone')} '
            '${milestone.reachedLoops.join(', ')} '
            '${_tr(ko: '\ub2ec\uc131! \uace8\ub4dc', en: 'reached! Gold')} '
            '+${milestone.rewardGold}',
        color: const Color(0xFFFFD54F),
      );
    }

    if (_runGoalCleared) {
      return;
    }
    final cleared = isRunGoalCleared(
      goal: _runGoal,
      maxLoopReached: _runMaxLoopReached,
      bossesKilled: _runBossKills,
      maxComboReached: _runMaxCombo,
    );
    if (!cleared) {
      return;
    }
    _runGoalCleared = true;
    final definition = runGoalDefinition(_runGoal);
    _runGold += definition.rewardGold;
    if (definition.rewardDiamonds > 0) {
      onRunGoalReward?.call(definition.rewardDiamonds);
    }
    comboToast.value = ComboToast(
      message:
          '${_tr(ko: '\ub7f0 \ubaa9\ud45c \ub2ec\uc131!', en: 'Goal Cleared!')} '
          '+${definition.rewardGold}G '
          '+${definition.rewardDiamonds}D',
      color: const Color(0xFF9CCC65),
    );
  }

  int _tierBonus(int combo) {
    if (combo >= 70) {
      return 50;
    }
    if (combo >= 50) {
      return 40;
    }
    if (combo >= 30) {
      return 20;
    }
    if (combo >= 11) {
      return 10;
    }
    if (combo >= 6) {
      return 5;
    }
    return 0;
  }

  Color _tierColor(int combo) {
    if (combo >= 70) {
      return Colors.deepPurpleAccent;
    }
    if (combo >= 50) {
      return Colors.redAccent;
    }
    if (combo >= 30) {
      return Colors.orangeAccent;
    }
    if (combo >= 11) {
      return Colors.greenAccent;
    }
    if (combo >= 6) {
      return Colors.lightBlueAccent;
    }
    return Colors.white70;
  }

  int _descendBlocksAndBoss() {
    final descendAmount = _downShiftPerTurn;

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      block.row += descendAmount;
    }

    final boss = _boss;
    if (boss != null && boss.alive) {
      boss.row += descendAmount;
      _syncBossCellIndex();
    } else {
      _boardModel.clearBossCells();
    }

    _blocks.removeWhere((block) => !block.alive);
    _rebuildBlockIndex();
    return descendAmount;
  }

  bool _checkDeadzoneOrDeathSave() {
    final deadzoneRow = boardRows - 1 - _deadzoneOffset;

    var reached = false;

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      if (block.row >= deadzoneRow) {
        reached = true;
        break;
      }
    }

    final boss = _boss;
    if (!reached && boss != null && boss.alive) {
      if ((boss.row + boss.height - 1) >= deadzoneRow) {
        reached = true;
      }
    }

    if (!reached) {
      return false;
    }

    if (_activeAugmentIds.contains('augment_revive')) {
      removeAugmentFromShop('augment_revive');
      _clearBottomRows(3);
      return false;
    }

    _triggerGameOver();
    return true;
  }

  void _clearBottomRows(int rowCount) {
    final minRow = boardRows - rowCount;
    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      if (block.row >= minRow) {
        _removeBlockIndex(block);
        block.alive = false;
        _newSpawnBlockIds.remove(block.id);
      }
    }
    _blocks.removeWhere((block) => !block.alive);

    final boss = _boss;
    if (boss != null && boss.alive) {
      if ((boss.row + boss.height - 1) >= minRow) {
        boss.alive = false;
        _boss = null;
        _boardModel.clearBossCells();
      }
    }
  }

  void _triggerGameOver() {
    if (_isGameOver) {
      return;
    }

    _isGameOver = true;
    _isTurnActive = false;
    _turnState = _TurnState.resolving;
    _pendingLaunchCount = 0;
    _launchAccumulator = 0;
    _boardModel.clearBossCells();

    final reachedLoop = _runMaxLoopReached;
    onGameOver(reachedLoop);
    gameOver.value = GameOverNotice(reachedLoop: reachedLoop);
  }

  void _spawnTopRow({bool markAsNew = false}) {
    final fillRate = baseFillRate;
    final weights = _buildSpawnWeights();

    for (var col = 0; col < boardCols; col++) {
      if (_isCellOccupied(col, 0)) {
        continue;
      }

      if (_rng.nextDouble() > fillRate) {
        continue;
      }

      final type = _pickWeightedType(weights);
      final hp = _rollBlockHp(type);
      final block = _GridBlock(
        id: _blockIdSeed++,
        type: type,
        col: col,
        row: 0,
        hp: hp,
        triangleCorner: _rollTriangleCorner(type),
        steelLocked: type == _BlockType.steel,
      );
      _blocks.add(block);
      _indexBlock(block);
      if (markAsNew) {
        _newSpawnBlockIds.add(block.id);
      }
    }

    _blocks.removeWhere((block) => !block.alive);
  }

  List<MapEntry<_BlockType, int>> _buildSpawnWeights() {
    var bombWeight = 8;
    var cactusWeight = 8;

    bombWeight += (10 * _augmentStack('augment_more_bomb'));
    cactusWeight += (10 * _augmentStack('augment_more_cactus'));

    return <MapEntry<_BlockType, int>>[
      const MapEntry<_BlockType, int>(_BlockType.normal, 44),
      const MapEntry<_BlockType, int>(_BlockType.triangle, 30),
      const MapEntry<_BlockType, int>(_BlockType.steel, 10),
      MapEntry<_BlockType, int>(_BlockType.cactus, cactusWeight),
      MapEntry<_BlockType, int>(_BlockType.bomb, bombWeight),
    ];
  }

  _BlockType _pickWeightedType(List<MapEntry<_BlockType, int>> weights) {
    var total = 0;
    for (final pair in weights) {
      total += pair.value;
    }

    var roll = _rng.nextInt(total);
    for (final pair in weights) {
      if (roll < pair.value) {
        return pair.key;
      }
      roll -= pair.value;
    }

    return _BlockType.normal;
  }

  int _rollBlockHp(_BlockType type) {
    final base = math.max(1, (_loop * 0.9).floor());
    final variance = _rng.nextInt(math.max(2, (_loop * 0.35).ceil()));

    switch (type) {
      case _BlockType.normal:
      case _BlockType.triangle:
        return base + variance;
      case _BlockType.steel:
        return base + 2 + variance;
      case _BlockType.cactus:
      case _BlockType.bomb:
        return base + 1 + variance;
      case _BlockType.ballPickup:
        return 1;
    }
  }

  _TriangleCorner _rollTriangleCorner(_BlockType type) {
    if (type != _BlockType.triangle) {
      return _TriangleCorner.bottomLeft;
    }
    return _TriangleCorner.values[_rng.nextInt(_TriangleCorner.values.length)];
  }

  void _spawnGuaranteedPickup({bool markAsNew = false}) {
    final availableCols = <int>[];

    for (var c = 0; c < boardCols; c++) {
      if (!_isCellOccupied(c, 0)) {
        availableCols.add(c);
      }
    }

    if (availableCols.isEmpty) {
      final replaceCol = _rng.nextInt(boardCols);
      for (final block in _blocks) {
        if (!block.alive) {
          continue;
        }
        if (block.col == replaceCol && block.row == 0) {
          _removeBlockIndex(block);
          block.alive = false;
          _newSpawnBlockIds.remove(block.id);
        }
      }
      _blocks.removeWhere((block) => !block.alive);
      availableCols.add(replaceCol);
    }

    final col = availableCols[_rng.nextInt(availableCols.length)];
    final pickup = _GridBlock(
      id: _blockIdSeed++,
      type: _BlockType.ballPickup,
      col: col,
      row: 0,
      hp: 1,
    );
    _blocks.add(pickup);
    _indexBlock(pickup);
    if (markAsNew) {
      _newSpawnBlockIds.add(pickup.id);
    }
  }

  bool _isCellOccupied(int col, int row) {
    return _boardModel.isCellOccupied(col, row, boss: _boss);
  }

  void _syncBossCellIndex() {
    final boss = _boss;
    if (boss == null || !boss.alive) {
      _boardModel.clearBossCells();
      return;
    }
    _boardModel.setBossCells(
      bossId: boss.bossId,
      col: boss.col,
      row: boss.row,
      width: boss.width,
      height: boss.height,
    );
  }

  void _spawnBossForLoop({required String spawnTiming}) {
    if (_boss != null && _boss!.alive) {
      _bossSpawnDebug = 'skip_alive@$spawnTiming(loop=$_loop)';
      return;
    }

    final size = _bossSizeOptions[_rng.nextInt(_bossSizeOptions.length)];
    final grade = BossTier.values[_rng.nextInt(BossTier.values.length)];
    final codexId = _pickBossCodexId(
      grade: grade,
      width: size.width,
      height: size.height,
    );
    final hp = _calculateBossHp(
      loop: _loop,
      tier: grade,
      width: size.width,
      height: size.height,
    );
    final special = grade == BossTier.medium
        ? _rollMediumBossSpecial()
        : _BossSpecial.none;
    final preferredCol = (((boardCols - size.width) / 2).floor())
        .clamp(0, boardCols - size.width)
        .toInt();
    const preferredRow = 0;
    final occupiedCellKeys = <int>{};
    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      occupiedCellKeys.add((block.row * boardCols) + block.col);
    }
    final placement = planBossSpawnPlacement(
      boardCols: boardCols,
      boardRows: boardRows,
      bossWidth: size.width,
      bossHeight: size.height,
      preferredCol: preferredCol,
      preferredRow: preferredRow,
      occupiedCellKeys: occupiedCellKeys,
    );
    final spawnCol = placement.col;
    final spawnRow = placement.row;
    var forcedPlacement = placement.forced;

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      final overlapsBossSpawn =
          block.col >= spawnCol &&
          block.col < spawnCol + size.width &&
          block.row >= spawnRow &&
          block.row < spawnRow + size.height;
      if (overlapsBossSpawn) {
        _removeBlockIndex(block);
        block.alive = false;
        _newSpawnBlockIds.remove(block.id);
        forcedPlacement = true;
      }
    }
    _blocks.removeWhere((block) => !block.alive);

    final boss = _BossEntity(
      bossId: _bossIdSeed++,
      codexId: codexId,
      grade: grade,
      width: size.width,
      height: size.height,
      col: spawnCol,
      row: spawnRow,
      hp: hp,
      special: special,
    );

    if (special == _BossSpecial.steelShield) {
      boss.steelShieldActive = true;
    }

    _boss = boss;
    _syncBossCellIndex();
    final attempt = ++_bossSpawnAttemptSeed;
    final bossRect = _bossRect(boss);
    _bossSpawnDebug =
        'spawn@$spawnTiming(loop=$_loop,size=${boss.width}x${boss.height},grade=${_bossTierLabel(boss.grade)},forced=$forcedPlacement)';
    if (_bossDiagnosticsEnabled) {
      DebugLoggerService.instance.info(
        formatBossSpawnLog(
          attempt: attempt,
          forced: forcedPlacement,
          rect: bossRect,
          timing: spawnTiming,
          loop: _loop,
        ),
      );
    }
    onBossSeen(codexId);
  }

  String _pickBossCodexId({
    required BossTier grade,
    required int width,
    required int height,
  }) {
    final exact = GameCatalog.bosses
        .where(
          (boss) =>
              boss.tier == grade &&
              boss.width == width &&
              boss.height == height,
        )
        .toList();
    if (exact.isNotEmpty) {
      return exact[_rng.nextInt(exact.length)].id;
    }

    final sameGrade = GameCatalog.bosses
        .where((boss) => boss.tier == grade)
        .toList();
    if (sameGrade.isNotEmpty) {
      return sameGrade[_rng.nextInt(sameGrade.length)].id;
    }

    final sameSize = GameCatalog.bosses
        .where((boss) => boss.width == width && boss.height == height)
        .toList();
    if (sameSize.isNotEmpty) {
      return sameSize[_rng.nextInt(sameSize.length)].id;
    }

    return GameCatalog.bosses.first.id;
  }

  int _calculateBossHp({
    required int loop,
    required BossTier tier,
    required int width,
    required int height,
  }) {
    final sizeFactor = (width * height) / 4;
    switch (tier) {
      case BossTier.weak:
        return (loop * 1.5 * sizeFactor).ceil();
      case BossTier.medium:
        return (loop * 2.0 * sizeFactor).ceil();
      case BossTier.strong:
        return (loop * 3.0 * sizeFactor).ceil();
    }
  }

  _BossSpecial _rollMediumBossSpecial() {
    final options = <_BossSpecial>[
      _BossSpecial.cactusReflect,
      _BossSpecial.bombDeath,
      _BossSpecial.steelShield,
    ];
    return options[_rng.nextInt(options.length)];
  }

  bool get _isWeakBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.grade == BossTier.weak;
  }

  bool get _isMediumBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.grade == BossTier.medium;
  }

  bool get _isStrongBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.grade == BossTier.strong;
  }

  void _offerAugments({
    required String reason,
    required AugmentOfferSource source,
  }) {
    final options = _rollAugmentOptions();
    if (options.isEmpty) {
      return;
    }

    _pauseForChoice = true;
    augmentOffer.value = AugmentOffer(
      reason: reason,
      options: options,
      source: source,
    );
    overlays.add('augmentPicker');
  }

  List<AugmentData> _rollAugmentOptions() {
    final pool = List<AugmentData>.from(GameCatalog.augments)
      ..removeWhere((augment) => augment.shopOnly)
      ..removeWhere((augment) => _activeAugmentIds.contains(augment.id));

    if (pool.length < 3) {
      for (final augment in GameCatalog.augments) {
        if (!pool.any((candidate) => candidate.id == augment.id)) {
          pool.add(augment);
        }
      }
    }

    final options = <AugmentData>[];
    while (options.length < 3 && pool.isNotEmpty) {
      final index = _rng.nextInt(pool.length);
      options.add(pool.removeAt(index));
    }

    return options;
  }

  void _damageAllBlocks(int damage, {required bool includeBoss}) {
    for (final block in _blocks) {
      if (!block.alive || block.type == _BlockType.ballPickup) {
        continue;
      }
      if (block.type == _BlockType.steel && block.steelLocked) {
        continue;
      }
      block.hp -= damage;
      if (block.hp <= 0) {
        _destroyBlock(block);
      }
    }

    final boss = _boss;
    if (includeBoss && boss != null && boss.alive) {
      _applyDamageToBoss(boss, damage);
    }
  }

  void _skillEngineer() {
    _GridBlock? lowest;
    for (final block in _blocks) {
      if (!block.alive || block.type == _BlockType.ballPickup) {
        continue;
      }
      if (lowest == null || block.row > lowest.row) {
        lowest = block;
      }
    }

    if (lowest == null) {
      return;
    }

    final targetRow = lowest.row;
    final rowBlocks = <_GridBlock>[];
    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      if (block.row == targetRow) {
        rowBlocks.add(block);
      }
    }

    for (final block in rowBlocks) {
      _destroyBlock(block);
    }
  }

  void _skillDesigner() {
    _damageAllBlocks(10, includeBoss: false);
  }

  void _skillRatK() {
    final targets = <_GridBlock>[];
    for (final block in _blocks) {
      if (!block.alive || block.type == _BlockType.ballPickup) {
        continue;
      }
      targets.add(block);
    }

    var count = 0;
    while (count < 3 && targets.isNotEmpty) {
      final i = _rng.nextInt(targets.length);
      final target = targets.removeAt(i);
      _destroyBlock(target);
      count += 1;
    }
  }

  void _skillBarbarian() {
    final damage = math.max(1, (_loop * 0.1).ceil());
    _damageAllBlocks(damage, includeBoss: true);
  }

  void _skillMerchant() {
    _ownedBalls += 1;
  }

  void _reflectBallVelocity(_PooledBall ball, Vector2 surfaceNormal) {
    const normalEps = 1e-9;
    if (surfaceNormal.x.abs() <= normalEps &&
        surfaceNormal.y.abs() <= normalEps) {
      return;
    }

    if (surfaceNormal.x.abs() > normalEps) {
      ball.velocity.x = -ball.velocity.x;
    }
    if (surfaceNormal.y.abs() > normalEps) {
      ball.velocity.y = -ball.velocity.y;
    }
    _stabilizeBallVelocity(ball);
  }

  void _nudgeAlongNormal(_PooledBall ball, Vector2 surfaceNormal) {
    const normalEps = 1e-9;
    if (surfaceNormal.x.abs() <= normalEps &&
        surfaceNormal.y.abs() <= normalEps) {
      return;
    }
    final normal = Vector2(
      surfaceNormal.x == 0 ? 0 : surfaceNormal.x.sign,
      surfaceNormal.y == 0 ? 0 : surfaceNormal.y.sign,
    );
    ball.position.add(normal * (_cellSize * 0.001));
  }

  void _nudgeAlongVelocity(_PooledBall ball) {
    final direction = Vector2.copy(ball.velocity);
    if (direction.length2 <= 1e-12) {
      return;
    }
    direction.normalize();
    ball.position.add(direction * (_cellSize * 0.001));
  }

  void _bounceRandom(_PooledBall ball) {
    const minComponent = 0.25;
    const maxAttempts = 16;

    for (var i = 0; i < maxAttempts; i++) {
      final x = (_rng.nextDouble() * 2) - 1;
      final y = (_rng.nextDouble() * 2) - 1;
      if (x.abs() <= 1e-9 && y.abs() <= 1e-9) {
        continue;
      }
      final candidate = Vector2(x, y)..normalize();
      if (candidate.x.abs() >= minComponent &&
          candidate.y.abs() >= minComponent) {
        ball.velocity.setFrom(candidate);
        _stabilizeBallVelocity(ball);
        return;
      }
    }

    var vx = ball.velocity.x;
    var vy = ball.velocity.y;
    if (vx.abs() <= 1e-9 && vy.abs() <= 1e-9) {
      vx = _rng.nextBool() ? 1 : -1;
      vy = -1;
    }
    if (vx.abs() < minComponent) {
      vx = (vx >= 0 ? 1 : -1) * minComponent;
    }
    if (vy.abs() < minComponent) {
      vy = (vy >= 0 ? 1 : -1) * minComponent;
    }

    final clamped = Vector2(vx, vy)..normalize();
    ball.velocity.setFrom(clamped);
    _stabilizeBallVelocity(ball);
  }

  void _stabilizeBallVelocity(_PooledBall ball) {
    var vx = ball.velocity.x;
    var vy = ball.velocity.y;

    final dirLength = ball.velocity.length;
    if (dirLength <= 0) {
      ball.velocity.setValues(0, -1);
      return;
    }

    vx /= dirLength;
    vy /= dirLength;

    final minRatio = 0.25;
    if (vx.abs() < minRatio) {
      vx = vx < 0 ? -minRatio : minRatio;
    }
    if (vy.abs() < minRatio) {
      vy = vy < 0 ? -minRatio : minRatio;
    }

    final normalized = Vector2(vx, vy)..normalize();
    ball.velocity.setFrom(normalized);
  }

  void _refreshDebugAimDirection({bool force = false}) {
    if (!force &&
        !shouldComputeAimPreview(
          isAiming: _turnState == _TurnState.aiming,
          isDragging: _isDraggingAim,
          inputLocked: _inputLockedForAim,
        )) {
      _hideAimPreview();
      return;
    }

    final direction = computeClampedShotDir(
      shotOriginWorld: Vector2(_nextShotX, _shotY),
      pointerWorld: _lastPointerPosWorld,
      minShootAngleDeg: _minShootAngleDeg,
      maxShootAngleDeg: _maxShootAngleDeg,
      minAbsVy: _minLaunchAbsY,
      deadzoneWorld: _aimDeadzoneWorld,
    );
    if (direction == null) {
      _hideAimPreview();
      return;
    }
    _debugAimDirection.setFrom(direction);
    final config = _aimPreviewConfig;
    final angleDeg = math.atan2(-direction.y, direction.x) * 180 / math.pi;
    final shouldThrottle = shouldThrottleAimRecompute(
      nowSec: _visualElapsedSec,
      lastComputeSec: _aimLastComputeSec,
      maxComputeHz: config.maxComputeHz,
    );
    final shouldReuse = shouldReuseAimPreviewCache(
      currentAngleDeg: angleDeg,
      cachedAngleDeg: _aimLastComputedAngleDeg,
      angleEpsilonDeg: config.angleEpsilonDeg,
    );

    if (!force && !_aimPreviewDirty) {
      if (shouldThrottle || shouldReuse) {
        return;
      }
    }

    _aimLastComputedAngleDeg = angleDeg;
    _aimLastComputeSec = _visualElapsedSec;
    _rebuildAimPreviewPath(config: config, force: force);
    _aimPreviewDirty = false;
  }

  void _ensureShotOriginState() {
    if (_boardRect == Rect.zero || _cellSize <= 0) {
      return;
    }

    final targetRadius = resolveBallRadius(
      computedRadius: _cellSize * 0.15,
      minRadiusPx: _minBallRadiusPx,
    );
    final launchMargin = math.max(2.0, _cellSize * 0.03);
    final minY = _boardRect.top + targetRadius + launchMargin;
    final maxY = _boardRect.bottom - targetRadius - launchMargin;
    final launchInset =
        targetRadius + launchMargin + math.max(8.0, _cellSize * 0.12);
    final preferredShotY = (_boardRect.bottom - launchInset)
        .clamp(minY, maxY)
        .toDouble();
    final spawn = computeSpawnInsidePlayfield(
      playfieldRect: _boardRect,
      preferredX: _nextShotX,
      preferredY: preferredShotY,
      radius: targetRadius,
      margin: launchMargin + 2,
    );

    if (!_shotY.isFinite || _shotY.isNaN || _shotY < minY || _shotY > maxY) {
      _shotY = spawn.dy;
    }
    _nextShotX = _sanitizeShotX(spawn.dx, preferCenterForZero: true);

    // Aiming state should never keep stale active balls from resumed/edge cases.
    if (_turnState == _TurnState.aiming && _pendingLaunchCount == 0) {
      for (final ball in _ballPool) {
        if (!ball.active) {
          continue;
        }
        final invalidPosition =
            !ball.position.x.isFinite ||
            !ball.position.y.isFinite ||
            ball.position.x < (_boardRect.left - (_cellSize * 2)) ||
            ball.position.x > (_boardRect.right + (_cellSize * 2)) ||
            ball.position.y < (_boardRect.top - (_cellSize * 2)) ||
            ball.position.y > (_boardRect.bottom + (_cellSize * 2));
        if (invalidPosition) {
          ball.active = false;
          ball.position.setValues(_nextShotX, _shotY);
          ball.clearTrail();
        }
      }
    }

    if (_lastPointerPosWorld.length2 <= 1e-12 ||
        !_lastPointerPosWorld.x.isFinite ||
        !_lastPointerPosWorld.y.isFinite) {
      _lastPointerPosWorld.setValues(_nextShotX, _shotY - (_cellSize * 0.6));
      _aimPosition.setFrom(_lastPointerPosWorld);
    }

    for (final ball in _ballPool) {
      ball.radius = targetRadius;
      if (!ball.active) {
        if (!ball.position.x.isFinite ||
            !ball.position.y.isFinite ||
            ball.position.y < (_boardRect.top - _cellSize) ||
            ball.position.y > (_boardRect.bottom + (_cellSize * 2))) {
          ball.position.setValues(_nextShotX, _shotY);
        }
      }
    }
  }

  Offset _debugSentinelCenter(Rect playfield) {
    final ampX = math.max(6.0, _cellSize * 0.18);
    final ampY = math.max(3.0, _cellSize * 0.08);
    final x = playfield.center.dx + (math.sin(_visualElapsedSec * 2.15) * ampX);
    final y = playfield.center.dy + (math.cos(_visualElapsedSec * 1.70) * ampY);
    return Offset(
      x.clamp(playfield.left + 10.0, playfield.right - 10.0).toDouble(),
      y.clamp(playfield.top + 10.0, playfield.bottom - 10.0).toDouble(),
    );
  }

  void _probeBallBounds(double dt) {
    if (!selfTestEnabled && !_showLayoutDebug && !_ballDebugEnabled) {
      return;
    }
    _ballBoundsProbeTimer += dt;
    if (_ballBoundsProbeTimer < 0.5) {
      return;
    }
    _ballBoundsProbeTimer = 0;
    final playfield = _playfieldRect == Rect.zero ? _boardRect : _playfieldRect;
    if (playfield == Rect.zero) {
      return;
    }
    if (!_cameraInfoLogged) {
      DebugLoggerService.instance.info(
        'CAMERA_INFO viewport=(${size.x.toStringAsFixed(1)},${size.y.toStringAsFixed(1)}) '
        'playfield=(${playfield.left.toStringAsFixed(1)},${playfield.top.toStringAsFixed(1)},'
        '${playfield.right.toStringAsFixed(1)},${playfield.bottom.toStringAsFixed(1)}) '
        'board=(${_boardRect.left.toStringAsFixed(1)},${_boardRect.top.toStringAsFixed(1)},'
        '${_boardRect.right.toStringAsFixed(1)},${_boardRect.bottom.toStringAsFixed(1)}) '
        'clip=boardOnly',
      );
      _cameraInfoLogged = true;
    }
    _ballScreenProbeBuffer.clear();
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      _ballScreenProbeBuffer.add(Offset(ball.position.x, ball.position.y));
    }
    if (_ballScreenProbeBuffer.isEmpty) {
      _ballScreenProbeBuffer.add(Offset(_nextShotX, _shotY));
    }
    if (_ballDebugEnabled) {
      _ballScreenProbeBuffer.add(_debugSentinelCenter(playfield));
    }
    for (final screenPos in _ballScreenProbeBuffer) {
      if (isBallInsidePlayfield(
        screenPos: screenPos,
        playfieldRect: playfield,
      )) {
        continue;
      }
      DebugLoggerService.instance.warn(
        'BALL_OOB world=(${screenPos.dx.toStringAsFixed(1)},${screenPos.dy.toStringAsFixed(1)}) '
        'screen=(${screenPos.dx.toStringAsFixed(1)},${screenPos.dy.toStringAsFixed(1)}) '
        'rect=(${playfield.left.toStringAsFixed(1)},${playfield.top.toStringAsFixed(1)},'
        '${playfield.right.toStringAsFixed(1)},${playfield.bottom.toStringAsFixed(1)})',
      );
      break;
    }
  }

  void _drawLayoutDebugOverlay(Canvas canvas) {
    final playfield = _playfieldRect;
    if (playfield == Rect.zero) {
      return;
    }
    final topHudRect = Rect.fromLTRB(0, 0, size.x, playfield.top);
    final bottomHudRect = Rect.fromLTRB(0, playfield.bottom, size.x, size.y);

    canvas.drawRect(
      playfield,
      Paint()
        ..color = const Color(0xAA4FC3F7)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.7,
    );
    if (_boardRect != Rect.zero) {
      canvas.drawRect(
        _boardRect,
        Paint()
          ..color = const Color(0xAA80DEEA)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.8,
      );
      canvas.drawLine(
        Offset(_boardRect.left, _floorY),
        Offset(_boardRect.right, _floorY),
        Paint()
          ..color = const Color(0xAAFFD54F)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.6,
      );
    }
    canvas.drawRect(
      topHudRect,
      Paint()
        ..color = const Color(0x33FF9800)
        ..style = PaintingStyle.fill,
    );
    canvas.drawRect(
      topHudRect,
      Paint()
        ..color = const Color(0xAAFF9800)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );
    canvas.drawRect(
      bottomHudRect,
      Paint()
        ..color = const Color(0x3327AE60)
        ..style = PaintingStyle.fill,
    );
    canvas.drawRect(
      bottomHudRect,
      Paint()
        ..color = const Color(0xAA27AE60)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );

    _ballScreenProbeBuffer.clear();
    for (final ball in _ballPool) {
      if (ball.active) {
        _ballScreenProbeBuffer.add(Offset(ball.position.x, ball.position.y));
      }
    }
    if (_ballScreenProbeBuffer.isEmpty) {
      _ballScreenProbeBuffer.add(Offset(_nextShotX, _shotY));
    }
    if (_ballDebugEnabled) {
      _ballScreenProbeBuffer.add(_debugSentinelCenter(playfield));
    }

    final first = _ballScreenProbeBuffer.first;
    final inside = playfield.contains(first);
    for (final pos in _ballScreenProbeBuffer) {
      final isInside = playfield.contains(pos);
      canvas.drawCircle(
        pos,
        3.2,
        Paint()
          ..color = isInside
              ? const Color(0xFF66BB6A)
              : const Color(0xFFEF5350),
      );
    }

    final textPainter =
        TextPainter(textDirection: TextDirection.ltr, maxLines: 2)
          ..text = TextSpan(
            text:
                'ball world=(${first.dx.toStringAsFixed(1)},${first.dy.toStringAsFixed(1)}) '
                'screen=(${first.dx.toStringAsFixed(1)},${first.dy.toStringAsFixed(1)}) '
                'inside=${inside ? 'yes' : 'no'}',
            style: const TextStyle(
              color: Color(0xFFECEFF1),
              fontSize: 10,
              fontWeight: FontWeight.w600,
              shadows: <Shadow>[
                Shadow(color: Color(0xCC000000), blurRadius: 2),
              ],
            ),
          );
    textPainter.layout(minWidth: 0, maxWidth: math.max(80, size.x - 24));
    textPainter.paint(canvas, const Offset(12, 4));

    final markerPaint = Paint()
      ..color = inside ? const Color(0x6600E676) : const Color(0x66FF1744)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    canvas.drawCircle(first, 8, markerPaint);
    if (!inside) {
      canvas.drawCircle(first, 11.5, markerPaint);
    }
  }

  void _runSelfTestCheck(double dt) {
    if (!selfTestEnabled || _selfTestDone || !_didLoad) {
      return;
    }
    _selfTestTimer += dt;
    if (_selfTestTimer < 1.0) {
      return;
    }
    _selfTestDone = true;
    final result = evaluateGameSelfTest(
      GameSelfTestInput(
        playfieldRect: _playfieldRect == Rect.zero
            ? _boardRect
            : _playfieldRect,
        tileSize: _cellSize,
        ballCount: _ownedBalls,
        hasAimGuide:
            _boardRenderer.useFancyAimGuide || _debugAimDirection.length2 > 0,
      ),
    );
    final playfield = _playfieldRect == Rect.zero ? _boardRect : _playfieldRect;
    _ballScreenProbeBuffer.clear();
    for (final ball in _ballPool) {
      if (ball.active) {
        _ballScreenProbeBuffer.add(Offset(ball.position.x, ball.position.y));
      }
    }
    if (_ballScreenProbeBuffer.isEmpty) {
      _ballScreenProbeBuffer.add(Offset(_nextShotX, _shotY));
    }
    if (_ballDebugEnabled) {
      _ballScreenProbeBuffer.add(_debugSentinelCenter(playfield));
    }
    final visibilityResult = evaluateBallVisibilitySelfTest(
      BallVisibilitySelfTestInput(
        playfieldRect: playfield,
        ballCount: _ownedBalls,
        ballScreenPositions: _ballScreenProbeBuffer,
        renderCallCount: _ballRenderCallCount,
        ballDebugEnabled: _ballDebugEnabled,
      ),
    );
    final reasons = <String>[
      ...result.reasons,
      if (!validateRenderLayerOrder()) 'layerOrderInvalid',
      if (!visibilityResult.ok) 'BALL_NOT_VISIBLE:${visibilityResult.reason}',
    ];

    if (reasons.isEmpty) {
      if (!_selfTestOkLogged) {
        DebugLoggerService.instance.info('SELFTEST_OK');
        _selfTestOkLogged = true;
      }
      return;
    }
    _selfTestFailureReason = reasons.join(',');
    DebugLoggerService.instance.error(
      'SELFTEST_FAIL:${_selfTestFailureReason!}',
    );
  }

  void _runAimSelfTestCheck(double dt) {
    if (!_aimSelfTestByDefine || _aimSelfTestDone || !_didLoad) {
      return;
    }
    _aimSelfTestTimer += dt;
    if (_aimSelfTestTimer < 1.0) {
      return;
    }
    _aimSelfTestDone = true;

    final origin = Vector2(_nextShotX, _shotY);
    final rad = 30 * math.pi / 180.0;
    final pointer = Vector2(
      origin.x + (math.cos(rad) * math.max(48.0, _cellSize * 6.0)),
      origin.y - (math.sin(rad) * math.max(48.0, _cellSize * 6.0)),
    );
    _lastPointerPosWorld.setFrom(pointer);
    _aimPosition.setFrom(pointer);
    _refreshDebugAimDirection(force: true);

    final result = evaluateAimSelfTest(
      segments: _aimPreviewSegmentCount,
      totalLengthPx: _aimPreviewTotalLengthPx,
      predictMs: _aimPredictLastMs,
      config: _aimPreviewConfig,
    );
    final log = formatAimSelfTestLog(
      result: result,
      segments: _aimPreviewSegmentCount,
      totalLengthPx: _aimPreviewTotalLengthPx,
      predictMs: _aimPredictLastMs,
    );
    if (result.ok) {
      if (!_aimSelfTestLogged) {
        DebugLoggerService.instance.info(log);
        _aimSelfTestLogged = true;
      }
      return;
    }
    DebugLoggerService.instance.error(log);
  }

  void _runAimVisibilitySelfTestCheck(double dt) {
    if (!_aimVisibilitySelfTestByDefine ||
        _aimVisibilitySelfTestDone ||
        !_didLoad) {
      return;
    }
    _aimVisibilitySelfTestTimer += dt;
    if (_aimVisibilitySelfTestTimer < 1.0) {
      return;
    }
    if (_boardRect == Rect.zero || _cellSize <= 0) {
      if (_aimVisibilitySelfTestTimer > 8.0) {
        _aimVisibilitySelfTestDone = true;
        DebugLoggerService.instance.error(
          'AIM_VIS_FAIL:board_not_ready rect=$_boardRect cell=$_cellSize',
        );
      }
      return;
    }

    _aimVisibilitySelfTestDone = true;

    final wasPause = _pauseForChoice;
    final wasTurnState = _turnState;
    final wasDragging = _isDraggingAim;
    final wasPointerId = _aimPointerId;

    _pauseForChoice = false;
    _turnState = _TurnState.aiming;
    _isDraggingAim = false;
    _aimPointerId = null;
    _hideAimPreview();

    final idleVisible = _shouldShowAimPreview || _aimPathPoints.isNotEmpty;
    if (!idleVisible) {
      DebugLoggerService.instance.info('AIM_VIS_OK_IDLE');
    }

    final startY = (_shotY - math.max(34.0, _cellSize * 2))
        .clamp(_boardRect.top + 4, _boardRect.bottom - 4)
        .toDouble();
    final dragX = (_nextShotX + math.max(24.0, _cellSize * 1.4))
        .clamp(_boardRect.left + 4, _boardRect.right - 4)
        .toDouble();
    final dragY = (startY - math.max(18.0, _cellSize * 0.9))
        .clamp(_boardRect.top + 4, _boardRect.bottom - 4)
        .toDouble();
    final start = Offset(_nextShotX, startY);
    final drag = Offset(dragX, dragY);

    _suppressAimFireForSelfTest = true;
    handleAimPointerDown(pointerId: -911, position: start);
    handleAimPointerMove(pointerId: -911, position: drag);
    final dragVisible = _shouldShowAimPreview && _aimPathPoints.isNotEmpty;
    if (dragVisible) {
      DebugLoggerService.instance.info('AIM_VIS_OK_DRAG');
    }
    handleAimPointerUp(pointerId: -911, position: drag);
    _suppressAimFireForSelfTest = false;

    final endVisible = _shouldShowAimPreview || _aimPathPoints.isNotEmpty;
    if (!endVisible) {
      DebugLoggerService.instance.info('AIM_VIS_OK_END');
    }

    final result = evaluateAimVisibilitySelfTest(
      idleVisible: idleVisible,
      dragVisible: dragVisible,
      endVisible: endVisible,
    );
    if (!result.ok) {
      DebugLoggerService.instance.error(
        'AIM_VIS_FAIL:${result.reason} idle=$idleVisible drag=$dragVisible end=$endVisible',
      );
    }

    _pauseForChoice = wasPause;
    _turnState = wasTurnState;
    _isDraggingAim = wasDragging;
    _aimPointerId = wasPointerId;
    if (!_isDraggingAim) {
      _hideAimPreview(keepDirection: true);
    }
  }

  void _runPerfSelfTestCheck(double dt) {
    if (!_perfSelfTestByDefine || _perfSelfTestDone || !_didLoad) {
      return;
    }
    if (_boardRect == Rect.zero || _cellSize <= 0) {
      _perfSelfTestTimer += dt;
      if (_perfSelfTestTimer > 8.0) {
        _perfSelfTestDone = true;
        DebugLoggerService.instance.error('PERF_FAIL_SEVERE:board_not_ready');
      }
      return;
    }

    if (!_perfSelfTestDragActive) {
      _perfSelfTestTimer += dt;
      if (_perfSelfTestTimer < 1.0) {
        return;
      }
      _perfSelfTestTimer = 0;
      _perfSelfTestDragActive = true;
      _perfSelfTestRestorePause = _pauseForChoice;
      _perfSelfTestRestoreTurnState = _turnState;
      _pauseForChoice = false;
      _turnState = _TurnState.aiming;
      _suppressAimFireForSelfTest = true;
      final startY = (_shotY - math.max(34.0, _cellSize * 2))
          .clamp(_boardRect.top + 4, _boardRect.bottom - 4)
          .toDouble();
      handleAimPointerDown(
        pointerId: -917,
        position: Offset(_nextShotX, startY),
      );
      handleAimPointerMove(
        pointerId: -917,
        position: Offset(
          (_nextShotX + math.max(18.0, _cellSize))
              .clamp(_boardRect.left + 4, _boardRect.right - 4)
              .toDouble(),
          (startY - math.max(22.0, _cellSize))
              .clamp(_boardRect.top + 4, _boardRect.bottom - 4)
              .toDouble(),
        ),
      );
      return;
    }

    _perfSelfTestTimer += dt;
    if (_perfSelfTestTimer < 2.0) {
      return;
    }

    handleAimPointerCancel(pointerId: -917);
    _suppressAimFireForSelfTest = false;
    _pauseForChoice = _perfSelfTestRestorePause;
    _turnState = _perfSelfTestRestoreTurnState;
    _perfSelfTestDragActive = false;
    _perfSelfTestDone = true;

    final result = evaluatePerfSelfTest(p95FrameMs: _frameTimingP95Ms);
    if (result.ok) {
      DebugLoggerService.instance.info(
        'PERF_OK p95=${_frameTimingP95Ms.toStringAsFixed(2)} worst=${_frameTimingWorstMs.toStringAsFixed(2)}',
      );
    } else {
      DebugLoggerService.instance.error(
        'PERF_FAIL_SEVERE:${result.reason} p95=${_frameTimingP95Ms.toStringAsFixed(2)}',
      );
    }
  }

  void _runBossSelfTestCheck(double dt) {
    if (!_bossSelfTestByDefine || _bossSelfTestDone || !_didLoad) {
      return;
    }
    _bossSelfTestTimer += dt;
    if (_bossSelfTestTimer < 1.0) {
      return;
    }
    if (_boardRect == Rect.zero || _cellSize <= 0) {
      if (_bossSelfTestTimer > 8.0) {
        _bossSelfTestDone = true;
        DebugLoggerService.instance.error('BOSS_SELFTEST_FAIL:board_not_ready');
      }
      return;
    }

    _bossSelfTestDone = true;
    if (!bossAlive) {
      final originalLoop = _loop;
      _loop = math.max(20, _loop);
      _spawnBossForLoop(spawnTiming: 'selftest');
      if (!bossAlive) {
        DebugLoggerService.instance.error(
          'BOSS_SELFTEST_FAIL:spawn_failed loop=$_loop',
        );
        _loop = originalLoop;
        return;
      }
      _loop = originalLoop;
    }

    final boss = _boss;
    if (boss == null || !boss.alive) {
      DebugLoggerService.instance.error('BOSS_SELFTEST_FAIL:no_alive_boss');
      return;
    }
    final rect = _bossRect(boss);
    if (rect == Rect.zero || rect.width <= 0 || rect.height <= 0) {
      DebugLoggerService.instance.error(
        'BOSS_SELFTEST_FAIL:invalid_rect rect=$rect',
      );
      return;
    }
    DebugLoggerService.instance.info(
      'BOSS_SELFTEST_OK bossRect=(${rect.left.toStringAsFixed(1)},${rect.top.toStringAsFixed(1)},${rect.right.toStringAsFixed(1)},${rect.bottom.toStringAsFixed(1)})',
    );
  }

  void _runVfxSelfTestCheck(double dt) {
    if (!_vfxSelfTestByDefine || _vfxSelfTestDone || !_didLoad) {
      return;
    }
    _vfxSelfTestTimer += dt;
    if (_vfxSelfTestTimer < 1.0) {
      return;
    }
    _vfxSelfTestDone = true;
    final center = _boardRect == Rect.zero
        ? Offset(size.x * 0.5, size.y * 0.5)
        : _boardRect.center;
    try {
      final centerV2 = Vector2(center.dx, center.dy);
      _vfxManager.onBallBounce(centerV2);
      _vfxManager.onBlockHit(cellCol: 0, cellRow: 0, position: centerV2);
      _vfxManager.onBlockBreak(
        cellCol: 0,
        cellRow: 0,
        position: centerV2,
        type: VfxBlockType.normal,
      );
      _vfxManager.onBombExplode(position: centerV2, affectedCellsCount: 4);
      _vfxManager.onPickupBallPlus(centerV2);
      _vfxManager.update(0.016);
      DebugLoggerService.instance.info('VFX_SELFTEST_OK');
    } catch (error, stackTrace) {
      DebugLoggerService.instance.error('VFX_SELFTEST_FAIL:$error');
      DebugLoggerService.instance.warn('VFX_SELFTEST_STACK:$stackTrace');
    }
  }

  void _updatePerfDiagnostics(double dt) {
    if (!_perfDiagnosticsEnabled) {
      return;
    }
    _frameTimingLogTimer += dt;
    if (_frameTimingLogTimer < 2.0) {
      return;
    }
    _frameTimingLogTimer = 0;
    if (_frameTimingsMs.isEmpty) {
      return;
    }
    final sorted = List<double>.from(_frameTimingsMs)..sort();
    final p95Index = (((sorted.length - 1) * 0.95).round()).clamp(
      0,
      sorted.length - 1,
    );
    _frameTimingP95Ms = sorted[p95Index];
    _frameTimingWorstMs = sorted.last;

    if (_perfDebugByDefine || _perfSelfTestByDefine || debugDraw) {
      DebugLoggerService.instance.info(
        'PERF_TIMING p95=${_frameTimingP95Ms.toStringAsFixed(2)} worst=${_frameTimingWorstMs.toStringAsFixed(2)}',
      );
    }

    const vfxDowngradeThresholdMs = 40.0;
    const vfxRecoverThresholdMs = 28.0;
    if (!_vfxPerfDowngraded && _frameTimingP95Ms >= vfxDowngradeThresholdMs) {
      _vfxPerfDowngraded = true;
      _vfxManager.setPerfDegraded(true);
      DebugLoggerService.instance.warn(
        'VFX_DENSITY_DOWNGRADE reason=perf p95=${_frameTimingP95Ms.toStringAsFixed(2)}',
      );
    } else if (_vfxPerfDowngraded &&
        _frameTimingP95Ms <= vfxRecoverThresholdMs) {
      _vfxPerfDowngraded = false;
      _vfxManager.setPerfDegraded(false);
      DebugLoggerService.instance.info(
        'VFX_DENSITY_RESTORE p95=${_frameTimingP95Ms.toStringAsFixed(2)}',
      );
    }

    if (shouldDowngradeAimStyleForPerf(
      isDraggingAim: _shouldShowAimPreview,
      usingAnimatedAimStyle: _aimLineStyle == AimLineStyle.fancy,
      p95FrameMs: _frameTimingP95Ms,
    )) {
      _aimLineStyle = AimLineStyle.simple;
      _applyRuntimeOptionsToSystems();
      _aimPreviewDirty = true;
      _refreshDebugAimDirection(force: true);
      DebugLoggerService.instance.warn(
        'AIM_STYLE_DOWNGRADE reason=perf p95=${_frameTimingP95Ms.toStringAsFixed(2)}',
      );
    }
  }

  void _runBoardFitSelfTestCheck(double dt) {
    if (!_boardFitSelfTestByDefine || _boardFitSelfTestDone || !_didLoad) {
      return;
    }
    _boardFitSelfTestTimer += dt;
    if (_boardFitSelfTestTimer < 1.0) {
      return;
    }
    _boardFitSelfTestDone = true;

    final playfield = _playfieldRect == Rect.zero ? _boardRect : _playfieldRect;
    final result = evaluateBoardFitSelfTest(
      BoardFitSelfTestInput(
        playfieldRect: playfield,
        boardRect: _boardRect,
        tileSize: _cellSize,
        rows: boardRows,
      ),
    );
    final log = formatBoardFitSelfTestLog(
      result: result,
      playfieldRect: playfield,
      boardRect: _boardRect,
      tileSize: _cellSize,
    );
    if (result.ok) {
      if (!_boardFitSelfTestLogged) {
        DebugLoggerService.instance.info(log);
        _boardFitSelfTestLogged = true;
      }
      return;
    }

    _selfTestFailureReason ??= 'BOARD_FIT:${result.reason}';
    DebugLoggerService.instance.error(log);
  }

  void _clearAimPreviewPath() {
    _aimPathPoints.clear();
    _aimBounceMarkers.clear();
    _aimUncertainMarkers.clear();
    _aimLandingMarker = null;
    _aimFirstHitMarker = null;
    _aimFirstHitUncertain = false;
    _aimPreviewSegmentCount = 0;
    _aimPreviewBounceCount = 0;
    _aimPreviewTotalLengthPx = 0;
  }

  void _hideAimPreview({bool keepDirection = false}) {
    _clearAimPreviewPath();
    if (!keepDirection) {
      _debugAimDirection.setZero();
    }
    _aimPreviewDirty = true;
  }

  void _rebuildAimPreviewPath({
    required AimPreviewConfig config,
    bool force = false,
  }) {
    final sw = Stopwatch()..start();
    _clearAimPreviewPath();
    if (_turnState != _TurnState.aiming) {
      sw.stop();
      return;
    }
    if (!force &&
        !shouldComputeAimPreview(
          isAiming: _turnState == _TurnState.aiming,
          isDragging: _isDraggingAim,
          inputLocked: _inputLockedForAim,
        )) {
      sw.stop();
      return;
    }
    if (_debugAimDirection.length2 <= 1e-10) {
      sw.stop();
      return;
    }

    final direction = Vector2.copy(_debugAimDirection)..normalize();
    if (direction.y >= 0) {
      sw.stop();
      return;
    }

    final probePosition = Vector2(_nextShotX, _shotY);
    _aimPathPoints.add(Offset(probePosition.x, probePosition.y));
    _aimIgnoredTriggerIds.clear();
    _aimPreviewBall.radius = resolveBallRadius(
      computedRadius: _cellSize * 0.15,
      minRadiusPx: _minBallRadiusPx,
    );

    var segments = 0;
    var bounces = 0;
    var totalLength = 0.0;
    var iteration = 0;
    final safeCastDistance = math.max(
      24.0,
      _cellSize * _aimPreviewDistanceTiles,
    );

    while (iteration < config.hardIterationCap) {
      iteration += 1;
      if (segments >= config.maxSegments ||
          bounces >= config.maxBounces ||
          totalLength >= config.maxTotalLengthPx) {
        break;
      }
      final remainingLength = config.maxTotalLengthPx - totalLength;
      if (remainingLength <= 0.1) {
        break;
      }
      final castDistance = math.min(safeCastDistance, remainingLength);
      final from = Vector2.copy(probePosition);
      final to = from + (direction * castDistance);
      final collision = _collisionResolver.findEarliestCollision(
        board: _boardModel,
        boss: _boss,
        ball: _aimPreviewBall,
        p0: from,
        p1: to,
        bottomCollectY: _floorY,
        ignoredTriggerBlockIds: _aimIgnoredTriggerIds,
        candidateBuffer: _aimCandidateBuffer,
        bossCandidateBuffer: _aimBossCandidateBuffer,
      );

      if (collision == null) {
        final endPoint = Offset(to.x, to.y);
        totalLength += (endPoint - Offset(from.x, from.y)).distance;
        _aimPathPoints.add(endPoint);
        segments += 1;
        break;
      }

      Offset hitPoint = Offset(collision.point.x, collision.point.y);
      final segmentStart = Offset(from.x, from.y);
      final rawSegmentLength = (hitPoint - segmentStart).distance;
      final remainingAfter = config.maxTotalLengthPx - totalLength;
      if (rawSegmentLength > remainingAfter) {
        hitPoint = Offset(
          from.x + (direction.x * remainingAfter),
          from.y + (direction.y * remainingAfter),
        );
      }
      totalLength += (hitPoint - segmentStart).distance;
      _aimPathPoints.add(hitPoint);
      segments += 1;
      _aimFirstHitMarker ??= hitPoint;
      _aimFirstHitUncertain = false;

      if (rawSegmentLength > remainingAfter) {
        break;
      }

      if (collision.kind == _CollisionKind.floor) {
        _aimLandingMarker = hitPoint;
        break;
      }

      if (collision.kind == _CollisionKind.wall) {
        _aimBounceMarkers.add(hitPoint);
        bounces += 1;
        _reflectPreviewDirection(direction, collision.normal);
        probePosition.setFrom(collision.point);
        _nudgePreviewAlongNormal(probePosition, collision.normal);
        continue;
      }

      if (collision.kind == _CollisionKind.block) {
        final block = collision.block;
        if (block == null || !block.alive) {
          break;
        }

        if (block.type == _BlockType.ballPickup) {
          _aimIgnoredTriggerIds.add(block.id);
          probePosition.setFrom(collision.point);
          _nudgePreviewAlongVelocity(probePosition, direction);
          continue;
        }

        if (block.type == _BlockType.cactus) {
          _aimUncertainMarkers.add(hitPoint);
          _aimFirstHitUncertain = true;
          break;
        }

        _aimBounceMarkers.add(hitPoint);
        bounces += 1;
        _reflectPreviewDirection(direction, collision.normal);
        probePosition.setFrom(collision.point);
        _nudgePreviewAlongNormal(probePosition, collision.normal);
        continue;
      }

      if (collision.kind == _CollisionKind.boss) {
        final boss = collision.boss;
        if (boss != null && boss.special == _BossSpecial.cactusReflect) {
          _aimUncertainMarkers.add(hitPoint);
          _aimFirstHitUncertain = true;
          break;
        }

        _aimBounceMarkers.add(hitPoint);
        bounces += 1;
        _reflectPreviewDirection(direction, collision.normal);
        probePosition.setFrom(collision.point);
        _nudgePreviewAlongNormal(probePosition, collision.normal);
      }
    }

    _aimPreviewSegmentCount = segments;
    _aimPreviewBounceCount = bounces;
    _aimPreviewTotalLengthPx = totalLength;

    sw.stop();
    _aimPredictLastMs = sw.elapsedMicroseconds / 1000.0;
    _aimPredictSampleCount += 1;
    _aimPredictAvgMs +=
        (_aimPredictLastMs - _aimPredictAvgMs) / _aimPredictSampleCount;
    _aimPredictMaxMs = math.max(_aimPredictMaxMs, _aimPredictLastMs);
    if (selfTestEnabled || _aimSelfTestByDefine || debugDraw || force) {
      DebugLoggerService.instance.info(
        'AIM_PREDICT_MS=${_aimPredictLastMs.toStringAsFixed(2)} '
        'AIM_SEGMENTS=$_aimPreviewSegmentCount '
        'AIM_TOTAL_LEN=${_aimPreviewTotalLengthPx.toStringAsFixed(1)} '
        'AIM_METRICS ms=${_aimPredictLastMs.toStringAsFixed(2)} '
        'points=${_aimPathPoints.length} '
        'drawMode=${_boardRenderer.useFancyAimGuide ? 'animated' : 'simple'}',
      );
    }
  }

  void _reflectPreviewDirection(Vector2 direction, Vector2 surfaceNormal) {
    const normalEps = 1e-9;
    if (surfaceNormal.x.abs() > normalEps) {
      direction.x = -direction.x;
    }
    if (surfaceNormal.y.abs() > normalEps) {
      direction.y = -direction.y;
    }
    _stabilizeDirectionVector(direction);
  }

  void _stabilizeDirectionVector(Vector2 direction) {
    final length = direction.length;
    if (length <= 1e-12) {
      direction.setValues(0, -1);
      return;
    }

    var vx = direction.x / length;
    var vy = direction.y / length;
    const minRatio = 0.25;
    if (vx.abs() < minRatio) {
      vx = vx < 0 ? -minRatio : minRatio;
    }
    if (vy.abs() < minRatio) {
      vy = vy < 0 ? -minRatio : minRatio;
    }
    direction
      ..setValues(vx, vy)
      ..normalize();
  }

  void _nudgePreviewAlongNormal(Vector2 position, Vector2 surfaceNormal) {
    final n = Vector2(
      surfaceNormal.x == 0 ? 0 : surfaceNormal.x.sign,
      surfaceNormal.y == 0 ? 0 : surfaceNormal.y.sign,
    );
    position.add(n * (_cellSize * 0.001));
  }

  void _nudgePreviewAlongVelocity(Vector2 position, Vector2 velocity) {
    if (velocity.length2 <= 1e-12) {
      return;
    }
    final n = Vector2.copy(velocity)..normalize();
    position.add(n * (_cellSize * 0.001));
  }

  Vector2? computeClampedShotDir({
    required Vector2 shotOriginWorld,
    required Vector2 pointerWorld,
    required double minShootAngleDeg,
    required double maxShootAngleDeg,
    required double minAbsVy,
    required double deadzoneWorld,
  }) {
    final rawDx = pointerWorld.x - shotOriginWorld.x;
    final rawDy = pointerWorld.y - shotOriginWorld.y;
    _debugRawDx = rawDx;
    _debugRawDy = rawDy;
    _debugAngleRawBeforeDeg = math.atan2(rawDy, rawDx) * 180 / math.pi;

    final deadzoneSq = deadzoneWorld * deadzoneWorld;
    final rawLenSq = (rawDx * rawDx) + (rawDy * rawDy);
    if (rawLenSq < deadzoneSq) {
      _debugAngleRawAfterDeg = _debugAngleRawBeforeDeg;
      _debugAngleClampedDeg = _debugAngleRawAfterDeg
          .clamp(minShootAngleDeg, maxShootAngleDeg)
          .toDouble();
      return null;
    }

    var dx = rawDx;
    var dy = rawDy;
    if (dy >= 0) {
      dy = -math.max(dy.abs(), 1e-6);
    }
    final intendedXSign = rawDx < 0
        ? -1.0
        : rawDx > 0
        ? 1.0
        : 0.0;

    final dyUp = -dy;
    final angleRad = math.atan2(dyUp, dx);
    final angleDegRaw = angleRad * 180 / math.pi;
    final angleDegClamped = angleDegRaw
        .clamp(minShootAngleDeg, maxShootAngleDeg)
        .toDouble();

    final clampedRad = angleDegClamped * math.pi / 180;
    var dirX = math.cos(clampedRad);
    var dirY = -math.sin(clampedRad);

    if (intendedXSign != 0 && dirX.sign != intendedXSign) {
      dirX = intendedXSign * math.max(dirX.abs(), 1e-6);
    }

    if (dirY >= 0) {
      dirY = -math.max(dirY.abs(), 1e-6);
    }

    if (dirY.abs() < minAbsVy) {
      var xSign = intendedXSign;
      if (xSign == 0) {
        xSign = dirX == 0 ? 1.0 : dirX.sign;
      }
      final clampedVy = -minAbsVy;
      final clampedXMag = math.sqrt(math.max(0.0, 1 - (clampedVy * clampedVy)));
      dirX = xSign * clampedXMag;
      dirY = clampedVy;
    }

    final direction = Vector2(dirX, dirY);
    if (direction.length2 <= 1e-12) {
      direction.setValues(intendedXSign < 0 ? -1 : 1, -1);
    }
    direction.normalize();
    if (direction.y >= 0) {
      direction.y = -math.max(direction.y.abs(), 1e-6);
      direction.normalize();
    }
    if (intendedXSign != 0 && direction.x.sign != intendedXSign) {
      final forcedX = intendedXSign * math.max(direction.x.abs(), 1e-6);
      final safeY = direction.y < 0
          ? direction.y
          : -math.max(direction.y.abs(), 1e-6);
      direction
        ..setValues(forcedX, safeY)
        ..normalize();
    }

    _debugAngleRawAfterDeg = angleDegRaw;
    _debugAngleClampedDeg = angleDegClamped;
    _debugAimDirection.setFrom(direction);

    if (debugDraw &&
        ((rawDx < 0 && direction.x > 0) || (rawDx > 0 && direction.x < 0))) {
      debugPrint(
        '[AimWarning] pointerXSign=${rawDx.sign.toStringAsFixed(0)} '
        'but dir.x=${direction.x.toStringAsFixed(4)} '
        'raw=(${rawDx.toStringAsFixed(2)},${rawDy.toStringAsFixed(2)}) '
        'angleRaw=${angleDegRaw.toStringAsFixed(2)} '
        'angleClamped=${angleDegClamped.toStringAsFixed(2)}',
      );
    }

    return direction;
  }

  int _activeBallCount() {
    var count = 0;
    for (final ball in _ballPool) {
      if (ball.active) {
        count += 1;
      }
    }
    return count;
  }

  String _turnStateLabel() {
    switch (_turnState) {
      case _TurnState.aiming:
        return 'Aiming';
      case _TurnState.firing:
        return 'Firing';
      case _TurnState.simulating:
        return 'Simulating';
      case _TurnState.resolving:
        return 'Resolving';
    }
  }

  String _bossTierLabel(BossTier tier) {
    switch (tier) {
      case BossTier.weak:
        return 'Weak';
      case BossTier.medium:
        return 'Medium';
      case BossTier.strong:
        return 'Strong';
    }
  }

  bool _hasAnyActiveBall() {
    return _activeBallCount() > 0;
  }

  void _indexBlock(_GridBlock block) {
    _boardModel.indexBlock(block);
  }

  void _removeBlockIndex(_GridBlock block) {
    _boardModel.removeIndex(block);
  }

  void _rebuildBlockIndex() {
    _boardModel.rebuildIndex();
  }

  Rect _blockRect(_GridBlock block) {
    return _boardModel.blockRect(block);
  }

  Rect _bossRect(_BossEntity boss) {
    return _boardModel.bossRect(boss);
  }

  Vector2 _cellCenter(int col, int row) {
    final center = _boardModel.cellRect(col, row).center;
    return Vector2(center.dx, center.dy);
  }

  int _cellFlatIndex(int col, int row) => (row * boardCols) + col;

  void _triggerCellFlash(int col, int row) {
    if (col < 0 || row < 0 || col >= boardCols || row >= boardRows) {
      return;
    }
    _cellFlashTimers[_cellFlatIndex(col, row)] = _cellFlashDurationSec;
  }

  void _updateCellFlashTimers(double dt) {
    for (var i = 0; i < _cellFlashTimers.length; i++) {
      final t = _cellFlashTimers[i];
      if (t <= 0) {
        continue;
      }
      final next = t - dt;
      _cellFlashTimers[i] = next > 0 ? next : 0;
    }
  }

  void _updateTurnDropAnimation(double dt) {
    if (_turnDropAnimTimer <= 0) {
      return;
    }
    _turnDropAnimTimer -= dt;
    if (_turnDropAnimTimer <= 0) {
      _turnDropAnimTimer = 0;
      _turnDropAnimOffsetStart = 0;
      _newSpawnBlockIds.clear();
    }
  }

  void _drawBlocks(Canvas canvas) {
    final dropOffsetY = _currentDropRenderOffsetY;
    final spawnFade = _currentSpawnFade;

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }

      final baseRect = _blockRect(block);
      final rect = baseRect.shift(Offset(0, dropOffsetY));
      final opacity = _newSpawnBlockIds.contains(block.id) ? spawnFade : 1.0;
      if (block.type == _BlockType.ballPickup) {
        _drawBallPickupToken(canvas, rect, block, opacity: opacity);
        continue;
      }

      _drawStyledBlockTile(canvas, block, rect, opacity: opacity);
    }
  }

  void _drawStyledBlockTile(
    Canvas canvas,
    _GridBlock block,
    Rect cellRect, {
    double opacity = 1.0,
  }) {
    final inset = math.max(1.0, _cellSize * 0.04);
    final rect = cellRect.deflate(inset);
    final radius = (_cellSize * 0.18).clamp(6.0, 10.0).toDouble();
    final tile = RRect.fromRectAndRadius(rect, Radius.circular(radius));

    final baseColor = _colorForBlock(block);
    final tilePaint = Paint()..color = baseColor;
    final borderPaint = Paint()
      ..color = Colors.white.withAlpha(120)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.0, _cellSize * 0.035);
    final highlightPaint = Paint()..color = Colors.white.withAlpha(46);

    final hasOpacityLayer = opacity < 0.999;
    if (hasOpacityLayer) {
      canvas.saveLayer(
        rect.inflate(math.max(2.0, _cellSize * 0.08)),
        Paint()..color = Colors.white.withValues(alpha: opacity),
      );
    }

    if (block.type == _BlockType.triangle) {
      final triangle = _trianglePathForRect(rect, block.triangleCorner);
      canvas.drawPath(triangle, tilePaint);
      canvas.drawPath(triangle, borderPaint);
      canvas.drawPath(
        triangle,
        Paint()
          ..color = Colors.white.withAlpha(38)
          ..style = PaintingStyle.fill,
      );

      final triBounds = triangle.getBounds();
      final highlightRect = Rect.fromLTWH(
        triBounds.left + 1,
        triBounds.top + 1,
        math.max(1.0, triBounds.width - 2),
        math.max(2.0, triBounds.height * 0.22),
      );
      canvas.save();
      canvas.clipPath(triangle);
      canvas.drawRect(highlightRect, highlightPaint);
      canvas.restore();
    } else {
      canvas.drawRRect(tile, tilePaint);
      canvas.drawRRect(tile, borderPaint);

      final highlightHeight = math.max(2.0, rect.height * 0.20);
      final highlightRect = Rect.fromLTWH(
        rect.left + 1,
        rect.top + 1,
        rect.width - 2,
        highlightHeight,
      );
      canvas.drawRRect(
        RRect.fromRectAndCorners(
          highlightRect,
          topLeft: Radius.circular(radius * 0.8),
          topRight: Radius.circular(radius * 0.8),
        ),
        highlightPaint,
      );
    }

    if (block.type == _BlockType.steel) {
      _drawSteelDecoration(canvas, rect, block.steelLocked);
    } else if (block.type == _BlockType.cactus) {
      _drawCactusDecoration(canvas, rect);
    } else if (block.type == _BlockType.bomb) {
      _drawBombDecoration(canvas, rect);
    }

    final flashT = _cellFlashTimers[_cellFlatIndex(block.col, block.row)];
    if (flashT > 0) {
      _drawCellFlashOverlay(
        canvas: canvas,
        rect: rect,
        progress: 1 - (flashT / _cellFlashDurationSec),
      );
    }

    final label = block.hp > 0 ? '${block.hp}' : '0';
    _drawCenteredLabel(
      canvas,
      rect,
      label,
      fontSize: math.max(10, _cellSize * 0.30),
      color: Colors.white,
    );

    if (hasOpacityLayer) {
      canvas.restore();
    }
  }

  void _drawCellFlashOverlay({
    required Canvas canvas,
    required Rect rect,
    required double progress,
  }) {
    final clamped = progress.clamp(0.0, 1.0).toDouble();
    final alpha = (1 - clamped) * 0.55;
    final radius = (_cellSize * 0.18).clamp(6.0, 10.0).toDouble();
    final overlayRect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    canvas.drawRRect(
      overlayRect,
      Paint()..color = Colors.white.withValues(alpha: alpha),
    );

    if (_perlinNoiseImage != null) {
      final image = _perlinNoiseImage!;
      final src = Rect.fromLTWH(
        0,
        0,
        image.width.toDouble(),
        image.height.toDouble(),
      );
      canvas.save();
      canvas.clipRRect(overlayRect);
      canvas.drawImageRect(
        image,
        src,
        rect,
        Paint()
          ..filterQuality = FilterQuality.low
          ..colorFilter = ColorFilter.mode(
            Colors.white.withValues(alpha: alpha * 0.35),
            BlendMode.modulate,
          ),
      );
      canvas.restore();
    }
  }

  Path _trianglePathForRect(Rect rect, _TriangleCorner corner) {
    final p = Path();
    switch (corner) {
      case _TriangleCorner.topLeft:
        p
          ..moveTo(rect.left, rect.top)
          ..lineTo(rect.right, rect.top)
          ..lineTo(rect.left, rect.bottom);
        break;
      case _TriangleCorner.topRight:
        p
          ..moveTo(rect.left, rect.top)
          ..lineTo(rect.right, rect.top)
          ..lineTo(rect.right, rect.bottom);
        break;
      case _TriangleCorner.bottomRight:
        p
          ..moveTo(rect.right, rect.top)
          ..lineTo(rect.left, rect.bottom)
          ..lineTo(rect.right, rect.bottom);
        break;
      case _TriangleCorner.bottomLeft:
        p
          ..moveTo(rect.left, rect.top)
          ..lineTo(rect.left, rect.bottom)
          ..lineTo(rect.right, rect.bottom);
        break;
    }
    p.close();
    return p;
  }

  void _drawCenteredLabel(
    Canvas canvas,
    Rect rect,
    String text, {
    required double fontSize,
    required Color color,
  }) {
    _tileLabelPainter.text = TextSpan(
      text: text,
      style: TextStyle(
        color: color,
        fontSize: fontSize,
        fontWeight: FontWeight.w800,
        shadows: const <Shadow>[
          Shadow(color: Color(0xAA000000), blurRadius: 2, offset: Offset(0, 1)),
        ],
      ),
    );
    _tileLabelPainter.layout(minWidth: 0, maxWidth: rect.width);
    final offset = Offset(
      rect.center.dx - (_tileLabelPainter.width / 2),
      rect.center.dy - (_tileLabelPainter.height / 2),
    );
    _tileLabelPainter.paint(canvas, offset);
  }

  void _drawSteelDecoration(Canvas canvas, Rect rect, bool locked) {
    final iconRect = Rect.fromCenter(
      center: Offset(
        rect.right - (rect.width * 0.20),
        rect.top + (rect.height * 0.22),
      ),
      width: rect.width * 0.30,
      height: rect.height * 0.30,
    );
    final iconPaint = Paint()
      ..filterQuality = FilterQuality.medium
      ..colorFilter = ColorFilter.mode(
        locked ? const Color(0xFFECEFF1) : const Color(0xFFB0BEC5),
        BlendMode.modulate,
      );

    final drewAsset = _drawOptionalIcon(
      canvas: canvas,
      image: _lockIconImage,
      dstRect: iconRect,
      paint: iconPaint,
    );
    if (!drewAsset) {
      final bodyRect = Rect.fromCenter(
        center: Offset(
          iconRect.center.dx,
          iconRect.center.dy + (iconRect.height * 0.12),
        ),
        width: iconRect.width * 0.62,
        height: iconRect.height * 0.44,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          bodyRect,
          Radius.circular(iconRect.width * 0.08),
        ),
        Paint()..color = const Color(0xFFDDE4E9),
      );

      final shackleRect = Rect.fromCenter(
        center: Offset(
          iconRect.center.dx,
          iconRect.center.dy - (iconRect.height * 0.10),
        ),
        width: iconRect.width * 0.52,
        height: iconRect.height * 0.58,
      );
      canvas.drawArc(
        shackleRect,
        math.pi,
        math.pi,
        false,
        Paint()
          ..color = const Color(0xFFDDE4E9)
          ..style = PaintingStyle.stroke
          ..strokeWidth = math.max(1.1, _cellSize * 0.026),
      );
    }

    if (locked) {
      final lockFrame = Paint()
        ..color = const Color(0xAA101010)
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.0, _cellSize * 0.03);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          rect.deflate(math.max(1.0, _cellSize * 0.065)),
          Radius.circular((_cellSize * 0.14).clamp(4.0, 8.0).toDouble()),
        ),
        lockFrame,
      );
    }
  }

  void _drawCactusDecoration(Canvas canvas, Rect rect) {
    final spikePaint = Paint()
      ..color = const Color(0xBDE8F5E9)
      ..style = PaintingStyle.fill;
    final spikeCount = 4;
    final span = rect.width / (spikeCount + 1);
    for (var i = 1; i <= spikeCount; i++) {
      final x = rect.left + (span * i);
      final top = rect.top + (rect.height * 0.10);
      final baseY = rect.top + (rect.height * 0.28);
      final path = Path()
        ..moveTo(x - (span * 0.20), baseY)
        ..lineTo(x, top)
        ..lineTo(x + (span * 0.20), baseY)
        ..close();
      canvas.drawPath(path, spikePaint);
    }
  }

  void _drawBombDecoration(Canvas canvas, Rect rect) {
    final iconRect = Rect.fromCenter(
      center: Offset(
        rect.left + (rect.width * 0.27),
        rect.top + (rect.height * 0.26),
      ),
      width: rect.width * 0.30,
      height: rect.height * 0.30,
    );
    final drewAsset = _drawOptionalIcon(
      canvas: canvas,
      image: _bombIconImage,
      dstRect: iconRect,
      paint: Paint()..filterQuality = FilterQuality.medium,
    );
    if (!drewAsset) {
      final coreCenter = Offset(
        iconRect.center.dx,
        iconRect.center.dy + (iconRect.height * 0.07),
      );
      canvas.drawCircle(
        coreCenter,
        iconRect.width * 0.22,
        Paint()..color = const Color(0xFF2B2B2B),
      );
      canvas.drawLine(
        Offset(
          coreCenter.dx + (iconRect.width * 0.10),
          coreCenter.dy - (iconRect.height * 0.22),
        ),
        Offset(
          coreCenter.dx + (iconRect.width * 0.24),
          coreCenter.dy - (iconRect.height * 0.34),
        ),
        Paint()
          ..color = const Color(0xFFECEFF1)
          ..strokeWidth = math.max(1.0, _cellSize * 0.02),
      );
      canvas.drawCircle(
        Offset(
          coreCenter.dx + (iconRect.width * 0.28),
          coreCenter.dy - (iconRect.height * 0.37),
        ),
        iconRect.width * 0.05,
        Paint()..color = const Color(0xFFFFF176),
      );
    }
  }

  void _drawBallPickupToken(
    Canvas canvas,
    Rect rect,
    _GridBlock block, {
    double opacity = 1.0,
  }) {
    final hasOpacityLayer = opacity < 0.999;
    if (hasOpacityLayer) {
      canvas.saveLayer(
        rect.inflate(math.max(2.0, _cellSize * 0.08)),
        Paint()..color = Colors.white.withValues(alpha: opacity),
      );
    }
    final baseHint = RRect.fromRectAndRadius(
      rect.deflate(math.max(3.0, _cellSize * 0.20)),
      Radius.circular(math.max(4.0, _cellSize * 0.13)),
    );
    canvas.drawRRect(
      baseHint,
      Paint()
        ..color = const Color(0x223B4252)
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.0, _cellSize * 0.02),
    );

    final phase =
        (_visualElapsedSec * (_pickupBobFrequencyHz * 2 * math.pi)) +
        (block.id * 0.37);
    final bobOffset = math.sin(phase) * (_cellSize * 0.07);
    final center = Offset(rect.center.dx, rect.center.dy + bobOffset);
    final tokenRadius = math.max(6.0, _cellSize * 0.18);

    canvas.drawCircle(
      center,
      tokenRadius * 1.45,
      Paint()
        ..color = const Color(0x55FFE082)
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.2, _cellSize * 0.045),
    );
    canvas.drawCircle(
      center,
      tokenRadius * 1.95,
      Paint()
        ..color = const Color(0x22FFF59D)
        ..style = PaintingStyle.fill,
    );

    final tokenPaint = Paint()
      ..shader = dart_ui.Gradient.radial(
        center,
        tokenRadius,
        const <Color>[Color(0xFFFFF59D), Color(0xFFFFEE58), Color(0xFFFBC02D)],
        const <double>[0.0, 0.62, 1.0],
      );
    canvas.drawCircle(center, tokenRadius, tokenPaint);
    canvas.drawCircle(
      center,
      tokenRadius,
      Paint()
        ..color = const Color(0x99FFFFFF)
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.0, _cellSize * 0.025),
    );

    final iconRect = Rect.fromCircle(
      center: center,
      radius: tokenRadius * 0.75,
    );
    final drewIcon = _drawOptionalIcon(
      canvas: canvas,
      image: _plusOneIconImage,
      dstRect: iconRect,
      paint: Paint()..filterQuality = FilterQuality.medium,
    );
    if (!drewIcon) {
      _drawCenteredLabel(
        canvas,
        Rect.fromCircle(center: center, radius: tokenRadius * 1.35),
        '+1',
        fontSize: math.max(9, _cellSize * 0.24),
        color: const Color(0xFF5D4037),
      );
    }

    if (hasOpacityLayer) {
      canvas.restore();
    }
  }

  bool _drawOptionalIcon({
    required Canvas canvas,
    required dart_ui.Image? image,
    required Rect dstRect,
    Paint? paint,
  }) {
    if (image == null) {
      return false;
    }
    final src = Rect.fromLTWH(
      0,
      0,
      image.width.toDouble(),
      image.height.toDouble(),
    );
    canvas.drawImageRect(
      image,
      src,
      dstRect,
      paint ?? (Paint()..filterQuality = FilterQuality.medium),
    );
    return true;
  }

  void _drawBoss(Canvas canvas) {
    final boss = _boss;
    if (boss == null || !boss.alive) {
      return;
    }

    final rect = _bossRect(boss);
    final bgPaint = Paint()..color = Colors.black.withValues(alpha: 0.22);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        rect.inflate(math.max(1.0, _cellSize * 0.02)),
        Radius.circular(math.max(6.0, _cellSize * 0.12)),
      ),
      bgPaint,
    );
    final paint = Paint()..color = _colorForBossTier(boss.grade);
    canvas.drawRect(rect, paint);

    final border = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRect(rect, border);

    final hpText = '${boss.hp}/${boss.maxHp}';
    _hpTextPaint.render(
      canvas,
      hpText,
      Vector2(rect.center.dx, rect.center.dy),
      anchor: Anchor.center,
    );

    final hpRatio = (boss.hp / boss.maxHp).clamp(0.0, 1.0).toDouble();
    final hpBarRect = Rect.fromLTWH(rect.left, rect.top - 7, rect.width, 4);
    canvas.drawRect(hpBarRect, Paint()..color = const Color(0x66000000));
    canvas.drawRect(
      Rect.fromLTWH(
        hpBarRect.left,
        hpBarRect.top,
        hpBarRect.width * hpRatio,
        hpBarRect.height,
      ),
      Paint()..color = Colors.lightGreenAccent,
    );

    if (boss.special == _BossSpecial.steelShield && boss.steelShieldActive) {
      _hpTextPaint.render(
        canvas,
        'STEEL_LIKE',
        Vector2(rect.center.dx, rect.top + 10),
        anchor: Anchor.topCenter,
      );
    }
  }

  void _drawBalls(Canvas canvas) {
    final safeShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    final debugBallMode = _ballDebugEnabled;
    final paint = Paint()..color = const Color(0xFFF5FBFF);
    final stroke = Paint()
      ..color = const Color(0xAA263238)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.0, _cellSize * 0.022);
    final debugStroke = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final debugRing = Paint()
      ..color = const Color(0x88FFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    final debugCross = Paint()
      ..color = Colors.black
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;
    void drawDebugBallPrimitive({
      required Offset center,
      required double radius,
      bool sentinel = false,
    }) {
      canvas.drawCircle(
        center,
        sentinel ? 22 : 20,
        debugRing
          ..color = sentinel
              ? const Color(0xAA80CBC4)
              : const Color(0x88FFFFFF),
      );
      canvas.drawCircle(center, radius, Paint()..color = Colors.white);
      canvas.drawCircle(center, radius, debugStroke);
      const arm = 3.8;
      canvas.drawLine(
        Offset(center.dx - arm, center.dy),
        Offset(center.dx + arm, center.dy),
        debugCross,
      );
      canvas.drawLine(
        Offset(center.dx, center.dy - arm),
        Offset(center.dx, center.dy + arm),
        debugCross,
      );
      if (sentinel) {
        final markerPaint = Paint()
          ..color = const Color(0xFF004D40)
          ..strokeWidth = 1.3
          ..strokeCap = StrokeCap.round;
        canvas.drawLine(
          Offset(center.dx - 6.8, center.dy - 6.8),
          Offset(center.dx + 6.8, center.dy + 6.8),
          markerPaint,
        );
      }
    }

    final trailPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      _ballRenderCallCount += 1;
      if (ball.trailCount >= 2) {
        final segmentCount = ball.trailCount - 1;
        for (var i = 1; i < ball.trailCount; i++) {
          final from = ball.trailPointAt(i - 1);
          final to = ball.trailPointAt(i);
          final t = i / segmentCount;
          if (ballTrailStyleId == 'trail_dots') {
            final dotPaint = Paint()
              ..color = const Color(
                0xFFBBDEFB,
              ).withValues(alpha: 0.10 + (0.26 * t));
            canvas.drawCircle(
              to,
              math.max(0.8, ball.radius * (0.16 + (0.14 * t))),
              dotPaint,
            );
          } else {
            final widthScale = ballTrailStyleId == 'trail_long'
                ? 0.52
                : ballTrailStyleId == 'trail_comet'
                ? 0.60
                : 0.36;
            final alphaScale = ballTrailStyleId == 'trail_long'
                ? 0.34
                : ballTrailStyleId == 'trail_comet'
                ? 0.40
                : 0.24;
            trailPaint
              ..strokeWidth = math.max(
                1.0,
                ball.radius * (0.30 + (widthScale * t)),
              )
              ..color = const Color(
                0xFFBBDEFB,
              ).withValues(alpha: 0.06 + (alphaScale * t));
            canvas.drawLine(from, to, trailPaint);
          }
        }
      }
      if (ballTrailStyleId == 'trail_comet') {
        canvas.drawCircle(
          Offset(ball.position.x, ball.position.y),
          ball.radius * 1.5,
          Paint()..color = const Color(0x66E1F5FE),
        );
      }
      final center = Offset(ball.position.x, ball.position.y);
      final radius = debugBallMode
          ? math.max(ball.radius, 8.0)
          : resolveBallRadius(
              computedRadius: ball.radius,
              minRadiusPx: _minBallRadiusPx,
            );
      if (debugBallMode) {
        drawDebugBallPrimitive(center: center, radius: radius);
      } else {
        canvas.drawCircle(center, radius, paint);
        canvas.drawCircle(center, radius, stroke);
      }
    }

    final hasActive = _ballPool.any((ball) => ball.active);
    if (!hasActive && _turnState == _TurnState.aiming) {
      final center = Offset(safeShotX, _shotY);
      final idleRadius = debugBallMode
          ? math.max(
              resolveBallRadius(
                computedRadius: _cellSize * 0.15,
                minRadiusPx: _minBallRadiusPx,
              ),
              8.0,
            )
          : resolveBallRadius(
              computedRadius: _cellSize * 0.15,
              minRadiusPx: _minBallRadiusPx,
            );
      _ballRenderCallCount += 1;
      if (debugBallMode) {
        drawDebugBallPrimitive(center: center, radius: idleRadius);
      } else {
        canvas.drawCircle(
          center,
          idleRadius * 1.25,
          Paint()..color = const Color(0x55E1F5FE),
        );
        canvas.drawCircle(center, idleRadius, paint);
        canvas.drawCircle(center, idleRadius, stroke);
      }
    }

    if (debugBallMode) {
      final playfield = _playfieldRect == Rect.zero
          ? _boardRect
          : _playfieldRect;
      if (playfield != Rect.zero) {
        final sentinelCenter = _debugSentinelCenter(playfield);
        _ballRenderCallCount += 1;
        drawDebugBallPrimitive(
          center: sentinelCenter,
          radius: math.max(8.0, _minBallRadiusPx),
          sentinel: true,
        );
      }
    }
  }

  Color _colorForBlock(_GridBlock block) {
    if (blockSkinStyleId == 'block_metal') {
      switch (block.type) {
        case _BlockType.normal:
          return const Color(0xFF90A4AE);
        case _BlockType.triangle:
          return const Color(0xFF78909C);
        case _BlockType.steel:
          return block.steelLocked
              ? const Color(0xFF455A64)
              : const Color(0xFFB0BEC5);
        case _BlockType.cactus:
          return const Color(0xFF546E7A);
        case _BlockType.bomb:
          return const Color(0xFFEF5350);
        case _BlockType.ballPickup:
          return const Color(0xFFFFEE58);
      }
    }
    if (blockSkinStyleId == 'block_neon') {
      switch (block.type) {
        case _BlockType.normal:
          return const Color(0xFF29B6F6);
        case _BlockType.triangle:
          return const Color(0xFFAB47BC);
        case _BlockType.steel:
          return block.steelLocked
              ? const Color(0xFF5C6BC0)
              : const Color(0xFF7986CB);
        case _BlockType.cactus:
          return const Color(0xFF26A69A);
        case _BlockType.bomb:
          return const Color(0xFFEF5350);
        case _BlockType.ballPickup:
          return const Color(0xFFFFEE58);
      }
    }
    if (blockSkinStyleId == 'block_pastel') {
      switch (block.type) {
        case _BlockType.normal:
          return const Color(0xFF64B5F6);
        case _BlockType.triangle:
          return const Color(0xFF9575CD);
        case _BlockType.steel:
          return block.steelLocked
              ? const Color(0xFFB0BEC5)
              : const Color(0xFFCFD8DC);
        case _BlockType.cactus:
          return const Color(0xFF81C784);
        case _BlockType.bomb:
          return const Color(0xFFE57373);
        case _BlockType.ballPickup:
          return const Color(0xFFFFF176);
      }
    }

    switch (block.type) {
      case _BlockType.normal:
        return const Color(0xFF42A5F5);
      case _BlockType.triangle:
        return const Color(0xFF7E57C2);
      case _BlockType.steel:
        return block.steelLocked
            ? const Color(0xFF616161)
            : const Color(0xFFB0BEC5);
      case _BlockType.cactus:
        return const Color(0xFF43A047);
      case _BlockType.bomb:
        return const Color(0xFFE53935);
      case _BlockType.ballPickup:
        return const Color(0xFFFFEE58);
    }
  }

  VfxBlockType _toVfxBlockType(_BlockType type) {
    switch (type) {
      case _BlockType.normal:
        return VfxBlockType.normal;
      case _BlockType.triangle:
        return VfxBlockType.triangle;
      case _BlockType.steel:
        return VfxBlockType.steel;
      case _BlockType.cactus:
        return VfxBlockType.cactus;
      case _BlockType.bomb:
        return VfxBlockType.bomb;
      case _BlockType.ballPickup:
        return VfxBlockType.ballPickup;
    }
  }

  Color _colorForBossTier(BossTier tier) {
    switch (tier) {
      case BossTier.weak:
        return const Color(0xFF8BC34A);
      case BossTier.medium:
        return const Color(0xFFFF9800);
      case BossTier.strong:
        return const Color(0xFFF44336);
    }
  }

  Map<String, dynamic> exportRuntimeSnapshot() {
    final blocks = <Map<String, dynamic>>[];
    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      blocks.add(<String, dynamic>{
        'id': block.id,
        'type': block.type.name,
        'col': block.col,
        'row': block.row,
        'hp': block.hp,
        'triangleCorner': block.triangleCorner.name,
        'steelLocked': block.steelLocked,
      });
    }

    Map<String, dynamic>? bossJson;
    final boss = _boss;
    if (boss != null && boss.alive) {
      bossJson = <String, dynamic>{
        'bossId': boss.bossId,
        'codexId': boss.codexId,
        'grade': boss.grade.name,
        'width': boss.width,
        'height': boss.height,
        'col': boss.col,
        'row': boss.row,
        'hp': boss.hp,
        'maxHp': boss.maxHp,
        'special': boss.special.name,
        'alive': boss.alive,
        'steelShieldActive': boss.steelShieldActive,
      };
    }

    return <String, dynamic>{
      'runSeed': runSeed,
      'loop': _loop,
      'ownedBalls': _ownedBalls,
      'mana': _mana,
      'runGold': _runGold,
      'nextShotX': _nextShotX,
      'comboThisTurn': _comboThisTurn,
      'pickupHitCounter': _pickupHitCounter,
      'bossDamageAccumulator': _bossDamageAccumulator,
      'runMaxCombo': _runMaxCombo,
      'runBossKills': _runBossKills,
      'runTotalBlocksBroken': _runTotalBlocksBroken,
      'runBombBlocksBroken': _runBombBlocksBroken,
      'runBallPlusPickups': _runBallPlusPickups,
      'runMaxLoopReached': _runMaxLoopReached,
      'runGoal': _runGoal.name,
      'runGoalCleared': _runGoalCleared,
      'claimedMilestoneLoops': _claimedMilestoneLoops.toList(),
      'blockIdSeed': _blockIdSeed,
      'ballIdSeed': _ballIdSeed,
      'bossIdSeed': _bossIdSeed,
      'bossSpawnAttemptSeed': _bossSpawnAttemptSeed,
      'rngState': _rng.state,
      'simSpeedMultiplier': _simSpeedMultiplier,
      'replayTurnIndex': _replayTurnIndex,
      'replaySimTick': _replaySimTick,
      'activeAugmentStacks': Map<String, int>.from(_augmentStacks),
      'activeRelicStacks': Map<String, int>.from(_relicStacks),
      'blocks': blocks,
      'boss': bossJson,
    };
  }

  void _restoreSnapshot(Map<String, dynamic> snapshot) {
    _boardModel.clear();
    _newSpawnBlockIds.clear();
    _activeAugmentIds.clear();
    _augmentStacks.clear();
    _relicStacks.clear();
    _clearAimPreviewPath();
    _selfTestDone = false;
    _selfTestTimer = 0;
    _selfTestFailureReason = null;
    _selfTestOkLogged = false;
    _aimSelfTestDone = false;
    _aimSelfTestTimer = 0;
    _aimSelfTestLogged = false;
    _boardFitSelfTestDone = false;
    _boardFitSelfTestTimer = 0;
    _boardFitSelfTestLogged = false;

    _loop = (snapshot['loop'] as int?) ?? 1;
    _ownedBalls = (snapshot['ownedBalls'] as int?) ?? 1;
    _mana = (snapshot['mana'] as int?) ?? 0;
    _runGold = (snapshot['runGold'] as int?) ?? 0;
    _nextShotX =
        (snapshot['nextShotX'] as num?)?.toDouble() ?? _boardRect.center.dx;
    _nextShotX = _sanitizeShotX(_nextShotX, preferCenterForZero: true);
    _comboThisTurn = (snapshot['comboThisTurn'] as int?) ?? 0;
    _pickupHitCounter = (snapshot['pickupHitCounter'] as int?) ?? 0;
    _bossDamageAccumulator = (snapshot['bossDamageAccumulator'] as int?) ?? 0;
    _runMaxCombo = (snapshot['runMaxCombo'] as int?) ?? 0;
    _runBossKills = (snapshot['runBossKills'] as int?) ?? 0;
    _runTotalBlocksBroken = (snapshot['runTotalBlocksBroken'] as int?) ?? 0;
    _runBombBlocksBroken = (snapshot['runBombBlocksBroken'] as int?) ?? 0;
    _runBallPlusPickups = (snapshot['runBallPlusPickups'] as int?) ?? 0;
    _runMaxLoopReached = (snapshot['runMaxLoopReached'] as int?) ?? _loop;
    _runGoal = runGoalTypeFromName(snapshot['runGoal']?.toString());
    _runGoalCleared = snapshot['runGoalCleared'] == true;
    final milestoneRaw = snapshot['claimedMilestoneLoops'];
    if (milestoneRaw is List) {
      for (final value in milestoneRaw) {
        final loop = (value as num?)?.toInt();
        if (loop != null && loop > 0) {
          _claimedMilestoneLoops.add(loop);
        }
      }
    }
    _blockIdSeed = (snapshot['blockIdSeed'] as int?) ?? 0;
    _ballIdSeed = (snapshot['ballIdSeed'] as int?) ?? 0;
    _bossIdSeed = (snapshot['bossIdSeed'] as int?) ?? 1;
    _bossSpawnAttemptSeed = (snapshot['bossSpawnAttemptSeed'] as int?) ?? 0;
    final restoredRng = (snapshot['rngState'] as int?);
    if (restoredRng != null) {
      _rng.state = restoredRng;
    }
    _replayTurnIndex =
        (snapshot['replayTurnIndex'] as int?) ?? _replayTurnIndex;
    _replaySimTick = (snapshot['replaySimTick'] as int?) ?? 0;

    final speed =
        (snapshot['simSpeedMultiplier'] as int?) ?? _simSpeedMultiplier;
    setSimulationSpeed(speed);

    final augmentMapRaw = snapshot['activeAugmentStacks'];
    if (augmentMapRaw is Map) {
      augmentMapRaw.forEach((key, value) {
        final id = key.toString();
        final stack = (value as num?)?.toInt() ?? 0;
        if (stack <= 0) {
          return;
        }
        _augmentStacks[id] = stack;
        _activeAugmentIds.add(id);
      });
    }

    final relicMapRaw = snapshot['activeRelicStacks'];
    if (relicMapRaw is Map) {
      relicMapRaw.forEach((key, value) {
        final id = key.toString();
        final stack = (value as num?)?.toInt() ?? 0;
        if (stack <= 0) {
          return;
        }
        _relicStacks[id] = stack;
      });
    }

    final blocksRaw = snapshot['blocks'];
    if (blocksRaw is List) {
      for (final raw in blocksRaw) {
        if (raw is! Map) {
          continue;
        }
        final blockType = _blockTypeFromName(
          raw['type']?.toString() ?? 'normal',
        );
        final block = _GridBlock(
          id: (raw['id'] as int?) ?? _blockIdSeed++,
          type: blockType,
          col: (raw['col'] as int?) ?? 0,
          row: (raw['row'] as int?) ?? 0,
          hp: (raw['hp'] as int?) ?? 1,
          triangleCorner: _triangleCornerFromName(
            raw['triangleCorner']?.toString(),
          ),
          steelLocked: (raw['steelLocked'] as bool?) ?? false,
        );
        _blocks.add(block);
        _indexBlock(block);
      }
    }

    final bossRaw = snapshot['boss'];
    if (bossRaw is Map) {
      final maxHp = (bossRaw['maxHp'] as int?) ?? 1;
      final boss = _BossEntity(
        bossId: (bossRaw['bossId'] as int?) ?? _bossIdSeed++,
        codexId: bossRaw['codexId']?.toString() ?? GameCatalog.bosses.first.id,
        grade: _bossTierFromName(bossRaw['grade']?.toString() ?? 'weak'),
        width: (bossRaw['width'] as int?) ?? 2,
        height: (bossRaw['height'] as int?) ?? 2,
        col: (bossRaw['col'] as int?) ?? 0,
        row: (bossRaw['row'] as int?) ?? 0,
        hp: maxHp,
        special: _bossSpecialFromName(bossRaw['special']?.toString() ?? 'none'),
      );
      boss.hp = (bossRaw['hp'] as int?) ?? maxHp;
      boss.alive = (bossRaw['alive'] as bool?) ?? true;
      boss.steelShieldActive = (bossRaw['steelShieldActive'] as bool?) ?? false;
      _boss = boss;
      _syncBossCellIndex();
    } else {
      _boss = null;
      _boardModel.clearBossCells();
    }

    _turnState = _TurnState.aiming;
    _replaySimTick = 0;
    _isTurnActive = false;
    _pauseForChoice = false;
    _bombChainActive = false;
    _pendingLaunchCount = 0;
    _launchAccumulator = 0;
    _firstGroundX = null;

    for (final ball in _ballPool) {
      ball.active = false;
      ball.position.setValues(_nextShotX, _shotY);
      ball.velocity.setZero();
      ball.speed = 0;
      ball.clearTrail();
    }
  }

  _BlockType _blockTypeFromName(String name) {
    for (final type in _BlockType.values) {
      if (type.name == name) {
        return type;
      }
    }
    return _BlockType.normal;
  }

  _TriangleCorner _triangleCornerFromName(String? name) {
    if (name == null || name.isEmpty) {
      return _TriangleCorner.bottomLeft;
    }
    for (final corner in _TriangleCorner.values) {
      if (corner.name == name) {
        return corner;
      }
    }
    return _TriangleCorner.bottomLeft;
  }

  BossTier _bossTierFromName(String name) {
    for (final tier in BossTier.values) {
      if (tier.name == name) {
        return tier;
      }
    }
    return BossTier.weak;
  }

  _BossSpecial _bossSpecialFromName(String name) {
    for (final special in _BossSpecial.values) {
      if (special.name == name) {
        return special;
      }
    }
    return _BossSpecial.none;
  }

  void _syncUi() {
    final next = ui.value.copyWith(
      loop: _loop,
      gold: _runGold,
      mana: _mana,
      manaCost: character.skillManaCost,
      ownedBalls: _ownedBalls,
      combo: _comboThisTurn,
      canUseSkill: !_isWeakBossDebuffActive && _mana >= character.skillManaCost,
      skillDisabledByBoss: _isWeakBossDebuffActive,
      isTurnInProgress: _isTurnActive,
      characterName: character.name,
      activeAugmentIds: _activeAugmentIds.toList(),
      runGoalTitle: runGoalTitle,
      runGoalProgress: runGoalProgress,
      runGoalCleared: _runGoalCleared,
    );

    ui.value = next;
  }
}

