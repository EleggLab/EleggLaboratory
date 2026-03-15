import 'dart:math' as math;
import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flame/palette.dart';
import 'package:flame/text.dart';
import 'package:flutter/material.dart';

import '../data/game_catalog.dart';
import '../models/augment_data.dart';
import '../models/boss_data.dart';
import '../models/character_data.dart';

class GameUiModel {
  const GameUiModel({
    required this.loop,
    required this.mana,
    required this.manaCost,
    required this.ownedBalls,
    required this.combo,
    required this.canUseSkill,
    required this.skillDisabledByBoss,
    required this.isTurnInProgress,
    required this.characterName,
    required this.activeAugmentIds,
  });

  final int loop;
  final int mana;
  final int manaCost;
  final int ownedBalls;
  final int combo;
  final bool canUseSkill;
  final bool skillDisabledByBoss;
  final bool isTurnInProgress;
  final String characterName;
  final List<String> activeAugmentIds;

  GameUiModel copyWith({
    int? loop,
    int? mana,
    int? manaCost,
    int? ownedBalls,
    int? combo,
    bool? canUseSkill,
    bool? skillDisabledByBoss,
    bool? isTurnInProgress,
    String? characterName,
    List<String>? activeAugmentIds,
  }) {
    return GameUiModel(
      loop: loop ?? this.loop,
      mana: mana ?? this.mana,
      manaCost: manaCost ?? this.manaCost,
      ownedBalls: ownedBalls ?? this.ownedBalls,
      combo: combo ?? this.combo,
      canUseSkill: canUseSkill ?? this.canUseSkill,
      skillDisabledByBoss: skillDisabledByBoss ?? this.skillDisabledByBoss,
      isTurnInProgress: isTurnInProgress ?? this.isTurnInProgress,
      characterName: characterName ?? this.characterName,
      activeAugmentIds: activeAugmentIds ?? this.activeAugmentIds,
    );
  }

  static const GameUiModel initial = GameUiModel(
    loop: 1,
    mana: 0,
    manaCost: 0,
    ownedBalls: 1,
    combo: 0,
    canUseSkill: false,
    skillDisabledByBoss: false,
    isTurnInProgress: false,
    characterName: '',
    activeAugmentIds: <String>[],
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
  });

  final String reason;
  final List<AugmentData> options;
}

class GameOverNotice {
  const GameOverNotice({required this.reachedLoop});

  final int reachedLoop;
}

enum _BlockType { normal, triangle, steel, cactus, bomb, ballPickup }

enum _BossSpecial { none, cactusReflect, bombDeath, steelShield }

enum _CollisionKind { wall, floor, block, boss }

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
    this.steelLocked = false,
  });

  final int id;
  final _BlockType type;
  int col;
  int row;
  int hp;
  bool steelLocked;
  bool alive = true;

  bool get isSpecial =>
      type == _BlockType.steel || type == _BlockType.cactus || type == _BlockType.bomb;
}

class _BossEntity {
  _BossEntity({
    required this.data,
    required this.col,
    required this.row,
    required this.hp,
    required this.special,
  }) : maxHp = hp;

  final BossCodexData data;
  int col;
  int row;
  int hp;
  final int maxHp;
  final _BossSpecial special;
  bool alive = true;
  bool steelShieldActive = false;

  int get width => data.width;
  int get height => data.height;
}

class _PooledBall {
  _PooledBall({
    required this.id,
    required this.radius,
  });

  final int id;
  double radius;
  final Vector2 position = Vector2.zero();
  final Vector2 velocity = Vector2(0, -1);
  double speed = 0;
  bool active = false;
}

class _BoardModel {
  _BoardModel({
    required this.cols,
    required this.rows,
  });

  final int cols;
  final int rows;

  Rect boardRect = Rect.zero;
  double cellSize = 1;

  final List<_GridBlock> blocks = <_GridBlock>[];
  final Map<int, _GridBlock> cellIndex = <int, _GridBlock>{};

  int cellKey(int col, int row) => (row * cols) + col;

  int worldToCellX(double x) => ((x - boardRect.left) / cellSize).floor();

  int worldToCellY(double y) => ((y - boardRect.top) / cellSize).floor();

  void clear() {
    blocks.clear();
    cellIndex.clear();
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
    if (boss != null && boss.alive) {
      if (col >= boss.col && col < boss.col + boss.width && row >= boss.row && row < boss.row + boss.height) {
        return true;
      }
    }
    return false;
  }

  Rect blockRect(_GridBlock block) {
    return Rect.fromLTWH(
      boardRect.left + (block.col * cellSize),
      boardRect.top + (block.row * cellSize),
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
}

class _PhysicsStepper {
  _PhysicsStepper({
    required this.fixedDt,
    required this.maxStepsPerFrame,
  });

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
  _BoardRenderer({
    required this.debugDraw,
  });

  bool debugDraw;

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
  final Paint aimGuidePaint = Paint()
    ..color = const Color(0x88FFFFFF)
    ..strokeWidth = 2;

  void drawBase({
    required Canvas canvas,
    required _BoardModel board,
    required int deadzoneRow,
    required double bottomCollectY,
  }) {
    if (!debugDraw) {
      return;
    }

    canvas.drawRect(board.boardRect, boardBorderPaint);

    for (var c = 1; c < board.cols; c++) {
      final x = board.boardRect.left + (board.cellSize * c);
      canvas.drawLine(Offset(x, board.boardRect.top), Offset(x, board.boardRect.bottom), gridPaint);
    }
    for (var r = 1; r < board.rows; r++) {
      final y = board.boardRect.top + (board.cellSize * r);
      canvas.drawLine(Offset(board.boardRect.left, y), Offset(board.boardRect.right, y), gridPaint);
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
    canvas.drawCircle(Offset(x, y), cellSize * 0.18, launchPointPaint);
  }

  void drawAimGuide({
    required Canvas canvas,
    required bool isAiming,
    required double shotX,
    required double shotY,
    required Vector2 aimPosition,
    required double cellSize,
  }) {
    if (!isAiming || !debugDraw) {
      return;
    }

    var dx = aimPosition.x - shotX;
    var dy = aimPosition.y - shotY;
    final length = math.sqrt(dx * dx + dy * dy);
    if (length < 1) {
      return;
    }

    dx /= length;
    dy /= length;
    if (dy >= -0.1) {
      dy = -0.1;
      final n = math.sqrt(dx * dx + dy * dy);
      dx /= n;
      dy /= n;
    }

    final end = Offset(
      shotX + dx * (cellSize * 7.5),
      shotY + dy * (cellSize * 7.5),
    );
    canvas.drawLine(Offset(shotX, shotY), end, aimGuidePaint);
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
      normal = Vector2(
        dx >= 0 ? -1 : 1,
        dy >= 0 ? -1 : 1,
      );
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

  _CollisionEvent? findEarliestCollision({
    required _BoardModel board,
    required _BossEntity? boss,
    required _PooledBall ball,
    required Vector2 p0,
    required Vector2 p1,
    required double bottomCollectY,
    required Set<int> ignoredTriggerBlockIds,
    required List<_GridBlock> candidateBuffer,
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
      if (t >= 0 && t <= 1) {
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
      if (block.type == _BlockType.ballPickup && ignoredTriggerBlockIds.contains(block.id)) {
        continue;
      }

      final hit = segmentVsExpandedAabb(
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
      final hit = segmentVsExpandedAabb(
        p0: p0,
        p1: p1,
        aabb: board.bossRect(boss),
        radius: ball.radius,
        cellX: boss.col,
        cellY: boss.row,
      );
      if (hit != null) {
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
    this.debugDraw = true,
  });

  static const int boardCols = 8;
  static const int boardRows = 12;
  static const double _fixedStep = 1 / 120;
  static const int _maxFixedStepsPerFrame = 16;
  static const int maxBouncesPerStep = 3;
  static const double launchIntervalSec = 0.05;

  static const double baseFillRate = 0.8;
  static const int minimumInstantBallFromAugment = 1;

  final CharacterData character;
  final void Function(int reachedLoop) onGameOver;
  final void Function(String bossId) onBossSeen;
  final void Function(String augmentId) onAugmentSeen;
  final bool debugDraw;

  final ValueNotifier<GameUiModel> ui = ValueNotifier<GameUiModel>(GameUiModel.initial);
  final ValueNotifier<ComboToast?> comboToast = ValueNotifier<ComboToast?>(null);
  final ValueNotifier<AugmentOffer?> augmentOffer = ValueNotifier<AugmentOffer?>(null);
  final ValueNotifier<GameOverNotice?> gameOver = ValueNotifier<GameOverNotice?>(null);

  final math.Random _rng = math.Random();
  final List<_PooledBall> _ballPool = <_PooledBall>[];
  final _BoardModel _boardModel = _BoardModel(cols: boardCols, rows: boardRows);
  final _PhysicsStepper _physicsStepper = _PhysicsStepper(
    fixedDt: _fixedStep,
    maxStepsPerFrame: _maxFixedStepsPerFrame,
  );
  final _SweptCollisionResolver _collisionResolver = _SweptCollisionResolver();
  final List<_GridBlock> _candidateBuffer = <_GridBlock>[];
  final Set<int> _ignoredTriggerBlockIdsBuffer = <int>{};
  late final _BoardRenderer _boardRenderer;

  _BossEntity? _boss;

  double _floorY = 0;
  double _shotY = 0;
  double _nextShotX = 0;

  late final TextPaint _hpTextPaint;
  late final TextPaint _hudTextPaint;

  int _loop = 1;
  int _ownedBalls = 1;
  int _comboThisTurn = 0;
  int _mana = 0;

  bool _isTurnActive = false;
  bool _isLaunching = false;
  bool _isAiming = false;
  bool _isGameOver = false;
  bool _pauseForChoice = false;

  int _launchRemaining = 0;
  double _launchAccumulator = 0;

  final Vector2 _launchDirection = Vector2(0, -1);
  final Vector2 _aimPosition = Vector2.zero();

  double? _firstGroundX;
  bool _endedByRecallThisTurn = false;

  final Set<String> _activeAugmentIds = <String>{};
  int _pickupHitCounter = 0;
  int _bossDamageAccumulator = 0;

  bool _pendingBossAugment = false;

  int _blockIdSeed = 0;
  int _ballIdSeed = 0;

  List<_GridBlock> get _blocks => _boardModel.blocks;

  Rect get _boardRect => _boardModel.boardRect;

  set _boardRect(Rect value) => _boardModel.boardRect = value;

  double get _cellSize => _boardModel.cellSize;

  set _cellSize(double value) => _boardModel.cellSize = value;

  @override
  Future<void> onLoad() async {
    _hpTextPaint = TextPaint(
      style: const TextStyle(
        color: Colors.white,
        fontSize: 12,
        fontWeight: FontWeight.bold,
      ),
    );
    _hudTextPaint = TextPaint(
      style: const TextStyle(
        color: Colors.white,
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
    );
    _boardRenderer = _BoardRenderer(debugDraw: debugDraw);

    for (var i = 0; i < 64; i++) {
      _ballPool.add(_PooledBall(id: _ballIdSeed++, radius: 5));
    }

    _spawnInitialBoard();
    _syncUi();
    _offerAugments(reason: '런 시작 증강 선택');
  }

  @override
  void onGameResize(Vector2 canvasSize) {
    super.onGameResize(canvasSize);
    final maxBoardWidth = canvasSize.x * 0.92;
    final maxBoardHeight = (canvasSize.y - 220).clamp(200, canvasSize.y).toDouble();
    _cellSize = math.min(maxBoardWidth / boardCols, maxBoardHeight / boardRows).toDouble();
    final boardWidth = _cellSize * boardCols;
    final boardHeight = _cellSize * boardRows;

    _boardRect = Rect.fromLTWH(
      (canvasSize.x - boardWidth) / 2,
      (canvasSize.y - boardHeight) / 2,
      boardWidth,
      boardHeight,
    );

    _floorY = _boardRect.bottom + (_cellSize * 0.25);
    _shotY = (_boardRect.bottom + (_cellSize * 0.75)).clamp(0, canvasSize.y - 12).toDouble();

    if (_nextShotX == 0) {
      _nextShotX = _boardRect.center.dx;
    } else {
      _nextShotX = _nextShotX
          .clamp(_boardRect.left + _cellSize * 0.5, _boardRect.right - _cellSize * 0.5)
          .toDouble();
    }

    final targetRadius = _cellSize * 0.15;
    for (final ball in _ballPool) {
      ball.radius = targetRadius;
      if (!ball.active) {
        ball.position.setValues(_nextShotX, _shotY);
      }
    }
  }

  @override
  void update(double dt) {
    super.update(dt);

    _physicsStepper.simulate(
      dt: dt,
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
    _boardRenderer.drawBase(
      canvas: canvas,
      board: _boardModel,
      deadzoneRow: _isStrongBossDebuffActive ? boardRows - 2 : boardRows - 1,
      bottomCollectY: _floorY,
    );
    _drawBlocks(canvas);
    _drawBoss(canvas);
    _drawBalls(canvas);
    _boardRenderer.drawLaunchPoint(
      canvas: canvas,
      x: _nextShotX,
      y: _shotY,
      cellSize: _cellSize,
    );
    _boardRenderer.drawAimGuide(
      canvas: canvas,
      isAiming: _isAiming,
      shotX: _nextShotX,
      shotY: _shotY,
      aimPosition: _aimPosition,
      cellSize: _cellSize,
    );

    _hudTextPaint.render(
      canvas,
      'Ball ${_ownedBalls}  Mana $_mana',
      Vector2(_boardRect.left, _boardRect.top - 22),
      anchor: Anchor.topLeft,
    );
  }

  void beginAim(Offset position) {
    if (_pauseForChoice || _isGameOver || _isTurnActive) {
      return;
    }

    if ((position.dy - _shotY).abs() > (_cellSize * 1.2)) {
      return;
    }

    _isAiming = true;
    _aimPosition.setValues(position.dx, position.dy);
  }

  void updateAim(Offset position) {
    if (!_isAiming || _pauseForChoice || _isTurnActive || _isGameOver) {
      return;
    }
    _aimPosition.setValues(position.dx, position.dy);
  }

  void endAim() {
    if (!_isAiming || _pauseForChoice || _isTurnActive || _isGameOver) {
      _isAiming = false;
      return;
    }

    _isAiming = false;

    final direction = Vector2(_aimPosition.x - _nextShotX, _aimPosition.y - _shotY);
    if (direction.length < 8) {
      return;
    }

    direction.normalize();
    if (direction.y >= -0.1) {
      direction.y = -0.1;
      direction.normalize();
    }

    _startTurnWithDirection(direction);
  }

  void useCharacterSkill() {
    if (_isGameOver || _pauseForChoice) {
      return;
    }
    if (_isWeakBossDebuffActive) {
      return;
    }
    if (_mana < character.skillManaCost) {
      return;
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

    _syncUi();
  }

  void forceRecall() {
    if (_isGameOver || !_isTurnActive) {
      return;
    }

    double? closestX;
    var maxY = -1.0;
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      if (ball.position.y > maxY) {
        maxY = ball.position.y;
        closestX = ball.position.x;
      }
      ball.active = false;
      ball.velocity.setZero();
      ball.speed = 0;
      ball.position.setValues(_nextShotX, _shotY);
    }

    if (closestX != null) {
      _nextShotX = closestX
          .clamp(_boardRect.left + _cellSize * 0.5, _boardRect.right - _cellSize * 0.5)
          .toDouble();
    }

    _launchRemaining = 0;
    _isLaunching = false;
    _endedByRecallThisTurn = true;

    _finishTurn();
  }

  void selectAugment(String augmentId) {
    final offer = augmentOffer.value;
    if (offer == null) {
      return;
    }

    final valid = offer.options.any((option) => option.id == augmentId);
    if (!valid) {
      return;
    }

    _activeAugmentIds.add(augmentId);
    onAugmentSeen(augmentId);

    if (augmentId == 'augment_instant_balls') {
      final gain = math.max(minimumInstantBallFromAugment, _loop ~/ 10);
      _ownedBalls += gain;
    }

    _pauseForChoice = false;
    augmentOffer.value = null;
    overlays.remove('augmentPicker');

    _syncUi();
  }

  List<AugmentData> activeAugmentList() {
    return _activeAugmentIds.map(GameCatalog.augmentById).toList();
  }

  void clearComboToast() {
    comboToast.value = null;
  }

  void clearGameOverNotice() {
    gameOver.value = null;
  }

  void _spawnInitialBoard() {
    _boardModel.clear();
    _boss = null;
    _loop = 1;
    _ownedBalls = 1;
    _comboThisTurn = 0;
    _mana = 0;
    _pickupHitCounter = 0;
    _bossDamageAccumulator = 0;
    _nextShotX = 0;
    _pendingBossAugment = false;
    _physicsStepper.reset();

    _spawnTopRow();
    _spawnGuaranteedPickup();
  }

  void _startTurnWithDirection(Vector2 direction) {
    if (_pauseForChoice || _isGameOver) {
      return;
    }

    _isTurnActive = true;
    _comboThisTurn = 0;
    _endedByRecallThisTurn = false;
    _firstGroundX = null;

    _launchDirection
      ..setFrom(direction)
      ..normalize();

    _launchRemaining = _effectiveBallCountThisTurn();
    _launchAccumulator = launchIntervalSec;
    _isLaunching = true;

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
    if (_launchRemaining <= 0) {
      return;
    }

    final ball = _acquireBall();
    ball.active = true;
    ball.position.setValues(_nextShotX, _shotY);
    ball.speed = _cellSize * 18;
    ball.velocity
      ..setFrom(_launchDirection)
      ..normalize();

    _launchRemaining -= 1;
  }

  _PooledBall _acquireBall() {
    for (final ball in _ballPool) {
      if (!ball.active) {
        return ball;
      }
    }

    final ball = _PooledBall(id: _ballIdSeed++, radius: _cellSize * 0.15);
    _ballPool.add(ball);
    return ball;
  }

  void _simulateFixedStep(double dt) {
    _updateLaunch(dt);
    _updateBallsSwept(dt);

    if (_isTurnActive && !_isLaunching && !_hasAnyActiveBall()) {
      _finishTurn();
    }
  }

  void _updateLaunch(double dt) {
    if (!_isLaunching) {
      return;
    }

    _launchAccumulator += dt;
    while (_launchRemaining > 0 && _launchAccumulator >= launchIntervalSec) {
      _launchAccumulator -= launchIntervalSec;
      _launchBall();
    }

    if (_launchRemaining <= 0) {
      _isLaunching = false;
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

    while (remainingDt > 1e-6 && ball.active && bounceCount < maxBouncesPerStep) {
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
        bounced = true;
      } else if (collision.kind == _CollisionKind.block) {
        final block = collision.block;
        if (block != null && block.alive) {
          bounced = _handleBlockCollision(
            ball: ball,
            block: block,
            normal: collision.normal,
            ignoredTriggerBlockIds: ignoredTriggerBlockIds,
          );
        }
      } else if (collision.kind == _CollisionKind.boss) {
        final boss = collision.boss;
        if (boss != null && boss.alive) {
          bounced = _handleBossCollision(ball: ball, boss: boss, normal: collision.normal);
        }
      }

      if (bounced) {
        bounceCount += 1;
      }

      remainingDt = remainingDt * (1.0 - collision.toi);
      if (collision.toi <= 1e-6) {
        remainingDt -= 1e-6;
      }
      if (remainingDt < 0) {
        remainingDt = 0;
      }
    }

    if (ball.active && ball.position.y >= _floorY) {
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
    );
  }

  bool _handleBlockCollision({
    required _PooledBall ball,
    required _GridBlock block,
    required Vector2 normal,
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
  }) {
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
    _destroyBlock(block);
    _ownedBalls += 1;

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
    if (_firstGroundX == null) {
      _firstGroundX = ball.position.x;
    }
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

    if (_activeAugmentIds.contains('augment_crit10') && _rng.nextDouble() < 0.1) {
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

    boss.alive = false;
    _comboThisTurn += 1;
    onBossSeen(boss.data.id);

    if (boss.special == _BossSpecial.bombDeath) {
      _triggerBossBombDeath(boss);
    }

    _pendingBossAugment = true;
    _syncUi();
  }

  void _destroyBlock(_GridBlock block) {
    if (!block.alive) {
      return;
    }

    _removeBlockIndex(block);
    block.alive = false;
    _comboThisTurn += 1;

    if (_boss != null && _boss!.alive && _boss!.special == _BossSpecial.steelShield) {
      _boss!.steelShieldActive = false;
    }

    _unlockAdjacentSteels(block.col, block.row);

    if (block.type == _BlockType.bomb) {
      _triggerBombExplosion(block.col, block.row);
    }
  }

  void _triggerBombExplosion(int centerCol, int centerRow) {
    final queue = <_GridBlock>[];

    for (final block in _blocks) {
      if (!block.alive || (block.col == centerCol && block.row == centerRow)) {
        continue;
      }
      if ((block.col - centerCol).abs() <= 1 && (block.row - centerRow).abs() <= 1) {
        queue.add(block);
      }
    }

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

    final boss = _boss;
    if (boss != null && boss.alive && _isCellAdjacentToBoss(centerCol, centerRow, boss)) {
      final reduced = boss.hp ~/ 2;
      if (reduced <= 0) {
        _applyDamageToBoss(boss, boss.hp);
      } else {
        boss.hp = reduced;
      }
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

  void _triggerBossBombDeath(_BossEntity boss) {
    for (var c = boss.col; c < boss.col + boss.width; c++) {
      for (var r = boss.row; r < boss.row + boss.height; r++) {
        _triggerBombExplosion(c, r);
      }
    }
  }

  void _unlockAdjacentSteels(int col, int row) {
    for (final block in _blocks) {
      if (!block.alive || block.type != _BlockType.steel || !block.steelLocked) {
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

    _isTurnActive = false;
    _isLaunching = false;
    _launchRemaining = 0;

    if (!_endedByRecallThisTurn && _firstGroundX != null) {
      _nextShotX = _firstGroundX!
          .clamp(_boardRect.left + _cellSize * 0.5, _boardRect.right - _cellSize * 0.5)
          .toDouble();
    }

    if (_endedByRecallThisTurn && _activeAugmentIds.contains('augment_recall_aoe')) {
      _damageAllBlocks(10, includeBoss: true);
    }

    _applyManaGain();

    _descendBlocksAndBoss();
    _loop += 1;

    _spawnTopRow();
    _spawnGuaranteedPickup();

    if (_checkDeadzoneOrDeathSave()) {
      _syncUi();
      return;
    }

    if (_boss == null || !_boss!.alive) {
      if (_loop % 20 == 0) {
        _spawnBossForLoop();
      }
    }

    if (_pendingBossAugment) {
      _pendingBossAugment = false;
      _offerAugments(reason: '보스 처치 증강 선택');
    }

    _syncUi();
  }

  void _applyManaGain() {
    final bonus = _tierBonus(_comboThisTurn);
    final gain = _comboThisTurn + 1 + bonus;
    _mana += gain;

    final toast = ComboToast(
      message: 'Combo $_comboThisTurn / Mana +$gain',
      color: _tierColor(_comboThisTurn),
    );
    comboToast.value = toast;
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

  void _descendBlocksAndBoss() {
    final descendAmount = _isStrongBossDebuffActive ? 2 : 1;

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      block.row += descendAmount;
    }

    final boss = _boss;
    if (boss != null && boss.alive) {
      boss.row += descendAmount;
    }

    _blocks.removeWhere((block) => !block.alive);
    _rebuildBlockIndex();
  }

  bool _checkDeadzoneOrDeathSave() {
    final deadzoneRow = _isStrongBossDebuffActive ? boardRows - 2 : boardRows - 1;

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
      _activeAugmentIds.remove('augment_revive');
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
      }
    }
    _blocks.removeWhere((block) => !block.alive);

    final boss = _boss;
    if (boss != null && boss.alive) {
      if ((boss.row + boss.height - 1) >= minRow) {
        boss.alive = false;
        _pendingBossAugment = false;
      }
    }
  }

  void _triggerGameOver() {
    if (_isGameOver) {
      return;
    }

    _isGameOver = true;
    _isTurnActive = false;
    _isLaunching = false;

    final reachedLoop = _loop;
    onGameOver(reachedLoop);
    gameOver.value = GameOverNotice(reachedLoop: reachedLoop);
  }

  void _spawnTopRow() {
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
        steelLocked: type == _BlockType.steel,
      );
      _blocks.add(block);
      _indexBlock(block);
    }

    _blocks.removeWhere((block) => !block.alive);
  }

  List<MapEntry<_BlockType, int>> _buildSpawnWeights() {
    var bombWeight = 8;
    var cactusWeight = 8;

    if (_activeAugmentIds.contains('augment_more_bomb')) {
      bombWeight += 10;
    }
    if (_activeAugmentIds.contains('augment_more_cactus')) {
      cactusWeight += 10;
    }

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

  void _spawnGuaranteedPickup() {
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
  }

  bool _isCellOccupied(int col, int row) {
    return _boardModel.isCellOccupied(col, row, boss: _boss);
  }

  void _spawnBossForLoop() {
    final template = GameCatalog.bosses[_rng.nextInt(GameCatalog.bosses.length)];
    final maxCol = boardCols - template.width;
    final spawnCol = maxCol <= 0 ? 0 : _rng.nextInt(maxCol + 1);

    final hp = _calculateBossHp(template);
    final special = _rollBossSpecial(template.tier);

    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }
      final overlapsBossSpawn = block.col >= spawnCol &&
          block.col < spawnCol + template.width &&
          block.row >= 0 &&
          block.row < template.height;
      if (overlapsBossSpawn) {
        _removeBlockIndex(block);
        block.alive = false;
      }
    }
    _blocks.removeWhere((block) => !block.alive);

    final boss = _BossEntity(
      data: template,
      col: spawnCol,
      row: 0,
      hp: hp,
      special: special,
    );

    if (special == _BossSpecial.steelShield) {
      boss.steelShieldActive = true;
    }

    _boss = boss;
    onBossSeen(template.id);
  }

  int _calculateBossHp(BossCodexData template) {
    final sizeFactor = (template.width * template.height) / 4;
    switch (template.tier) {
      case BossTier.weak:
        return (_loop * 1.5 * sizeFactor).ceil();
      case BossTier.medium:
        return (_loop * 2.0 * sizeFactor).ceil();
      case BossTier.strong:
        return (_loop * 3.0 * sizeFactor).ceil();
    }
  }

  _BossSpecial _rollBossSpecial(BossTier tier) {
    if (tier != BossTier.medium) {
      return _BossSpecial.none;
    }

    final options = <_BossSpecial>[
      _BossSpecial.cactusReflect,
      _BossSpecial.bombDeath,
      _BossSpecial.steelShield,
    ];
    return options[_rng.nextInt(options.length)];
  }

  bool get _isWeakBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.data.tier == BossTier.weak;
  }

  bool get _isMediumBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.data.tier == BossTier.medium;
  }

  bool get _isStrongBossDebuffActive {
    final boss = _boss;
    return boss != null && boss.alive && boss.data.tier == BossTier.strong;
  }

  void _offerAugments({required String reason}) {
    final options = _rollAugmentOptions();
    if (options.isEmpty) {
      return;
    }

    _pauseForChoice = true;
    augmentOffer.value = AugmentOffer(reason: reason, options: options);
    overlays.add('augmentPicker');
  }

  List<AugmentData> _rollAugmentOptions() {
    final pool = List<AugmentData>.from(GameCatalog.augments)
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
    if (surfaceNormal.x.abs() <= normalEps && surfaceNormal.y.abs() <= normalEps) {
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
    if (surfaceNormal.x.abs() <= normalEps && surfaceNormal.y.abs() <= normalEps) {
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
      if (candidate.x.abs() >= minComponent && candidate.y.abs() >= minComponent) {
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

  bool _hasAnyActiveBall() {
    for (final ball in _ballPool) {
      if (ball.active) {
        return true;
      }
    }
    return false;
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

  void _drawBlocks(Canvas canvas) {
    for (final block in _blocks) {
      if (!block.alive) {
        continue;
      }

      final rect = _blockRect(block);
      final color = _colorForBlock(block);
      final paint = Paint()..color = color;
      canvas.drawRect(rect, paint);

      if (block.type == _BlockType.ballPickup) {
        _hpTextPaint.render(
          canvas,
          '+1',
          Vector2(rect.center.dx, rect.center.dy),
          anchor: Anchor.center,
        );
        continue;
      }

      final label = block.hp > 0 ? '${block.hp}' : '0';
      _hpTextPaint.render(
        canvas,
        label,
        Vector2(rect.center.dx, rect.center.dy),
        anchor: Anchor.center,
      );

      if (block.type == _BlockType.steel && block.steelLocked) {
        final lockPaint = Paint()
          ..color = const Color(0xAA000000)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
        canvas.drawRect(rect.deflate(3), lockPaint);
      }
    }
  }

  void _drawBoss(Canvas canvas) {
    final boss = _boss;
    if (boss == null || !boss.alive) {
      return;
    }

    final rect = _bossRect(boss);
    final paint = Paint()..color = _colorForBossTier(boss.data.tier);
    canvas.drawRect(rect, paint);

    final border = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRect(rect, border);

    final hpText = '${boss.hp}/${boss.maxHp}';
    _hpTextPaint.render(canvas, hpText, Vector2(rect.center.dx, rect.center.dy), anchor: Anchor.center);

    if (boss.special == _BossSpecial.steelShield && boss.steelShieldActive) {
      _hpTextPaint.render(
        canvas,
        'LOCK',
        Vector2(rect.center.dx, rect.top + 10),
        anchor: Anchor.topCenter,
      );
    }
  }

  void _drawBalls(Canvas canvas) {
    final paint = Paint()..color = const Color(0xFFE3F2FD);
    for (final ball in _ballPool) {
      if (!ball.active) {
        continue;
      }
      canvas.drawCircle(Offset(ball.position.x, ball.position.y), ball.radius, paint);
    }
  }

  Color _colorForBlock(_GridBlock block) {
    switch (block.type) {
      case _BlockType.normal:
        return const Color(0xFF42A5F5);
      case _BlockType.triangle:
        return const Color(0xFF7E57C2);
      case _BlockType.steel:
        return block.steelLocked ? const Color(0xFF616161) : const Color(0xFFB0BEC5);
      case _BlockType.cactus:
        return const Color(0xFF43A047);
      case _BlockType.bomb:
        return const Color(0xFFE53935);
      case _BlockType.ballPickup:
        return const Color(0xFFFFEE58);
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

  void _syncUi() {
    final next = ui.value.copyWith(
      loop: _loop,
      mana: _mana,
      manaCost: character.skillManaCost,
      ownedBalls: _ownedBalls,
      combo: _comboThisTurn,
      canUseSkill: !_isWeakBossDebuffActive && _mana >= character.skillManaCost,
      skillDisabledByBoss: _isWeakBossDebuffActive,
      isTurnInProgress: _isTurnActive,
      characterName: character.name,
      activeAugmentIds: _activeAugmentIds.toList(),
    );

    ui.value = next;
  }
}



