# Common Asset Usage Playbook (Pre-Integration)

## 1) 목적
이 문서는 `Asset` 폴더를 "공통 에셋 저장소"로 쓰기 위해, **지금 당장 코드 적용 없이** 어디에 어떻게 쓸 수 있는지 미리 분석한 문서다.

- 기준 위치: `Asset`
- 적용 상태: 미적용 (프로젝트 설정 파일 미변경)
- 용도: 이후 각 프로젝트에 에셋 연결 시 빠르게 의사결정하기 위한 레퍼런스

## 2) 현재 인벤토리 요약

- 팩 수: 17
- 총 파일 수: 4,852
- 총 용량: 27.47 MB
- 라이선스: 각 팩 `License.txt` 확인, 대부분 CC0 (상업/개인 사용 가능, 크레딧 권장이나 필수 아님)

주요 확장자 분포:
- `.ogg`: 714 (오디오)
- `.png`: 3,089 (비트맵)
- `.svg`: 955 (벡터)
- `.ttf`: 14 (폰트)
- `.xml`: 30 (스프라이트시트 atlas)

패키지별 볼륨(파일 수/용량):

| Pack | Files | SizeMB |
|---|---:|---:|
| kenney_sci-fi-sounds | 76 | 5.73 |
| kenney_game-icons | 434 | 3.88 |
| kenney_new-platformer-pack-1.1 | 1333 | 3.86 |
| kenney_voiceover-pack | 99 | 1.90 |
| kenney_music-jingles | 89 | 1.37 |
| kenney_ui-pack | 1315 | 1.35 |
| kenney_pattern-pack | 256 | 1.34 |
| kenney_voiceover-pack-fighter | 50 | 1.24 |
| kenney_development-essentials | 22 | 1.11 |
| kenney_digital-audio | 66 | 1.02 |
| kenney_rpg-audio | 55 | 1.00 |
| kenney_impact-sounds | 133 | 0.99 |
| kenney_interface-sounds | 103 | 0.92 |
| kenney_shape-characters | 219 | 0.62 |
| kenney_ui-audio | 55 | 0.46 |
| kenney_emotes-pack | 534 | 0.37 |
| kenney_kenney-fonts | 13 | 0.32 |

## 3) 패키지별 용도 분석

### 3.1 `kenney_development-essentials`
핵심: 개발/디버그/이펙트용 기초 텍스처.

대표 파일:
- `Asset/kenney_development-essentials/Noise/perlin-noise.png` (256x256)
- `Asset/kenney_development-essentials/Noise/perlin-noise-small.png` (256x256)
- `Asset/kenney_development-essentials/Gradient/gradient-radial.png` (256x256)
- `Asset/kenney_development-essentials/Normal map/default-normal.png` (16x16)
- `Asset/kenney_development-essentials/Checkerboard/checkerboard.png` (16x16)

추천 사용처:
- `mobile-breaking-block-augment`
  - 피격 플래시 마스크
  - 화면 떨림/노이즈 오버레이
  - 스킬/폭발 VFX 마스크
- `pc-choice-ugc`, `mobile-game-homework-checker`
  - 배경 텍스처(패턴 + 저강도 노이즈)
  - 스켈레톤 로딩 셰이딩 텍스처

### 3.2 `kenney_ui-pack`
핵심: 버튼/슬라이더/체크박스/아이콘형 UI 조각.

구조:
- `PNG/{Blue|Green|Grey|Red|Yellow}/{Default|Double}`
- `Vector/{Blue|Green|Grey|Red|Yellow}`
- `Sounds/*.ogg`
- `Font/*.ttf`

추천 사용처:
- 전 프로젝트 공통 UI 컴포넌트 시각 리소스
- `mobile-breaking-block-augment`: 탭/팝업/버튼 스킨
- `mobile-game-homework-checker`: 체크/슬라이더 UI
- `mobile-saju-fortune`: 카드형 패널/선택 버튼

### 3.3 `kenney_game-icons`
핵심: 기능 아이콘 세트 (1x/2x, 흑백 테마).

대표 아이콘:
- `gear`, `home`, `locked`, `unlocked`, `warning`, `question`, `audioOn/Off`, `musicOn/Off`

추천 사용처:
- 설정/상태/네비게이션 아이콘
- Flutter/React/Expo 모두에서 "기본 아이콘 fallback" 용도로 안정적

### 3.4 `kenney_new-platformer-pack-1.1`
핵심: 타일/캐릭터/배경/적 + 기본 게임 SFX.

구조:
- `Sprites/Backgrounds`, `Sprites/Characters`, `Sprites/Enemies`, `Sprites/Tiles`
- 각 폴더에 `Default`/`Double`
- `Spritesheets/*.xml` (atlas metadata)
- `Sounds/*.ogg`

추천 사용처:
- `mobile-breaking-block-augment` MVP placeholder 스프라이트
- 빠른 프로토타이핑용 타일/오브젝트 시각화

### 3.5 오디오 팩들

- `kenney_interface-sounds`: 클릭/토글/선택/에러 등 UI 이벤트 음
- `kenney_ui-audio`: UI 피드백 전용 짧은 효과음
- `kenney_impact-sounds`: 타격/충돌/발자국 계열
- `kenney_digital-audio`: 레이저/전자음/아케이드 SFX
- `kenney_sci-fi-sounds`: SF 엔진/문/폭발/필드 계열
- `kenney_rpg-audio`: 장비/문/환경 상호작용 계열
- `kenney_music-jingles`: 짧은 성취/시작/종료 징글
- `kenney_voiceover-pack`, `kenney_voiceover-pack-fighter`: 보이스 큐

추천 사용처:
- `mobile-breaking-block-augment`
  - 핵심: `impact`, `digital`, `sci-fi`, `music-jingles`
- `mobile-game-homework-checker`
  - 핵심: `interface-sounds`, `ui-audio`
- `mobile-saju-fortune`
  - 핵심: `ui-audio`, `music-jingles`(짧은 전환음)
- `pc-choice-ugc`
  - 핵심: `interface-sounds`, `voiceover-pack`

### 3.6 `kenney_pattern-pack`
핵심: 반복 패턴 배경 텍스처.

추천 사용처:
- 앱 배경 질감(낮은 opacity)
- 카드 배경/분리 영역 배경
- 웹/모바일 모두 경량 백그라운드로 적합

### 3.7 `kenney_shape-characters`
핵심: 단순 도형 캐릭터 파츠 조합.

추천 사용처:
- 프로토타입 NPC/캐릭터 placeholder
- 도감 잠금 실루엣(회색 처리) 원본

### 3.8 `kenney_emotes-pack`
핵심: 감정/상태 아이콘 세트 (Pixel/Vector, style 1~8).

추천 사용처:
- 상태 뱃지(위험/분노/성공/의문)
- 캐릭터 대사풍선/반응 아이콘

### 3.9 `kenney_kenney-fonts`
핵심: 게임 스타일 폰트 12종.

추천 사용처:
- 게임 타이틀/헤더 전용
- 본문은 기본 시스템 폰트 유지, 강조 텍스트에만 사용 권장

## 4) 노이즈맵/그라디언트/노멀맵 사전 활용안 (요청 핵심)

### 4.1 노이즈맵
대상 파일:
- `Asset/kenney_development-essentials/Noise/perlin-noise.png`
- `Asset/kenney_development-essentials/Noise/perlin-noise-small.png`

활용 시나리오:
1. 피격/폭발 순간의 화면 오버레이(짧은 alpha fade)
2. 보스 페이즈 전환 시 글리치 마스크
3. 어두운 배경의 밴딩 완화(아주 낮은 opacity)
4. UI 패널의 미세 질감(평면 느낌 감소)

적용 메모:
- 타일링 가능 텍스처로 다루기 쉬움
- 과한 노이즈는 가독성 저하, UI에서는 3~8% 수준 alpha 권장

### 4.2 그라디언트
대상 파일:
- `Asset/kenney_development-essentials/Gradient/gradient-radial.png`
- `Asset/kenney_development-essentials/Gradient/gradient-angular.png`
- `Asset/kenney_development-essentials/Gradient/gradient-vertical.png`

활용 시나리오:
1. 버튼 hover/pressed 상태 마스크
2. 화면 가장자리 vignette
3. 보스 경고 범위 표현(방사형)

### 4.3 노멀맵
대상 파일:
- `Asset/kenney_development-essentials/Normal map/default-normal.png`

활용 시나리오:
1. 라이트 테스트/셰이더 유닛 테스트용 기본 normal
2. 향후 2D fake lighting 프로토타입 검증

### 4.4 실전 적용 레시피(사전 설계)

1. Flutter + Flame (게임 이펙트 오버레이)
- 노이즈 텍스처를 화면 전체 스프라이트로 얹고 `opacity`를 0.03~0.12 범위에서 짧게 애니메이션.
- 히트/폭발 시만 노이즈 오버레이를 80~140ms 노출하고 즉시 제거.
- 그라디언트(`gradient-radial`)는 보스 경고 범위, 스킬 충전 링 마스크로 재사용.

2. Flutter/React 앱 UI 질감
- 카드/패널 배경에 `pattern-pack` + `perlin-noise`를 아주 낮은 알파로 합성.
- 텍스트 영역에는 노이즈를 직접 깔지 말고, 외곽 패널에만 적용해 가독성 유지.

3. 미래 셰이더 테스트용 준비
- `default-normal.png`는 실제 아트 normal 생성 전까지 광원 파이프라인 smoke test 용도.
- 커스텀 셰이더 도입 전에는 단순 오버레이 방식으로도 충분히 검증 가능.

## 5) 프로젝트별 우선 매핑

### 5.1 `mobile-breaking-block-augment` (Flutter + Flame)
우선순위 1:
- UI: `kenney_ui-pack`, `kenney_game-icons`
- 전투 SFX: `kenney_impact-sounds`, `kenney_digital-audio`, `kenney_sci-fi-sounds`
- 징글: `kenney_music-jingles`
- 이펙트 텍스처: `kenney_development-essentials` (noise/gradient)

우선순위 2:
- 임시 아트: `kenney_new-platformer-pack-1.1`, `kenney_shape-characters`

### 5.2 `mobile-game-homework-checker` (웹)
우선순위:
- UI 시각: `kenney_ui-pack`, `kenney_game-icons`
- 피드백 사운드: `kenney_interface-sounds`, `kenney_ui-audio`
- 배경 텍스처: `kenney_pattern-pack`, `development-essentials/noise`

### 5.3 `mobile-saju-fortune` (모바일 앱)
우선순위:
- 화면 질감: `kenney_pattern-pack`, `development-essentials/gradient`
- 아이콘/선택 UI: `kenney_ui-pack`, `kenney_game-icons`
- 가벼운 사운드: `kenney_ui-audio`

### 5.4 `pc-choice-ugc`
우선순위:
- 에디터/플로우 아이콘: `kenney_game-icons`
- 버튼/슬라이더: `kenney_ui-pack`
- 시스템 효과음: `kenney_interface-sounds`
- 이벤트 음성(선택): `kenney_voiceover-pack`

## 6) 운영 규칙 (적용 전)

1. 원본 보존
- `Asset`은 원본 저장소로 유지, 직접 수정 금지.

2. 경로 평탄화 금지
- 동일 파일명 중복 그룹이 많음(예: `License.txt`, emote 아이콘 다수).
- "파일명만" 기준으로 합치면 충돌 가능성이 큼.

3. 공백/특수문자 경로 주의
- 일부 경로에 공백 존재 (`Style 1`, `Normal map` 등)
- `1×1 Pixels`처럼 특수문자(×) 포함 경로 존재
- 빌드 스크립트에서 경로 quoting 필수

4. 메타 파일 분리 가능
- `.url`, `desktop.ini`, `Preview*` 파일은 런타임 번들에서 제외 후보

## 7) 이후 적용 시 권장 순서

1. 프로젝트별 `asset manifest` 작성
- 어떤 파일을 실제 번들에 넣을지 화이트리스트 정의

2. 공통 규칙 적용
- 이미지: 해상도 규칙(1x/2x), 포맷 규칙(png/svg)
- 오디오: 이벤트 키 네이밍 규칙(예: `sfx.ui.click.primary`)

3. 번들 최적화
- 미사용 에셋 제외
- Preview/URL/문서 파일 제외

---

## 8) 신규 추가 팩 평가 (2026-02-23)

신규 감지된 팩:
- `Asset/Clean RenPy GUI Kit_FShift`
- `Asset/DatingGameUI`
- `Asset/Face`
- `Asset/FREE KAWAII GUI PACK`
- `Asset/Garden cozy kit`
- `Asset/조군 개발새발 V2`

요약 판단(UGC 선택지/서브컬쳐/캐주얼 기준):
- 즉시 채택 후보: `DatingGameUI`, `Garden cozy kit`, `Clean RenPy GUI Kit_FShift`
- 조건부 채택 후보: `Face`, `FREE KAWAII GUI PACK`
- 라이선스 확인 후 채택: `조군 개발새발 V2`

### 8.1 `DatingGameUI`
특징:
- 파일: 63개 (PNG 52, PSD 8, JPG 3)
- 용량: 170.97MB (PSD 166.81MB, PNG 1.02MB)
- 구조: `Exports/*` + `PSDs/*`
- UI 흐름 단위 리소스 포함:
  - `Dialogue`, `Messaging`, `Settings`, `VictoryOrDefeat`, `HomeScreen`, `ExitPopup`

판단:
- 선택지/비주얼노벨형 UGC UI에 매우 적합.
- 다만 런타임에는 `Exports`만 사용하고 PSD는 제외 권장.

권장 사용:
- 분기 대화창/선택 버튼, 메시지 UI, 설정/종료 팝업 템플릿.

주의:
- `License.jpg`가 이미지 형태라 자동 검증이 어려움. 실제 배포 전 라이선스 원문 확인 필요.

### 8.2 `Garden cozy kit`
특징:
- 파일: 269개 (PNG 265, PSD 1, ZIP 1, TXT 2)
- 용량: 40.16MB (PSD 36.82MB, PNG 2.14MB)
- 구조: `Post/Assets/{Buttons,Icons,Collectibles,Menu Buttons,...}`
- 아이콘/버튼 조각형 리소스가 많아 조합형 UI 제작에 유리.

판단:
- 캐주얼/코지 무드 UI에 매우 적합.
- UGC 선택지 게임에서 메타 UI(코인/하트/알림/업적)에 특히 좋음.

권장 사용:
- 상단 자원바, 보상 아이콘, 사이드 메뉴 버튼, 캐주얼 테마 스킨.

주의:
- 경로 공백(`Garden cozy kit`, `Menu Buttons`) 존재. 스크립트 경로 인용(quoting) 필수.
- `Read me.txt`에 personal/commercial 사용 가능 문구 존재(원문 보관 권장).

### 8.3 `Clean RenPy GUI Kit_FShift`
특징:
- 파일: 40개 (PNG 34, TTF 3, JPG 2, PSD 1)
- 용량: 11.57MB (PSD 10.05MB, PNG 0.46MB)
- 선택지/텍스트박스/네임박스/설정 버튼 등 RenPy형 UI 구성요소 포함.
- PNG 대부분 투명 알파 포함, 해상도는 소형 조각 중심(대표 62x62 다수).

판단:
- 선택지 게임 UX에 매우 잘 맞는 경량 UI 키트.
- 현재 추가된 신규팩 중 "즉시 대체 UI"로 가장 빠르게 적용 가능.

권장 사용:
- 선택 버튼 idle/hover 상태, 대화 텍스트박스, 세이브/로드/설정 버튼군.

주의:
- 폴더명이 스타일 유니코드(`𝐆𝐔𝐈`, `𝒃𝒖𝒕𝒕𝒐𝒏𝒔`)라 일부 툴/CI에서 경로 문제 가능.
- 실제 적용 전 ASCII 경로 alias(복사본) 준비 권장.
- 라이선스 텍스트 파일 미발견(소스 페이지 재확인 필요).

### 8.4 `Face`
특징:
- 파일: PNG 18개, 512x512 통일, 전부 알파 사용.
- 표정 리소스(`Visage Sourire`, `Visage Triste`, `Visage Peur` 등) 중심.

판단:
- 대화형 UGC에서 감정 전환 초상(아바타 레이어) 용도로 유용.
- 단독 UI팩은 아니며, 캐릭터 표정 보강팩으로 보는 것이 적절.

주의:
- 파일명에 악센트/비ASCII 포함(`Énerveine` 등). 런타임 경로 키는 별도 매핑 권장.
- 라이선스 문서 미확인.

### 8.5 `FREE KAWAII GUI PACK`
특징:
- 파일: 9개 (PNG 5, PSD 2, `.DS_Store` 2)
- PNG 해상도 큼(1920x3000 다수, 3000x3000 포함), 통패널 이미지 위주.

판단:
- 스타일은 서브컬쳐/캐주얼에 맞지만 조각형 컴포넌트가 부족.
- "바로 UI 시스템 적용"보다는 시안/배경 패널용으로 적합.

주의:
- `.DS_Store`는 메타 파일이므로 배포 번들 제외.
- 라이선스 텍스트 미확인.

### 8.6 `조군 개발새발 V2`
특징:
- 폰트 2개(`.otf`, `.ttf`)
- 손글씨풍 한글 타이틀/스티커 텍스트에 적합.

판단:
- 서브컬쳐 톤 강화용으로 좋은 포인트 폰트.
- 본문 폰트로 상시 사용보다는 헤더/이벤트 텍스트 전용 권장.

주의:
- 라이선스 텍스트 미확인 상태. 배포 전 사용 범위 확인 필수.

### 8.7 UGC 선택지 게임 기준 최종 추천 세트

1차(즉시 적용 우선):
- `DatingGameUI/Exports`
- `Clean RenPy GUI Kit_FShift`의 버튼/텍스트박스
- `Garden cozy kit/Post/Assets/Icons`, `Buttons`, `Collectibles`

2차(테마 강화):
- `Face` 표정 세트
- `조군 개발새발 V2` (라이선스 확인 후)

3차(가공 후 사용):
- `FREE KAWAII GUI PACK` (패널 슬라이싱 후)

운영 메모:
- 신규팩은 PSD 비중이 매우 큼. 런타임 번들은 PNG/OGG/폰트만 화이트리스트로 묶는 것을 기본 정책으로 유지.

---

작성 메모:
- 본 문서는 2026-02-23 기준 `Asset` 폴더 실측 결과를 기반으로 작성.
- 코드/설정 적용은 의도적으로 수행하지 않음.
