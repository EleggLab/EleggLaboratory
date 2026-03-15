import '../data/catalog_data.dart';
import '../models/character_data.dart';
import '../models/game_options.dart';
import 'breaking_block_game.dart';

class ConfiguredBreakingBlockGame extends BreakingBlockGame {
  ConfiguredBreakingBlockGame({
    required String selectedCharacterId,
    super.uiLanguage = UiLanguage.ko,
    required super.onGameOver,
    required super.onBossSeen,
    required super.onAugmentSeen,
    super.onReplayShot,
    super.onReplayRecall,
    super.onReplaySkill,
    super.onReplayChooseAugment,
    super.onRunGoalReward,
    super.startingGoldBonus = 0,
    super.runSeed = 1,
    super.initialRngState,
    super.initialSnapshot,
    super.initialSimulationSpeed = 1,
    super.blockSkinStyleId = 'block_default',
    super.ballTrailStyleId = 'trail_default',
    super.debugDraw = false,
  }) : super(character: _resolveCharacter(selectedCharacterId));

  static CharacterData _resolveCharacter(String selectedCharacterId) {
    final hasSelected = GameCatalog.characters.any(
      (character) => character.id == selectedCharacterId,
    );
    final resolvedId = hasSelected
        ? selectedCharacterId
        : GameCatalog.starterCharacterId;
    return GameCatalog.characterById(resolvedId);
  }
}
