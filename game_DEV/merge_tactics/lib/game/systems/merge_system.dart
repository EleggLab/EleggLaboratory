import 'dart:math';

import 'package:flame/components.dart';
import 'package:flame/particles.dart';
import 'package:flame_audio/flame_audio.dart';
import 'package:flutter/material.dart';

import '../components/battle_arena.dart';
import '../components/unit_component.dart';
import '../data/asset_catalog.dart';
import '../data/units.dart';

class MergeSystem {
  MergeSystem(this.arena);

  final BattleArena arena;
  void Function()? onMergeSuccess;
  Future<Sprite?>? _mergeSpriteFuture;

  static const double _dropMergeDistance = 46;

  bool canMerge(UnitComponent unit1, UnitComponent unit2) {
    return unitFamilyId(unit1.data.id) == unitFamilyId(unit2.data.id) &&
        unit1.data.tier == unit2.data.tier &&
        unit1.data.tier < 5;
  }

  UnitComponent? executeMerge(UnitComponent source, UnitComponent target) {
    if (!canMerge(source, target)) {
      return null;
    }

    final UnitData? nextUnit = nextTierUnitById(source.data.id);
    if (nextUnit == null) {
      return null;
    }

    final Vector2 spawnPosition = target.position.clone();
    playMergeEffect(spawnPosition);

    arena.removeAllyUnit(source);
    arena.removeAllyUnit(target);

    final UnitComponent mergedUnit = arena.spawnUnitByPosition(
      unitId: nextUnit.id,
      enemy: false,
      position: spawnPosition,
    );
    onMergeSuccess?.call();
    return mergedUnit;
  }

  UnitComponent? tryMerge(String unitId) {
    final List<UnitComponent> candidates = arena.allyUnits
        .where((UnitComponent unit) => unit.data.id == unitId && unit.isAlive)
        .take(2)
        .toList();

    if (candidates.length < 2) {
      return null;
    }

    return executeMerge(candidates[0], candidates[1]);
  }

  UnitComponent? handleDropMerge(UnitComponent source) {
    if (!source.isAlive || !arena.allyUnits.contains(source)) {
      return null;
    }

    final UnitComponent? target = _findDropTarget(source);
    if (target == null) {
      source.resetPositionToDragStart();
      return null;
    }

    final UnitComponent? merged = executeMerge(source, target);
    if (merged == null) {
      source.resetPositionToDragStart();
      return null;
    }
    return merged;
  }

  UnitComponent? _findDropTarget(UnitComponent source) {
    UnitComponent? nearest;
    double nearestDistance = double.infinity;

    for (final UnitComponent candidate in arena.allyUnits) {
      if (identical(candidate, source) || !candidate.isAlive) {
        continue;
      }

      final double distance = source.position.distanceTo(candidate.position);
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }

    if (nearest == null || nearestDistance > _dropMergeDistance) {
      return null;
    }
    return nearest;
  }

  void playMergeEffect(Vector2 position) {
    _playMergeSound();
    _spawnMergeParticles(position);
  }

  Future<void> _playMergeSound() async {
    try {
      await FlameAudio.play(AudioAssets.merge);
    } catch (_) {
      // Merge VFX can run even if audio assets are not mapped yet.
    }
  }

  Future<void> _spawnMergeParticles(Vector2 position) async {
    final Sprite? mergeSprite = await _loadMergeSprite();
    arena.add(
      ParticleSystemComponent(
        position: position.clone(),
        particle: Particle.generate(
          count: 20,
          lifespan: 0.35,
          generator: (int index) {
            return AcceleratedParticle(
              position: Vector2.zero(),
              speed: Vector2(
                Random().nextDouble() * 220 - 110,
                -170 + Random().nextDouble() * 40,
              ),
              acceleration: Vector2(0, -100),
              child: mergeSprite == null
                  ? CircleParticle(
                      radius: 3,
                      paint: Paint()..color = Colors.greenAccent,
                    )
                  : SpriteParticle(sprite: mergeSprite, size: Vector2.all(22)),
            );
          },
        ),
      ),
    );
  }

  Future<Sprite?> _loadMergeSprite() {
    _mergeSpriteFuture ??= _tryLoadMergeSprite();
    return _mergeSpriteFuture!;
  }

  Future<Sprite?> _tryLoadMergeSprite() async {
    try {
      return await Sprite.load(VfxAssets.mergeGradient);
    } catch (_) {
      return null;
    }
  }
}
