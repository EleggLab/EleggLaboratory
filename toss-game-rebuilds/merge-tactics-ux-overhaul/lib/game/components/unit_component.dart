import 'dart:math';

import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flutter/material.dart';

import '../data/units.dart';

class UnitComponent extends PositionComponent with DragCallbacks {
  UnitComponent({
    required this.data,
    required this.isEnemy,
    required Vector2 position,
    this.statMultiplier = 1.0,
    this.onDragReleased,
    this.canStartDrag,
  }) : currentHp = data.hp * statMultiplier,
       super(position: position, size: Vector2(52, 52), anchor: Anchor.center);

  final UnitData data;
  final bool isEnemy;
  final double statMultiplier;
  final void Function(UnitComponent source)? onDragReleased;
  final bool Function()? canStartDrag;
  double currentHp;
  double attackCooldown = 0;
  double skillCooldown = 0;

  late final RectangleComponent _hpBar;
  Vector2? _dragStartPosition;
  bool _isDragging = false;

  bool get isAlive => currentHp > 0;
  double get maxHp => data.hp * statMultiplier;
  double get attackPower => data.attack * statMultiplier;
  double get defensePower => data.defense * statMultiplier;
  Vector2? get dragStartPosition => _dragStartPosition?.clone();

  @override
  Future<void> onLoad() async {
    final Color bodyColor = isEnemy
        ? const Color(0xFFB44444)
        : const Color(0xFF3D7DDA);

    add(
      RectangleComponent(
        size: size,
        paint: Paint()..color = bodyColor,
        anchor: Anchor.center,
      ),
    );

    _hpBar = RectangleComponent(
      position: Vector2(-size.x / 2, -size.y / 2 - 6),
      size: Vector2(size.x, 4),
      paint: Paint()..color = const Color(0xFF6AE28D),
      anchor: Anchor.topLeft,
    );
    add(_hpBar);

    add(
      TextComponent(
        text: 'T${data.tier}',
        textRenderer: TextPaint(
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 10,
          ),
        ),
        anchor: Anchor.center,
      ),
    );
  }

  @override
  void update(double dt) {
    super.update(dt);
    final double ratio = max(0, min(1, currentHp / maxHp));
    _hpBar.size.x = size.x * ratio;
  }

  double attackValue() {
    return attackPower;
  }

  void receiveDamage(double value) {
    currentHp = max(0, currentHp - value);
  }

  void heal(double value) {
    currentHp = min(maxHp, currentHp + value);
  }

  @override
  void onDragStart(DragStartEvent event) {
    super.onDragStart(event);
    if (isEnemy || !isAlive) {
      return;
    }
    if (canStartDrag != null && !canStartDrag!()) {
      return;
    }
    _isDragging = true;
    _dragStartPosition = position.clone();
    priority = 20;
  }

  @override
  void onDragUpdate(DragUpdateEvent event) {
    super.onDragUpdate(event);
    if (!_isDragging) {
      return;
    }
    position += event.localDelta;
  }

  @override
  void onDragEnd(DragEndEvent event) {
    super.onDragEnd(event);
    if (!_isDragging) {
      return;
    }
    _isDragging = false;
    priority = 0;
    onDragReleased?.call(this);
  }

  void resetPositionToDragStart() {
    final Vector2? start = _dragStartPosition;
    if (start == null) {
      return;
    }
    position = start;
  }

  void resetCombatState({required double initialSkillCooldown}) {
    attackCooldown = 0;
    skillCooldown = initialSkillCooldown;
  }
}
