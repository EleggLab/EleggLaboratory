# UI/UX Research & Plan (2026-02-18)

## Scope
- Android 단독 앱에서 홈/게임추가 UX를 모바일 중심으로 개선
- 크래시 없는 흐름(게임 추가 -> 프리셋/수동설정 -> 홈 반영) 확보
- 접근성, 정보 계층, 행동 전환(완료 체크) 명확화

## Research Notes
1. Android Core app quality (User experience)
- 가이드라인은 일관된 Android 상호작용/시각 패턴과 사용성 테스트를 요구한다.
- 반영: 홈/추가 화면 모두 `Scaffold + TopAppBar + Material3` 패턴으로 통일.

2. Compose accessibility API defaults
- 클릭 가능한 요소는 최소 48dp 터치 타겟 권장.
- 반영: 하단 주요 액션 버튼 높이를 52dp로 통일, 카드 액션/버튼 밀도 재조정.

3. Compose window size classes
- width 기준 compact/medium/expanded를 상태로 다루고 동적으로 적응해야 한다.
- 반영: 2열 카드 기반 구조 유지 + 콘텐츠 우선순위 기반 배치(상단 요약 -> 상태 배너 -> 카드).

4. Compose app bars guidance
- Top/Bottom app bar는 네비게이션/핵심 액션을 일관되게 노출해야 함.
- 반영: 홈은 정보 아이콘 + 하단 핵심 액션(게임 추가/전체 초기화), 추가화면은 Back + 검색/필터.

5. Engagement research (Bell et al., JMIR mHealth 2023; Lin et al., WWW 2018)
- 알림은 단기 재방문에는 유효하지만 장기 이탈 방지에는 제한적.
- 장기 리텐션은 "목표 달성/재진입" 맥락을 반영한 UX가 중요.
- 반영: 과한 자극 대신 숙제 완료 상태와 남은시간/플레이시간을 한 카드 안에 명료하게 통합.

## Implemented UX Changes
### Home
- 진행 요약 카드(완료수/퍼센트/진행바) 상단 고정
- 권한 미허용 배너를 경고 컨테이너로 명확히 분리
- 빈 상태 카드 + 즉시 게임 추가 CTA 제공
- 게임 카드 정보 계층 개선
  - 1순위: 남은 시간
  - 2순위: 리셋 시각(KST), 오늘 플레이 시간
  - 3순위: 완료 배지/탭 힌트
- 하단 액션 버튼을 동등 가중치 2개로 고정

### Add Game
- 검색 필드에 검색 아이콘/명확한 라벨 적용
- 필터칩/등록 카운트 배지로 현재 컨텍스트 가시화
- 목록 아이템에 앱 아이콘 + 설치/등록 상태칩 + 추가/제거 CTA 분리
- 프리셋 매칭 다이얼로그에서 신뢰도/스코어/근거 노출
- 수동 설정 다이얼로그 유지(시간 입력 + 이름 수정)

### Accessibility
- 아이콘 `contentDescription` 전달 경로 추가
- 터치 타겟 최소 크기 준수(주요 버튼)

## QA Result
- 빌드: `:app:assembleDebug` 성공
- 유닛테스트: `:app:testDebugUnitTest` 성공
- 에뮬레이터 수동 QA (Pixel_9_Pro)
  - 홈 -> 게임 추가 이동 성공
  - 추가 버튼 탭 시 수동설정 다이얼로그 정상 표시
  - 저장 후 홈 복귀 정상
  - "게임 제거"는 홈에 노출되지 않고 게임 추가 화면에서만 노출됨

## Next Sprint Plan
1. WindowSizeClass 실제 도입(Compact/Medium에 따라 Grid 열 수 및 카드 밀도 자동 조절)
2. 홈 카드 상태 전환 애니메이션(`animateDpAsState`, `AnimatedContent`) 추가
3. 색약/고대비 모드 QA 및 스크린리더 포커스 순서 테스트
4. "오늘 리셋까지 남은 시간" 위젯형 요약(상단 콤팩트 모드) 실험

## References
- https://developer.android.com/docs/quality-guidelines/core-app-quality
- https://developer.android.com/develop/ui/compose/accessibility/api-defaults
- https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
- https://developer.android.com/develop/ui/compose/components/app-bars
- https://developer.android.com/develop/ui/compose/animation/quick-guide
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10337295/
- https://arxiv.org/abs/1802.08972
