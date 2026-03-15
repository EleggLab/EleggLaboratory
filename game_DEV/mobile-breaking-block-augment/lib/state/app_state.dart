import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/game_catalog.dart';
import '../data/save_repository.dart';
import '../models/daily_rewards.dart';
import '../models/save_data.dart';
import '../services/ad_service.dart';

class AppState extends ChangeNotifier {
  AppState({
    required SaveRepository saveRepository,
    required this.adService,
  }) : _saveRepository = saveRepository;

  final SaveRepository _saveRepository;
  final IAdService adService;

  static const int saveVersion = 1;

  late SaveData _saveData;
  bool _isReady = false;

  bool get isReady => _isReady;

  SaveData get saveData => _saveData;

  int get diamonds => _saveData.diamonds;
  int get bestLoop => _saveData.bestLoop;
  String get bestLoopCharacterId => _saveData.bestLoopCharacterId;
  Set<String> get unlockedCharacterIds => _saveData.unlockedCharacterIds;
  String get selectedCharacterId => _saveData.selectedCharacterId;
  Set<String> get codexSeenBossIds => _saveData.codexSeenBossIds;
  Set<String> get codexSeenAugmentIds => _saveData.codexSeenAugmentIds;
  DailyRewardsData get dailyRewards => _saveData.dailyRewards;

  Future<void> initialize() async {
    final loaded = await _saveRepository.loadSave();
    final todayKey = _toDateKey(DateTime.now());
    _saveData = loaded != null ? _normalizeLoadedSave(loaded) : _buildDefaultSave(todayKey: todayKey);
    if (_saveData.version != saveVersion) {
      _saveData = _saveData.copyWith(version: saveVersion);
    }
    await checkAndResetDailyRewards();
    _isReady = true;
    notifyListeners();
  }

  Future<void> checkAndResetDailyRewards() async {
    final todayKey = _toDateKey(DateTime.now());
    if (_saveData.dailyRewards.lastResetDate == todayKey) {
      return;
    }
    _saveData = _saveData.copyWith(
      dailyRewards: _saveData.dailyRewards.resetForDate(todayKey),
    );
    notifyListeners();
    await _saveRepository.saveSave(_saveData);
  }

  bool canClaimDailyRewardStep(int stepIndex) {
    return _saveData.dailyRewards.canClaimStep(stepIndex);
  }

  bool claimDailyRewardStep(int stepIndex) {
    if (!_saveData.dailyRewards.canClaimStep(stepIndex)) {
      return false;
    }
    _saveData = _saveData.copyWith(
      diamonds: _saveData.diamonds + 10,
      dailyRewards: _saveData.dailyRewards.claimStep(stepIndex),
    );
    notifyListeners();
    _persist();
    return true;
  }

  bool unlockCharacter(String characterId) {
    if (_saveData.unlockedCharacterIds.contains(characterId)) {
      return true;
    }
    if (_saveData.diamonds < 1) {
      return false;
    }
    final nextUnlocked = Set<String>.from(_saveData.unlockedCharacterIds)
      ..add(characterId);
    _saveData = _saveData.copyWith(
      diamonds: _saveData.diamonds - 1,
      unlockedCharacterIds: nextUnlocked,
    );
    notifyListeners();
    _persist();
    return true;
  }

  void selectCharacter(String characterId) {
    if (!_saveData.unlockedCharacterIds.contains(characterId)) {
      return;
    }
    if (_saveData.selectedCharacterId == characterId) {
      return;
    }
    _saveData = _saveData.copyWith(selectedCharacterId: characterId);
    notifyListeners();
    _persist();
  }

  void addDiamonds(int amount) {
    if (amount <= 0) {
      return;
    }
    _saveData = _saveData.copyWith(diamonds: _saveData.diamonds + amount);
    notifyListeners();
    _persist();
  }

  bool spendDiamonds(int amount) {
    if (amount <= 0) {
      return true;
    }
    if (_saveData.diamonds < amount) {
      return false;
    }
    _saveData = _saveData.copyWith(diamonds: _saveData.diamonds - amount);
    notifyListeners();
    _persist();
    return true;
  }

  void recordBossSeen(String bossId) {
    if (_saveData.codexSeenBossIds.contains(bossId)) {
      return;
    }
    final seen = Set<String>.from(_saveData.codexSeenBossIds)..add(bossId);
    _saveData = _saveData.copyWith(codexSeenBossIds: seen);
    notifyListeners();
    _persist();
  }

  void recordAugmentSeen(String augmentId) {
    if (_saveData.codexSeenAugmentIds.contains(augmentId)) {
      return;
    }
    final seen = Set<String>.from(_saveData.codexSeenAugmentIds)..add(augmentId);
    _saveData = _saveData.copyWith(codexSeenAugmentIds: seen);
    notifyListeners();
    _persist();
  }

  void recordGameOver({
    required int reachedLoop,
    required String characterId,
  }) {
    if (reachedLoop <= _saveData.bestLoop) {
      return;
    }
    _saveData = _saveData.copyWith(
      bestLoop: reachedLoop,
      bestLoopCharacterId: characterId,
    );
    notifyListeners();
    _persist();
  }

  SaveData _buildDefaultSave({required String todayKey}) {
    return SaveData(
      version: saveVersion,
      diamonds: 0,
      unlockedCharacterIds: <String>{GameCatalog.starterCharacterId},
      selectedCharacterId: GameCatalog.starterCharacterId,
      bestLoop: 0,
      bestLoopCharacterId: GameCatalog.starterCharacterId,
      codexSeenBossIds: <String>{},
      codexSeenAugmentIds: <String>{},
      dailyRewards: DailyRewardsData.initial(todayKey),
    );
  }

  SaveData _normalizeLoadedSave(SaveData loaded) {
    const legacyCharacterMap = <String, String>{
      'engineer_chocorone': 'chocorone',
      'designer_dos': 'dos',
      'subject_rat_k': 'ratk',
      'barbarian_monsung': 'monsung',
      'merchant_outer': 'outer',
    };
    const legacyAugmentMap = <String, String>{
      'augment_pickup_chain': 'augment_ball_triple',
      'augment_low_hp_double': 'augment_hp100_double',
      'augment_crit': 'augment_crit10',
      'augment_special_plus': 'augment_special_plus1',
      'augment_boss_burst': 'augment_boss_bonus',
      'augment_death_save': 'augment_revive',
      'augment_recall_damage': 'augment_recall_aoe',
      'augment_bomb_spawn_up': 'augment_more_bomb',
      'augment_cactus_spawn_up': 'augment_more_cactus',
      'augment_instant_ball': 'augment_instant_balls',
    };

    final catalogCharacterIds = GameCatalog.characters.map((e) => e.id).toSet();
    final catalogAugmentIds = GameCatalog.augments.map((e) => e.id).toSet();

    final normalizedUnlocked = loaded.unlockedCharacterIds
        .map((id) => legacyCharacterMap[id] ?? id)
        .where(catalogCharacterIds.contains)
        .toSet();
    if (normalizedUnlocked.isEmpty) {
      normalizedUnlocked.add(GameCatalog.starterCharacterId);
    }

    final selected = legacyCharacterMap[loaded.selectedCharacterId] ?? loaded.selectedCharacterId;
    final bestCharacter = legacyCharacterMap[loaded.bestLoopCharacterId] ?? loaded.bestLoopCharacterId;

    final normalizedSeenAugments = loaded.codexSeenAugmentIds
        .map((id) => legacyAugmentMap[id] ?? id)
        .where(catalogAugmentIds.contains)
        .toSet();

    return loaded.copyWith(
      unlockedCharacterIds: normalizedUnlocked,
      selectedCharacterId: normalizedUnlocked.contains(selected) ? selected : GameCatalog.starterCharacterId,
      bestLoopCharacterId: catalogCharacterIds.contains(bestCharacter)
          ? bestCharacter
          : GameCatalog.starterCharacterId,
      codexSeenAugmentIds: normalizedSeenAugments,
    );
  }

  String _toDateKey(DateTime now) {
    final year = now.year.toString().padLeft(4, '0');
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  void _persist() {
    unawaited(_saveRepository.saveSave(_saveData));
  }
}


