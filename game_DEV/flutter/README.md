# Breaking a Block Augment (Flutter + Flame MVP)

Android 세로 전용 브릭브레이커 로그라이크 MVP입니다.

## 실행

```bash
.\run-tests.cmd
.\run-android.cmd
```

또는 PowerShell에서:

```powershell
.\scripts\setup_and_test.ps1
.\scripts\run_android.ps1
```

`flutter`가 PATH에 없어도 `android/local.properties`의 `flutter.sdk`를 읽어서 실행합니다.

### Windows 주의

- `shared_preferences`, `google_mobile_ads` 같은 플러그인이 있으면 `flutter pub get` 시 심볼릭 링크 권한이 필요합니다.
- `scripts/setup_and_test.ps1`는 Developer Mode가 꺼져 있으면 자동으로 `--no-pub` 모드(`analyze/test`만)로 실행합니다.
- 전체 세팅을 완료하려면 Windows 설정에서 Developer Mode를 켜고 다시 실행하세요.

## 구조

```text
lib/
  main.dart
  data/
    game_catalog.dart
    save_repository.dart
  models/
    augment_data.dart
    boss_data.dart
    character_data.dart
    daily_rewards.dart
    save_data.dart
  services/
    ad_service.dart
    storage_service.dart
  state/
    app_state.dart
  ui/
    app_shell.dart
    tabs/
      ad_reward_tab.dart
      home_tab.dart
      codex_tab.dart
    screens/
      game_screen.dart
    widgets/
      diamond_header.dart
  game/
    breaking_block_game.dart
```

## 주요 구현

- 아웃게임 3탭: 광고보상 / 홈 / 도감
- 상단 다이아 상시 표시
- 일일 광고보상 5단계 순차 수령 + 날짜 변경 시 전체 리셋
- 캐릭터 해금/장착 (다이아 1)
- 저장: `shared_preferences` + JSON 버전 필드
- 인게임:
  - 8x12 보드, 드래그 에임 + 릴리즈 연사(0.05초)
  - 턴 종료/강제 회수/nextShotX 규칙
  - 콤보 기반 마나 획득 티어 보너스
  - 블럭 타입(normal/triangle/steel/cactus/bomb/ball+1)
  - 20루프 보스, tier 디버프, medium 특수효과
  - 증강 10종, 시작/보스 처치 3지선다
  - 캐릭터 5종 스킬
  - 공 오브젝트 풀링

## 광고 연동

- 현재 `FakeAdService`로 확인 다이얼로그 후 즉시 보상 지급
- `IAdService` 추상화로 분리됨
- `RealAdService`는 AdMob Rewarded 교체용 TODO 스텁
