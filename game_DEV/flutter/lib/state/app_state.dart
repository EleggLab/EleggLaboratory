import 'dart:async';

import 'package:flutter/widgets.dart';

import '../data/data_repository.dart';
import '../data/catalog_data.dart';
import '../data/league_catalog.dart';
import '../data/meta_catalog.dart';
import '../data/save_repository.dart';
import '../models/app_config.dart';
import '../models/daily_rewards.dart';
import '../models/daily_missions_data.dart';
import '../models/game_options.dart';
import '../models/meta_upgrades_data.dart';
import '../models/replay_data.dart';
import '../models/run_record_data.dart';
import '../models/save_data.dart';
import '../models/tutorial_data.dart';
import '../models/weekly_league_data.dart';
import '../services/ad_service.dart';
import '../services/consent_service.dart';
import '../services/crash_reporting_service.dart';
import '../services/debug_logger_service.dart';
import '../services/review_prompt_service.dart';
import '../game/debug_flags.dart';
import '../game/deterministic_rng.dart';

class AdClaimAttemptResult {
  const AdClaimAttemptResult({required this.claimed, this.message});

  final bool claimed;
  final String? message;
}

class AppState extends ChangeNotifier {
  AppState({
    required SaveRepository saveRepository,
    required this.adService,
    DataRepository? dataRepository,
    AppConfigData? appConfig,
    ConsentService? consentService,
    CrashReportingService? crashReportingService,
    ReviewPromptService? reviewPromptService,
  }) : _saveRepository = saveRepository,
       _dataRepository = dataRepository ?? DataRepository.instance,
       appConfig = appConfig ?? AppConfigData.defaults,
       _consentService = consentService ?? ConsentService(),
       _crashReportingService =
           crashReportingService ?? CrashReportingService.instance,
       _reviewPromptService =
           reviewPromptService ?? ReviewPromptService.instance;

  final SaveRepository _saveRepository;
  final IAdService adService;
  final DataRepository _dataRepository;
  final ConsentService _consentService;
  final CrashReportingService _crashReportingService;
  final ReviewPromptService _reviewPromptService;
  final AppConfigData appConfig;

  static const int saveVersion = 10;

  late SaveData _saveData;
  bool _isReady = false;
  String? _weeklyRolloverMessage;
  ConsentRuntimeSnapshot _consentSnapshot = ConsentRuntimeSnapshot.safeFallback;

  bool get isReady => _isReady;

  SaveData get saveData => _saveData;

  int get diamonds => _saveData.diamonds;
  int get bestLoop => _saveData.bestLoop;
  String get bestLoopCharacterId => _saveData.bestLoopCharacterId;
  int get bestScore => _saveData.bestScore;
  String get bestScoreCharacterId => _saveData.bestScoreCharacterId;
  Set<String> get unlockedCharacterIds => _saveData.unlockedCharacterIds;
  String get selectedCharacterId => _saveData.selectedCharacterId;
  Set<String> get codexSeenBossIds => _saveData.codexSeenBossIds;
  Set<String> get codexSeenAugmentIds => _saveData.codexSeenAugmentIds;
  DailyRewardsData get dailyRewards => _saveData.dailyRewards;
  DailyMissionsData get dailyMissions => _saveData.dailyMissions;
  GameOptionsData get gameOptions => _saveData.gameOptions;
  MetaUpgradesData get metaUpgrades => _saveData.metaUpgrades;
  bool get hasSeenTutorial => _saveData.tutorial.hasSeenTutorial;
  bool get hasActiveRun => _saveData.activeRunSnapshot != null;
  Map<String, dynamic>? get activeRunSnapshot => _saveData.activeRunSnapshot;
  Set<String> get unlockedAchievementIds => _saveData.unlockedAchievementIds;
  Set<String> get claimedAchievementIds => _saveData.claimedAchievementIds;
  Set<String> get unlockedCosmeticIds => _saveData.unlockedCosmeticIds;
  String get selectedBackgroundStyleId => _saveData.selectedBackgroundStyleId;
  String get selectedBlockSkinStyleId => _saveData.selectedBlockSkinStyleId;
  String get selectedBallTrailStyleId => _saveData.selectedBallTrailStyleId;
  List<RunRecordData> get runHistory => _saveData.runHistory;
  List<ReplayIndexEntry> get replayIndex => _saveData.replayIndex;
  WeeklyLeagueData get weeklyLeague => _saveData.weeklyLeague;
  String? get weeklyRolloverMessage => _weeklyRolloverMessage;
  ConsentRuntimeSnapshot get consentSnapshot => _consentSnapshot;
  bool get reviewPrompted => _saveData.reviewPrompted;
  int get totalDailyRunsCompleted => _saveData.totalDailyRunsCompleted;

  bool get realProductionAdsAvailable =>
      appConfig.ads.hasProductionRewardedUnit;

  List<AdMode> get availableAdModes {
    final modes = <AdMode>[AdMode.simulated, AdMode.realTest];
    if (realProductionAdsAvailable) {
      modes.add(AdMode.realProduction);
    }
    return modes;
  }

  Future<void> initialize() async {
    await _dataRepository.loadAndApply();
    final loaded = await _saveRepository.loadSave();
    final todayKey = toDateKeyLocal(DateTime.now());
    _saveData = loaded != null
        ? _normalizeLoadedSave(loaded)
        : _buildDefaultSave(todayKey: todayKey);
    if (_saveData.version != saveVersion) {
      _saveData = _saveData.copyWith(version: saveVersion);
    }
    _saveData = _normalizeMetaFields(_saveData);
    _rolloverWeeklyLeagueIfNeeded(now: DateTime.now());
    _refreshCharacterUnlockAchievements(notify: false);
    _crashReportingService.setEnabledByUser(
      _saveData.gameOptions.crashReportingEnabled,
    );
    await checkAndResetDailyRewards();
    await checkAndResetDailyMissions();
    if (_saveData.gameOptions.adMode != AdMode.simulated) {
      await refreshConsent(notify: false);
    }
    _runAchievementSelfTestIfNeeded();
    _runDailyMissionSelfTestIfNeeded();
    _runBossContentSelfTestIfNeeded();
    _isReady = true;
    notifyListeners();
  }

  Future<void> checkAndResetDailyRewards() async {
    final todayKey = toDateKeyLocal(DateTime.now());
    if (_saveData.dailyRewards.lastResetDate == todayKey) {
      return;
    }
    _saveData = _saveData.copyWith(
      dailyRewards: _saveData.dailyRewards.resetForDate(todayKey),
    );
    notifyListeners();
    await _saveRepository.saveSave(_saveData);
  }

  Future<void> checkAndResetDailyMissions() async {
    final todayKey = toDateKeyLocal(DateTime.now());
    final nextMissions = _saveData.dailyMissions.ensureDate(todayKey);
    if (identical(nextMissions, _saveData.dailyMissions)) {
      return;
    }
    _saveData = _saveData.copyWith(dailyMissions: nextMissions);
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

  Future<AdClaimAttemptResult> claimDailyRewardStepWithAd({
    required BuildContext context,
    required int stepIndex,
  }) async {
    if (!_saveData.dailyRewards.canClaimStep(stepIndex)) {
      return const AdClaimAttemptResult(
        claimed: false,
        message: 'This reward step is locked.',
      );
    }
    final accepted = await adService.showRewardedAd(
      context: context,
      placement: 'daily_reward_${stepIndex + 1}',
      rewardText: '10 diamonds',
    );
    if (!accepted) {
      final message = adService.consumeLastFailureMessage();
      return AdClaimAttemptResult(
        claimed: false,
        message: message ?? 'Ad was cancelled.',
      );
    }
    final success = claimDailyRewardStep(stepIndex);
    if (!success) {
      return const AdClaimAttemptResult(
        claimed: false,
        message: 'Reward claim failed. Try again.',
      );
    }
    return const AdClaimAttemptResult(claimed: true);
  }

  bool claimDailyMission(String missionId) {
    final mission = _saveData.dailyMissions.byId(missionId);
    if (mission == null || mission.claimed || !mission.completed) {
      return false;
    }
    final nextMissions = _saveData.dailyMissions.claimMission(missionId);
    _saveData = _saveData.copyWith(
      diamonds: _saveData.diamonds + mission.rewardDiamonds,
      dailyMissions: nextMissions,
    );
    notifyListeners();
    _persist();
    return true;
  }

  void updateDailyMissionProgress({
    int? maxLoopReached,
    int? maxComboReached,
    int bombBreakIncrement = 0,
    int bossClearIncrement = 0,
    int pickupIncrement = 0,
    bool completedDailyRun = false,
    int recallIncrement = 0,
    int shopPurchaseIncrement = 0,
    int rerollIncrement = 0,
    int augmentGainIncrement = 0,
  }) {
    final todayKey = toDateKeyLocal(DateTime.now());
    var missions = _saveData.dailyMissions.ensureDate(todayKey);
    missions = missions.updateProgress(
      maxLoopReached: maxLoopReached,
      maxComboReached: maxComboReached,
      bombBreakIncrement: bombBreakIncrement,
      bossClearIncrement: bossClearIncrement,
      pickupIncrement: pickupIncrement,
      completedDailyRun: completedDailyRun,
      recallIncrement: recallIncrement,
      shopPurchaseIncrement: shopPurchaseIncrement,
      rerollIncrement: rerollIncrement,
      augmentGainIncrement: augmentGainIncrement,
    );
    final beforeJson = _saveData.dailyMissions.toJson().toString();
    final afterJson = missions.toJson().toString();
    if (beforeJson == afterJson) {
      return;
    }
    _saveData = _saveData.copyWith(dailyMissions: missions);
    notifyListeners();
    _persist();
  }

  void recordRunProgress({
    required int maxLoopReached,
    required int maxComboReached,
    int bombBreakIncrement = 0,
    int bossClearIncrement = 0,
    int pickupIncrement = 0,
    int recallIncrement = 0,
    int shopPurchaseIncrement = 0,
    int rerollIncrement = 0,
    int augmentGainIncrement = 0,
  }) {
    updateDailyMissionProgress(
      maxLoopReached: maxLoopReached,
      maxComboReached: maxComboReached,
      bombBreakIncrement: bombBreakIncrement,
      bossClearIncrement: bossClearIncrement,
      pickupIncrement: pickupIncrement,
      recallIncrement: recallIncrement,
      shopPurchaseIncrement: shopPurchaseIncrement,
      rerollIncrement: rerollIncrement,
      augmentGainIncrement: augmentGainIncrement,
    );
  }

  void recordRunCompleted({required String mode}) {
    if (mode == 'daily') {
      _saveData = _saveData.copyWith(
        totalDailyRunsCompleted: _saveData.totalDailyRunsCompleted + 1,
      );
      notifyListeners();
      _persist();
    }
    updateDailyMissionProgress(completedDailyRun: mode == 'daily');
    unawaited(
      maybeRequestInAppReview(bossesKilled: 0, weeklyBestUpdated: false),
    );
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
    _refreshCharacterUnlockAchievements(notify: false);
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
    final seen = Set<String>.from(_saveData.codexSeenAugmentIds)
      ..add(augmentId);
    _saveData = _saveData.copyWith(codexSeenAugmentIds: seen);
    notifyListeners();
    _persist();
  }

  void recordGameOver({required int reachedLoop, required String characterId}) {
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

  void recordRunScore({required int score, required String characterId}) {
    if (score <= _saveData.bestScore) {
      return;
    }
    _saveData = _saveData.copyWith(
      bestScore: score,
      bestScoreCharacterId: characterId,
    );
    notifyListeners();
    _persist();
  }

  void addRunRecord(RunRecordData record) {
    final next = appendRunHistory(_saveData.runHistory, record, limit: 10);
    _saveData = _saveData.copyWith(runHistory: next);
    notifyListeners();
    _persist();
  }

  void addReplayIndexEntry(ReplayIndexEntry entry) {
    final current = _saveData.replayIndex;
    final filtered = current.where((e) => e.runId != entry.runId).toList();
    final next = <ReplayIndexEntry>[entry, ...filtered];
    final clamped = next.length <= 10 ? next : next.sublist(0, 10);
    _saveData = _saveData.copyWith(replayIndex: clamped);
    notifyListeners();
    _persist();
  }

  ReplayIndexEntry? replayByRunId(String runId) {
    for (final entry in _saveData.replayIndex) {
      if (entry.runId == runId) {
        return entry;
      }
    }
    return null;
  }

  bool purchaseMetaUpgrade(MetaUpgradeType type) {
    final meta = _saveData.metaUpgrades;
    if (meta.isMaxLevel(type)) {
      return false;
    }
    final cost = meta.nextCostFor(type);
    if (_saveData.diamonds < cost) {
      return false;
    }
    _saveData = _saveData.copyWith(
      diamonds: _saveData.diamonds - cost,
      metaUpgrades: meta.upgrade(type),
    );
    notifyListeners();
    _persist();
    return true;
  }

  int createClassicSeed() {
    final now = DateTime.now();
    var hash = 0x811C9DC5;
    final input = '${now.microsecondsSinceEpoch}|${_saveData.diamonds}';
    for (final unit in input.codeUnits) {
      hash ^= unit;
      hash = (hash * 0x01000193) & 0xFFFFFFFF;
    }
    if (hash == 0) {
      hash = 1;
    }
    return hash;
  }

  int dailySeedForDate(DateTime date) {
    return dailySeedFromDateKey(toDateKeyLocal(date));
  }

  String weeklyKeyForDate(DateTime date) {
    return isoWeekKey(date);
  }

  int weeklySeedForDate(DateTime date) {
    return weeklySeedFromWeekKey(isoWeekKey(date));
  }

  void recordWeeklyRunResult({required String runId, required int score}) {
    final league = _saveData.weeklyLeague;
    final bestScore = score > league.weeklyBestScore
        ? score
        : league.weeklyBestScore;
    final bestRunId = score > league.weeklyBestScore
        ? runId
        : league.weeklyBestRunId;
    _saveData = _saveData.copyWith(
      weeklyLeague: league.copyWith(
        weeklyBestScore: bestScore,
        weeklyBestRunId: bestRunId,
        weeklyAttempts: league.weeklyAttempts + 1,
      ),
    );
    notifyListeners();
    _persist();
  }

  String consumeWeeklyRolloverMessage() {
    final msg = _weeklyRolloverMessage ?? '';
    _weeklyRolloverMessage = null;
    return msg;
  }

  void saveActiveRunSnapshot(Map<String, dynamic> snapshot) {
    _saveData = _saveData.copyWith(activeRunSnapshot: snapshot);
    notifyListeners();
    _persist();
  }

  void clearActiveRunSnapshot() {
    if (_saveData.activeRunSnapshot == null) {
      return;
    }
    _saveData = _saveData.copyWith(activeRunSnapshot: null);
    notifyListeners();
    _persist();
  }

  bool isAchievementUnlocked(String achievementId) {
    return _saveData.unlockedAchievementIds.contains(achievementId);
  }

  bool isAchievementClaimed(String achievementId) {
    return _saveData.claimedAchievementIds.contains(achievementId);
  }

  bool claimAchievement(String achievementId) {
    if (!isAchievementUnlocked(achievementId) ||
        isAchievementClaimed(achievementId)) {
      return false;
    }
    AchievementCatalogItem? definition;
    for (final item in MetaCatalog.achievements) {
      if (item.id == achievementId) {
        definition = item;
        break;
      }
    }
    final reward = definition?.rewardDiamonds ?? 0;
    final nextClaimed = Set<String>.from(_saveData.claimedAchievementIds)
      ..add(achievementId);
    _saveData = _saveData.copyWith(
      diamonds: _saveData.diamonds + reward,
      claimedAchievementIds: nextClaimed,
    );
    notifyListeners();
    _persist();
    return true;
  }

  bool isCosmeticUnlocked(String cosmeticId) {
    return _saveData.unlockedCosmeticIds.contains(cosmeticId);
  }

  void markSeedCopiedAchievement() {
    _unlockAchievement('ach_seed_copy');
  }

  Set<String> registerRunAchievements(RunAchievementInput input) {
    final newlyUnlocked = <String>{};

    void tryUnlock(String id, bool shouldUnlock) {
      if (!shouldUnlock || _saveData.unlockedAchievementIds.contains(id)) {
        return;
      }
      newlyUnlocked.add(id);
    }

    tryUnlock('ach_loop_10', input.maxLoop >= 10);
    tryUnlock('ach_loop_20', input.maxLoop >= 20);
    tryUnlock('ach_loop_50', input.maxLoop >= 50);
    tryUnlock('ach_boss_first', input.bossesKilled > 0);
    tryUnlock('ach_combo_30', input.maxCombo >= 30);
    tryUnlock('ach_combo_60', input.maxCombo >= 60);
    tryUnlock('ach_unlock_3_chars', input.unlockedCharacterCount >= 3);
    tryUnlock(
      'ach_unlock_all_chars',
      input.unlockedCharacterCount >= input.totalCharacterCount,
    );
    tryUnlock('ach_buy_epic_shop', input.purchasedEpicInShop);
    tryUnlock('ach_daily_complete', input.mode == 'daily');
    tryUnlock('ach_seed_copy', input.seedCopied);
    tryUnlock('ach_run_clear', input.clearAchieved);

    if (newlyUnlocked.isEmpty) {
      return newlyUnlocked;
    }

    final achievements = Set<String>.from(_saveData.unlockedAchievementIds)
      ..addAll(newlyUnlocked);
    final cosmetics = Set<String>.from(_saveData.unlockedCosmeticIds);
    for (final cosmetic in MetaCatalog.cosmetics) {
      final unlockId = cosmetic.unlockAchievementId;
      if (unlockId == null) {
        continue;
      }
      if (achievements.contains(unlockId)) {
        cosmetics.add(cosmetic.id);
      }
    }

    _saveData = _saveData.copyWith(
      unlockedAchievementIds: achievements,
      unlockedCosmeticIds: cosmetics,
    );
    notifyListeners();
    _persist();
    return newlyUnlocked;
  }

  void selectBackgroundStyle(String styleId) {
    if (!isCosmeticUnlocked(styleId) ||
        !MetaCatalog.isKnownBackground(styleId)) {
      return;
    }
    if (_saveData.selectedBackgroundStyleId == styleId) {
      return;
    }
    _saveData = _saveData.copyWith(selectedBackgroundStyleId: styleId);
    notifyListeners();
    _persist();
  }

  void selectBlockSkinStyle(String styleId) {
    if (!isCosmeticUnlocked(styleId) ||
        !MetaCatalog.isKnownBlockSkin(styleId)) {
      return;
    }
    if (_saveData.selectedBlockSkinStyleId == styleId) {
      return;
    }
    _saveData = _saveData.copyWith(selectedBlockSkinStyleId: styleId);
    notifyListeners();
    _persist();
  }

  void selectBallTrailStyle(String styleId) {
    if (!isCosmeticUnlocked(styleId) ||
        !MetaCatalog.isKnownBallTrail(styleId)) {
      return;
    }
    if (_saveData.selectedBallTrailStyleId == styleId) {
      return;
    }
    _saveData = _saveData.copyWith(selectedBallTrailStyleId: styleId);
    notifyListeners();
    _persist();
  }

  void updateGameOptions({
    bool? sfxEnabled,
    bool? vibrationEnabled,
    VfxIntensity? vfxIntensity,
    AimLineStyle? aimLineStyle,
    AimPreviewLength? aimPreviewLength,
    UiLanguage? uiLanguage,
    int? defaultSimulationSpeed,
    AdMode? adMode,
    bool? personalizedAdsEnabled,
    bool? crashReportingEnabled,
  }) {
    final previous = _saveData.gameOptions;
    final next = _saveData.gameOptions.copyWith(
      sfxEnabled: sfxEnabled,
      vibrationEnabled: vibrationEnabled,
      vfxIntensity: vfxIntensity,
      aimLineStyle: aimLineStyle,
      aimPreviewLength: aimPreviewLength,
      uiLanguage: uiLanguage,
      defaultSimulationSpeed: defaultSimulationSpeed,
      adMode: adMode,
      personalizedAdsEnabled: personalizedAdsEnabled,
      crashReportingEnabled: crashReportingEnabled,
    );
    if (next == _saveData.gameOptions) {
      return;
    }
    _saveData = _saveData.copyWith(gameOptions: next);
    _crashReportingService.setEnabledByUser(next.crashReportingEnabled);
    notifyListeners();
    _persist();
    if (previous.adMode != next.adMode ||
        previous.personalizedAdsEnabled != next.personalizedAdsEnabled) {
      unawaited(refreshConsent());
    }
  }

  Future<void> refreshConsent({bool notify = true}) async {
    if (_saveData.gameOptions.adMode == AdMode.simulated) {
      _consentSnapshot = ConsentRuntimeSnapshot.safeFallback;
      if (notify) {
        notifyListeners();
      }
      return;
    }
    final snapshot = await _consentService.refresh(
      personalizedAdsEnabled: _saveData.gameOptions.personalizedAdsEnabled,
    );
    _consentSnapshot = snapshot;
    if (notify) {
      notifyListeners();
    }
  }

  Future<bool> showPrivacyOptionsForm() async {
    final ok = await _consentService.showPrivacyOptions();
    if (ok) {
      await refreshConsent();
    }
    return ok;
  }

  Future<bool> maybeRequestInAppReview({
    required int bossesKilled,
    required bool weeklyBestUpdated,
  }) async {
    if (_saveData.reviewPrompted) {
      return false;
    }
    final triggerByBoss = bossesKilled >= 2;
    final triggerByWeeklyBest = weeklyBestUpdated;
    final triggerByDailyRuns = _saveData.totalDailyRunsCompleted >= 3;
    if (!(triggerByBoss || triggerByWeeklyBest || triggerByDailyRuns)) {
      return false;
    }
    final requested = await _reviewPromptService.requestReviewIfAvailable();
    if (!requested) {
      return false;
    }
    _saveData = _saveData.copyWith(reviewPrompted: true);
    notifyListeners();
    _persist();
    return true;
  }

  void markTutorialSeen() {
    if (_saveData.tutorial.hasSeenTutorial) {
      return;
    }
    _saveData = _saveData.copyWith(
      tutorial: _saveData.tutorial.copyWith(hasSeenTutorial: true),
    );
    notifyListeners();
    _persist();
  }

  void resetTutorialSeen() {
    if (!_saveData.tutorial.hasSeenTutorial) {
      return;
    }
    _saveData = _saveData.copyWith(
      tutorial: _saveData.tutorial.copyWith(hasSeenTutorial: false),
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
      bestScore: 0,
      bestScoreCharacterId: GameCatalog.starterCharacterId,
      codexSeenBossIds: <String>{},
      codexSeenAugmentIds: <String>{},
      dailyRewards: DailyRewardsData.initial(todayKey),
      gameOptions: GameOptionsData.defaults,
      metaUpgrades: MetaUpgradesData.defaults,
      tutorial: TutorialData.defaults,
      activeRunSnapshot: null,
      unlockedAchievementIds: <String>{},
      claimedAchievementIds: <String>{},
      unlockedCosmeticIds: <String>{
        MetaCatalog.defaultBackgroundId,
        MetaCatalog.defaultBlockSkinId,
        MetaCatalog.defaultBallTrailId,
      },
      selectedBackgroundStyleId: MetaCatalog.defaultBackgroundId,
      selectedBlockSkinStyleId: MetaCatalog.defaultBlockSkinId,
      selectedBallTrailStyleId: MetaCatalog.defaultBallTrailId,
      dailyMissions: DailyMissionsData.generateForDate(todayKey),
      runHistory: const <RunRecordData>[],
      replayIndex: const <ReplayIndexEntry>[],
      weeklyLeague: WeeklyLeagueData.defaults(DateTime.now()),
      reviewPrompted: false,
      totalDailyRunsCompleted: 0,
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

    final selected =
        legacyCharacterMap[loaded.selectedCharacterId] ??
        loaded.selectedCharacterId;
    final bestCharacter =
        legacyCharacterMap[loaded.bestLoopCharacterId] ??
        loaded.bestLoopCharacterId;
    final bestScoreCharacter =
        legacyCharacterMap[loaded.bestScoreCharacterId] ??
        loaded.bestScoreCharacterId;

    final normalizedSeenAugments = loaded.codexSeenAugmentIds
        .map((id) => legacyAugmentMap[id] ?? id)
        .where(catalogAugmentIds.contains)
        .toSet();

    return loaded.copyWith(
      unlockedCharacterIds: normalizedUnlocked,
      selectedCharacterId: normalizedUnlocked.contains(selected)
          ? selected
          : GameCatalog.starterCharacterId,
      bestLoopCharacterId: catalogCharacterIds.contains(bestCharacter)
          ? bestCharacter
          : GameCatalog.starterCharacterId,
      bestScoreCharacterId: catalogCharacterIds.contains(bestScoreCharacter)
          ? bestScoreCharacter
          : GameCatalog.starterCharacterId,
      codexSeenAugmentIds: normalizedSeenAugments,
    );
  }

  SaveData _normalizeMetaFields(SaveData loaded) {
    final cosmetics = Set<String>.from(loaded.unlockedCosmeticIds);
    cosmetics.add(MetaCatalog.defaultBackgroundId);
    cosmetics.add(MetaCatalog.defaultBlockSkinId);
    cosmetics.add(MetaCatalog.defaultBallTrailId);

    final claimedAchievements = Set<String>.from(loaded.claimedAchievementIds);
    claimedAchievements.removeWhere(
      (id) => !loaded.unlockedAchievementIds.contains(id),
    );

    final background =
        MetaCatalog.isKnownBackground(loaded.selectedBackgroundStyleId)
        ? loaded.selectedBackgroundStyleId
        : MetaCatalog.defaultBackgroundId;
    final blockSkin =
        MetaCatalog.isKnownBlockSkin(loaded.selectedBlockSkinStyleId)
        ? loaded.selectedBlockSkinStyleId
        : MetaCatalog.defaultBlockSkinId;
    final ballTrail =
        MetaCatalog.isKnownBallTrail(loaded.selectedBallTrailStyleId)
        ? loaded.selectedBallTrailStyleId
        : MetaCatalog.defaultBallTrailId;

    final normalizedHistory = loaded.runHistory.length <= 10
        ? loaded.runHistory
        : loaded.runHistory.sublist(0, 10);
    final normalizedReplayIndex = loaded.replayIndex.length <= 10
        ? loaded.replayIndex
        : loaded.replayIndex.sublist(0, 10);

    return loaded.copyWith(
      unlockedCosmeticIds: cosmetics,
      claimedAchievementIds: claimedAchievements,
      selectedBackgroundStyleId: background,
      selectedBlockSkinStyleId: blockSkin,
      selectedBallTrailStyleId: ballTrail,
      dailyMissions: loaded.dailyMissions.ensureDate(
        toDateKeyLocal(DateTime.now()),
      ),
      runHistory: normalizedHistory,
      replayIndex: normalizedReplayIndex,
      weeklyLeague: loaded.weeklyLeague,
    );
  }

  void _unlockAchievement(String achievementId) {
    if (_saveData.unlockedAchievementIds.contains(achievementId)) {
      return;
    }
    final achievements = Set<String>.from(_saveData.unlockedAchievementIds)
      ..add(achievementId);
    final cosmetics = Set<String>.from(_saveData.unlockedCosmeticIds);
    for (final cosmetic in MetaCatalog.cosmetics) {
      if (cosmetic.unlockAchievementId == achievementId) {
        cosmetics.add(cosmetic.id);
      }
    }
    _saveData = _saveData.copyWith(
      unlockedAchievementIds: achievements,
      unlockedCosmeticIds: cosmetics,
    );
    notifyListeners();
    _persist();
  }

  void _refreshCharacterUnlockAchievements({required bool notify}) {
    final unlocked = _saveData.unlockedCharacterIds.length;
    final total = GameCatalog.characters.length;
    final achievements = Set<String>.from(_saveData.unlockedAchievementIds);
    var changed = false;
    if (unlocked >= 3 && !achievements.contains('ach_unlock_3_chars')) {
      achievements.add('ach_unlock_3_chars');
      changed = true;
    }
    if (unlocked >= total && !achievements.contains('ach_unlock_all_chars')) {
      achievements.add('ach_unlock_all_chars');
      changed = true;
    }
    if (!changed) {
      return;
    }
    final cosmetics = Set<String>.from(_saveData.unlockedCosmeticIds);
    for (final cosmetic in MetaCatalog.cosmetics) {
      final unlockId = cosmetic.unlockAchievementId;
      if (unlockId != null && achievements.contains(unlockId)) {
        cosmetics.add(cosmetic.id);
      }
    }
    _saveData = _saveData.copyWith(
      unlockedAchievementIds: achievements,
      unlockedCosmeticIds: cosmetics,
    );
    if (notify) {
      notifyListeners();
      _persist();
    }
  }

  void _rolloverWeeklyLeagueIfNeeded({required DateTime now}) {
    final league = _saveData.weeklyLeague;
    final nowKey = isoWeekKey(now);
    if (league.currentWeekKey == nowKey) {
      return;
    }

    final oldRule = LeagueCatalog.ruleFor(league.currentTier);
    WeeklyTier next = league.currentTier;
    if (league.weeklyBestScore >= oldRule.promoteScore) {
      next = nextTier(league.currentTier);
    } else if (league.weeklyBestScore < oldRule.demoteScore) {
      next = prevTier(league.currentTier);
    }

    final history = <WeeklyHistoryEntry>[
      WeeklyHistoryEntry(
        weekKey: league.currentWeekKey,
        tier: league.currentTier,
        bestScore: league.weeklyBestScore,
        attempts: league.weeklyAttempts,
      ),
      ...league.leagueHistory,
    ];
    final clampedHistory = history.length <= 12
        ? history
        : history.sublist(0, 12);

    _saveData = _saveData.copyWith(
      weeklyLeague: league.copyWith(
        currentTier: next,
        currentWeekKey: nowKey,
        weeklyBestScore: 0,
        weeklyBestRunId: '',
        weeklyAttempts: 0,
        leagueHistory: clampedHistory,
      ),
    );
    if (next != league.currentTier) {
      _weeklyRolloverMessage = 'New week: ${next.name.toUpperCase()} tier';
    } else {
      _weeklyRolloverMessage = 'New week started';
    }
    _persist();
  }

  void _persist() {
    unawaited(_saveRepository.saveSave(_saveData));
  }

  void _runAchievementSelfTestIfNeeded() {
    if (!DebugFlags.achSelfTest) {
      return;
    }
    final count = MetaCatalog.achievements.length;
    if (count >= 12) {
      DebugLoggerService.instance.info('ACH_SELFTEST_OK count=$count');
    } else {
      DebugLoggerService.instance.error('ACH_SELFTEST_FAIL:count=$count');
    }
  }

  void _runDailyMissionSelfTestIfNeeded() {
    if (!DebugFlags.dailyMissionSelfTest) {
      return;
    }
    try {
      final todayKey = toDateKeyLocal(DateTime.now());
      final today = DailyMissionsData.generateForDate(todayKey);
      if (today.missions.length != 3) {
        DebugLoggerService.instance.error(
          'DAILY_MISSION_SELFTEST_FAIL:count=${today.missions.length}',
        );
        return;
      }
      final nextDay = DailyMissionsData.generateForDate('2099-01-01');
      final rolled = today.ensureDate(nextDay.date);
      final rolledReset = rolled.missions.every(
        (mission) => mission.progress == 0 && !mission.claimed,
      );
      if (!rolledReset) {
        DebugLoggerService.instance.error(
          'DAILY_MISSION_SELFTEST_FAIL:rollover_not_reset',
        );
        return;
      }
      DebugLoggerService.instance.info('DAILY_MISSION_SELFTEST_OK');
    } catch (error) {
      DebugLoggerService.instance.error('DAILY_MISSION_SELFTEST_FAIL:$error');
    }
  }

  void _runBossContentSelfTestIfNeeded() {
    if (!DebugFlags.bossContentSelfTest) {
      return;
    }
    try {
      final count = GameCatalog.bosses.length;
      if (count < 3) {
        DebugLoggerService.instance.error(
          'BOSS_CONTENT_SELFTEST_FAIL:count=$count',
        );
        return;
      }
      DebugLoggerService.instance.info('BOSS_CONTENT_SELFTEST_OK count=$count');
    } catch (error) {
      DebugLoggerService.instance.error('BOSS_CONTENT_SELFTEST_FAIL:$error');
    }
  }
}
