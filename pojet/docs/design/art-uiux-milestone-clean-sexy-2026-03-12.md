# Pojet 아트/UIUX 개선 마일스톤 (Clean + Sexy Tone)

작성일: 2026-03-12  
작성 기준: 실제 플레이테스트 캡처 + 최신 UI/UX 가이드 리서치

## 1) 플레이테스트 캡처 근거
- 캡처 경로: `reports/ui-capture/`
- 데스크톱: `06-onboarding-desktop.png`, `08-first-event-desktop.png`, `09-after-choice-desktop.png`, `10-midrun-desktop.png`
- 모바일: `11-midrun-mobile.png`, `12-onboarding-mobile.png`

## 2) 캡처 기반 문제점 (자가 진단)

### A. 톤/아트 정체성 문제 (우선순위: P0)
- 현재 초상(좌측)이 SD/마스코트형에 가까워, "다크 성인 판타지" 톤과 충돌.
- 성인 게임임을 시각적으로 즉시 인지시키는 장치(조명, 질감, 인물 실루엣, 의상 디테일)가 약함.
- 결과: 플레이어가 서사 텍스트가 강해도 "야한 게임" 인상을 초반에 강하게 못 받음.

### B. 정보 밀도 과다 (P0)
- 중앙 로그 카드가 길고 촘촘해 스캔성이 떨어짐.
- 핵심 정보(현재 이벤트/선택/결과/리스크)가 로그 본문과 섞여 시선 분산 발생.
- 결과: "1로그 1선택" 리듬보다 "긴 운영 로그 읽기" 느낌이 강함.

### C. 대비/가독성 부족 (P1)
- 다크 배경 위 중간 채도 텍스트가 많아, 장시간 읽기 피로가 큼.
- 선택 버튼/태그/보조 텍스트가 유사 톤이라 정보 계층이 약함.

### D. 반응형 구조 문제 (P0)
- 모바일 캡처에서 시작 모달/패널 레이아웃이 세로 공간을 과점유.
- 본문 이벤트와 선택지가 초기 뷰포트에서 바로 확인되지 않음.
- 결과: 모바일에서 초반 이탈 가능성 높음.

### E. 인터랙션 시그널 부족 (P1)
- 포커스/호버/선택 상태 강조가 약해 조작 피드백이 즉각적이지 않음.
- 자동 진행/수동 선택 모드의 차이가 시각적으로 충분히 구분되지 않음.

## 3) 리서치 핵심 인사이트 (요약)

### 접근성/가독성 기준
- 본문 대비 4.5:1 이상, 대형 텍스트 3:1 이상 권장 (WCAG/XAG).
- 텍스트 블록은 line-height 1.5, 문단 간 2x, letter/word spacing 여유 권장.
- 모바일 터치 타겟 최소 44x44pt(Apple), WCAG 최소 24x24 CSS px 기준.

### 밀도/계층 기준
- 공간(white space)으로 계층을 만들고 과밀 UI를 완화해야 탐색 피로 감소.
- 4px 단위 spacing ramp와 일관된 타이포 램프로 스캔성을 높이는 것이 효과적.

### 반응형 기준
- 작은 화면에서 "재배치(Reflow)" 중심으로 핵심 액션(선택지)을 최상단 우선 노출.
- 모바일은 패널 축약/접기와 점진적 공개(Progressive disclosure) 적용이 필수.

## 4) 목표 비주얼 디렉션 (Clean Sexy Dark)

### 아트 방향
- 키워드: `obsidian`, `wine red`, `aged gold`, `candle light`, `velvet shadow`.
- 감각 포인트: 노골적 노출 대신, 실루엣/피부 하이라이트/소재 질감으로 관능 연출.
- 금지: 코믹 SD 비율, 과도한 네온, 장식 과다.

### UI 방향
- 카드 수 감축 + 정보 묶음 재편.
- 선택지 버튼을 가장 시각적으로 강하게.
- 중앙: 현재 이벤트 1개 집중, 과거 로그는 접힌 형태 기본.

## 5) 상세 마일스톤 (실행 순서)

## M1. 비주얼 토큰 리빌드 (1일)
- 작업
  - 색 토큰 재정의: 배경/표면/포커스/경고/성인강조 5계층.
  - 타이포 스케일 재정의: 본문/보조/제목/배지 고정.
  - 패딩/간격을 4px 램프 기반으로 정렬.
- 산출물
  - `styles.css` 루트 토큰 블록 교체.
  - `docs/design/art-style-tokens.md` 작성.
- 완료 기준
  - 본문 대비 4.5:1 이상, 액션 버튼 대비 3:1 이상.

## M2. 레이아웃 재구성 (2일)
- 작업
  - 데스크톱 3열 유지하되, 중앙 우선 폭 확대.
  - 좌측 패널은 "초상/관계 핵심"만 상단 고정, 나머지는 접기.
  - 우측 패널은 요약형 위젯으로 축약(자원/퀘스트/최근변화).
- 산출물
  - `styles.css` grid/section 구조 개편.
  - `index.html` 패널 섹션 접기 토글 추가.
- 완료 기준
  - 첫 화면에서 이벤트 제목+본문+선택지 한 번에 인지 가능.

## M3. 이벤트/선택 UX 집중화 (2일)
- 작업
  - "현재 이벤트 카드"와 "과거 로그 카드" 스타일 완전 분리.
  - 선택 버튼 최소 높이 44px, 1차 액션 색상 고정.
  - 리스크/보상/성인 톤 힌트를 아이콘+텍스트로 간결 표기.
- 산출물
  - `app.js` 이벤트 메타 렌더링 개선.
  - `styles.css` `.event-card`, `.choices`, `.log-card` 전면 조정.
- 완료 기준
  - 선택지까지 스크롤 없이 도달(데스크톱 1080p 기준).

## M4. 성인 톤 아트팩 1차 적용 (3일)
- 작업
  - 초상 기본 에셋을 성인 다크 판타지 비율로 교체(비-SD).
  - 종족/클래스별 베이스 + 표정 + 이펙트 레이어 최소 3단 구성.
  - 배경 5종(도시, 아카데미, 뒷골목, 성소, 은신처) 우선 적용.
- 산출물
  - `assets/characters/*`, `assets/backgrounds/*` 신규 반영.
  - `data/presentation/*-map.json` 매핑 확장.
- 완료 기준
  - 시작 3이벤트 내 성인 톤 시각 신호(초상/배경/오버레이) 확인 가능.

## M5. 모바일 퍼스트 리플로우 (2일)
- 작업
  - 390x844 기준: 선택지/현재 이벤트 상단 우선 배치.
  - 시작 모달을 단계형(기본 > 고급)으로 분리.
  - 패널은 아코디언/탭으로 축약해 본문 가림 최소화.
- 산출물
  - `@media` 구간 2단계(<=1100, <=768) 세분화.
  - 모바일 전용 토글 컴포넌트 추가.
- 완료 기준
  - 모바일 첫 뷰에 "이벤트 제목 + 본문 첫 문단 + 선택지 1개 이상" 노출.

## M6. 모션/피드백/포커스 접근성 (1일)
- 작업
  - 포커스 링 2px 이상, 상태 대비 강화.
  - 선택 클릭 시 카드 전환 모션 120~180ms로 짧고 명확하게.
  - `prefers-reduced-motion` 대응 추가.
- 산출물
  - 버튼/카드/탭 포커스 스타일 통일.
  - 모션 감소 모드 스타일 분기.
- 완료 기준
  - 키보드 탐색 시 현재 포커스 위치를 즉시 식별 가능.

## M7. QA/회귀/캡처 검증 (1일)
- 작업
  - 자동 플레이 캡처(데스크톱/모바일) 재생성.
  - 체크리스트 기반 시각 QA + 문구 가독 QA.
  - 100회 시뮬레이션 로그와 UI 깨짐 여부 교차 검증.
- 산출물
  - `reports/ui-capture/` 비교 캡처.
  - `reports/qa/uiux-art-regression-YYYY-MM-DD.md`
- 완료 기준
  - 치명 UI 깨짐 0건, 선택 불가 상태 0건, 텍스트 오버플로우 0건.

## 6) 적용 우선순위
1. M1 (토큰)  
2. M2 (레이아웃)  
3. M3 (이벤트/선택 집중)  
4. M5 (모바일 리플로우)  
5. M4 (아트팩 교체)  
6. M6 (모션/포커스)  
7. M7 (최종 검증)

## 7) 외부 리서치 링크
- WCAG 2.2 Contrast Minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG 2.2 Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 Text Spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- WCAG 2.2 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- Xbox Accessibility Guideline 101 (Text Display): https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
- Xbox Accessibility Guideline 102 (Contrast): https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
- Fluent 2 Layout: https://fluent2.microsoft.design/layout
- Fluent 2 Typography: https://fluent2.microsoft.design/typography
- Fluent 2 Color: https://fluent2.microsoft.design/color
- Apple UI Design Tips: https://developer.apple.com/design/tips/

