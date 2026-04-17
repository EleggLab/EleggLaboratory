# Kenney Asset Pack Mapping

Copy each downloaded pack under `assets/` with the folder names below.

- `kenney_new-platformer-pack-1.1`
  - Usage: unit sprite source root (`SpriteAssets.unitSpriteRoot`)
- `kenney_ui-pack`
  - Usage: buttons/panels/sliders (`UiAssets`)
- `kenney_game-icons`
  - Usage: system/skill/item icons (`IconAssets`)
- `kenney_impact-sounds`
  - Usage: melee hit SFX (`AudioAssets.attackMelee`)
- `kenney_digital-audio`
  - Usage: merge/ranged/level-up SFX (`AudioAssets.merge`, `attackRanged`, `levelUp`)
- `kenney_music-jingles`
  - Usage: battle result jingles (`AudioAssets.winJingle`, `loseJingle`)
- `kenney_development-essentials`
  - Usage: VFX texture (`VfxAssets.mergeGradient`)

Notes:

- Flutter image widgets use `assets/...` paths.
- Flame audio uses paths relative to `assets/`.
- `pubspec.yaml` already includes `assets/`, so nested files are picked up automatically.
