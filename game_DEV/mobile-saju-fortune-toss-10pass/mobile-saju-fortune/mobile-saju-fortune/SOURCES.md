# SOURCES

## Research Summary
- Date: 2026-02-15
- Method: Official docs + primary repository READMEs + public API pages + generated sitemap catalog.
- Total researched links: 122
- Full catalog: `docs/RESEARCH_LINKS.md`

## R1. Year/Month Pillar Rule Choice
- Decision: default `yearPillarRule=ipchun`, `monthPillarRule=solarTerms`; keep options for `lunarNewYear` and `lunarMonth`.
- URLs:
  - https://github.com/yhj1024/manseryeok
  - https://github.com/waterbeside/lunisolar/blob/master/packages/lunisolar/docs/faq.md
  - https://astro.kasi.re.kr/information/pageView/31
- Applied:
  - option selectors in web/mobile
  - rule version labels in metadata/UI

## R2. Ja-si Boundary (23:00~01:00)
- Decision: default `23-01_nextDay`; provide `23-01_sameDay` and `configurable`.
- URLs:
  - https://github.com/waterbeside/lunisolar/blob/master/packages/lunisolar/docs/faq.md
  - https://github.com/yhj1024/manseryeok
- Applied:
  - rule options in core schema, web UI, and tests

## R3. Cross-validation Strategy (KASI/data.go.kr vs engines)
- Decision: keep production compute deterministic in core, run public API checks in dev scripts.
- URLs:
  - https://astro.kasi.re.kr/information/pageView/31
  - https://www.data.go.kr/data/15012679/openapi.do
  - https://github.com/yhj1024/manseryeok
  - https://github.com/6tail/lunar-javascript
  - https://github.com/usingsky/KoreanLunarCalendar
- Applied:
  - `packages/tools/src/verify-kasi.ts`
  - `packages/tools/src/verify-cross.ts`

## R4. Library Scope/License Comparison
- Decision: keep `manseryeok` for base pillars, `korean-lunar-calendar` for conversion, `lunar-javascript` for term/cross checks.
- URLs:
  - https://github.com/yhj1024/manseryeok
  - https://github.com/usingsky/KoreanLunarCalendar
  - https://github.com/6tail/lunar-javascript
- Applied:
  - conversion module switched to `korean-lunar-calendar`
  - ipchun boundary bug fix via term-year selection

## R5. Q&A/자연어 해석(템플릿 기반, AI 제거)
- Decision: LLM 없이, 계산 결과(JSON) + 규칙/템플릿(Q&A)로만 자연어 풀이를 제공한다.
- URLs:
  - https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny
  - https://www.masterseanchan.com/blog/ten-gods-bazi-profile-how-its-done/
  - https://novamastersconsulting.com/introduction-to-the-10-gods-in-bazi/
  - https://destinyi.com/bazi/ten-gods/cheat-sheet
- Applied:
  - `packages/core/src/explain/narrative.ts`: 종합 풀이(자연어) 생성기
  - `packages/core/src/explain/qna.ts`: Q&A 템플릿 컨텍스트/포맷터
  - `apps/web/components/QnaPanel.tsx`: 분야별 Q&A(전체/연/월 보기)
  - `packages/data/src/rules/qna_snippets.v1.json`: Q&A 템플릿(출처 URL 포함)
  - `packages/core/src/luck/monthLuck.ts`: 월운(근사) 계산(양력 15일 12:00 앵커)
  - `apps/web/app/api/month-luck/route.ts`: core 월운 계산을 그대로 노출(API)
  - `apps/mobile/app/(tabs)/saju/index.tsx`: 앱에서도 동일한 자연어/Q&A 로직을 사용

## R6. UX/Rendering references (web/mobile/charts)
- URLs:
  - https://nextjs.org/docs/app/getting-started/route-handlers
  - https://nextjs.org/docs/app/api-reference
  - https://echarts.apache.org/handbook/en/get-started/
  - https://docs.expo.dev/get-started/
  - https://reactnative.dev/docs/getting-started
- Applied:
  - web route handlers set `dynamic='force-dynamic'`
  - chart accessibility (`aria.enabled`) enabled
  - mobile input->compute->summary flow using shared core

## R7. Competitive Benchmark (Korean fortune/saju apps, popularity proxy)
- Decision: use **Google Play downloads** as a public proxy, and adopt the most common UX patterns (home-first, bottom tabs, daily pages, tarot, report-style saju).
- URLs (Google Play installs):
  - https://play.google.com/store/apps/details?id=com.techlabs.JPUN (점신, 5M+)
  - https://play.google.com/store/apps/details?id=com.fatekorea.forcetrller (포스텔러, 1M+)
  - https://play.google.com/store/apps/details?id=com.interest.apps.fortunetelling (운세비결, 1M+)
  - https://play.google.com/store/apps/details?id=com.wonkwang.wonkwangmanse (원광만세력, 500K+)
- URLs (major web portals fortune sections):
  - https://fortune.naver.com/
  - https://fortune.daum.net/
  - https://fortune.nate.com/
- Applied:
  - `docs/COMPETITORS.md`: 경쟁 앱 정리(인기 proxy + 공통 UX 패턴)
  - `apps/mobile/app/(tabs)/_components/GameTabBar.tsx`: 게임형 하단바(홈 중앙)
  - `apps/mobile/app/(tabs)/home.tsx`: 홈 먼저 진입(퀵 액세스)
  - `apps/mobile/app/(tabs)/today.tsx`: 별자리+12지신 “매일 고정” 스크롤 페이지

## R8. Result Display Patterns from High-Adoption Apps
- Decision: move to report-first output style (결과표 -> 자연어 리포트 -> Q&A -> 연/월 선택). 웹은 테스트용, 앱이 주력.
- URLs:
  - https://apps.apple.com/tr/app/%EC%9B%90%EA%B4%91%EB%A7%8C%EC%84%B8%EB%A0%A5/id1130206135
  - https://play.google.com/store/apps/details?id=com.techlabs.JPUN
  - https://play.google.com/store/apps/details?id=com.fatekorea.forcetrller
- Applied:
  - `apps/web/components/SajuCalculatorClient.tsx`: 보고서형 요약 카드(한눈/오행/십성) 추가
  - `apps/web/components/SajuCalculatorClient.tsx`: 상세 탭 섹션을 접기형(`details`)으로 재구성
  - `apps/web/app/globals.css`: report/section/chip 스타일 추가
  - `apps/mobile/app/(tabs)/saju/index.tsx`: 결과표 + 자연어 리포트 + Q&A를 한 흐름으로 배치

## R9. Tarot / I Ching References (no AI)
- Decision: tarot uses public domain RWS imagery; I Ching (주역점) uses "time-tap" interaction as the core gimmick.
- URLs:
  - https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg (Public domain mark / PD info)
  - http://xn--bj5b42bgu.com/index.jsp (Korean I Ching time-based flow reference)
- Applied:
  - `apps/mobile/app/(tabs)/tarot/*`: 자동 셔플/선택/결과 + 오늘 1회 저장
  - `apps/mobile/app/(tabs)/iching.tsx`: 초 단위 시각 탭 기반 주역점

## Additional primary references
- https://arxiv.org/abs/2510.23337
- https://arxiv.org/pdf/2510.23337

## R10. Mobile UI polish (translucent hero, card-forward details, reversed tarot)
- Decision: keep the top hero blocks short and scannable, use translucent overlays for consistency, keep tarot/daily detail imagery in strict card aspect, and render reversed tarot with true 180deg rotation.
- URLs:
  - https://m3.material.io/components/navigation-bar/overview
  - https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=141%2C143#contrast-minimum
  - https://reactnative.dev/docs/images
  - https://apps.apple.com/us/app/tarot-card-reading/id549976310
  - https://apps.apple.com/us/app/daily-horoscope-astrology/id808936087
- Applied:
  - `apps/mobile/lib/ui/commonStyles.ts`: hero block to translucent dark glass style
  - `apps/mobile/app/(tabs)/home.tsx`: removed verbose hint, single-line hero copy
  - `apps/mobile/app/(tabs)/tarot/index.tsx`: simplified hero copy for faster scan
  - `apps/mobile/app/(tabs)/tarot/reading.tsx`: concise hero copy + reversed orientation preview
  - `apps/mobile/app/(tabs)/tarot/result.tsx`: reversed cards rendered with real 180deg rotation
  - `apps/mobile/lib/features/tarot/imageSource.ts`: reduced crop aggressiveness (`scale: 1.22`)
  - `apps/mobile/app/(tabs)/today.tsx`: zodiac/chinese detail image upgraded to large card-style frame
  - `apps/mobile/app/(tabs)/saju/index.tsx`: added consistent translucent hero + `분야별 Q&A` labeling

## R11. Background framing / card readability / motion tuning
- Decision: force background centering on web previews, keep top overlays short, prefer card-frame outlines with `contain` for tarot art, and add explicit shuffle feedback state.
- URLs:
  - https://reactnative.dev/docs/imagebackground
  - https://reactnative.dev/docs/images.html
  - https://m1.material.io/components/cards.html
  - https://m1.material.io/components/bottom-navigation.html
  - https://developer.apple.com/design/human-interface-guidelines/
  - https://developer.apple.com/design/tips/
- Applied:
  - `apps/mobile/lib/ui/ScreenScroll.tsx`: centered background image style for web (`objectPosition: center`)
  - `apps/mobile/app/(tabs)/home.tsx`: compact hero + character speech bubble interaction
  - `apps/mobile/app/(tabs)/today.tsx`: concise hero copy (“해당 별자리/12지신 클릭”)
  - `apps/mobile/app/(tabs)/tarot/TarotCardTile.tsx`: cleaner outlined front, simplified back design, shuffle motion animation
  - `apps/mobile/app/(tabs)/tarot/reading.tsx`: stronger shuffle state (`섞는 중...`) and timed reseed animation
  - `apps/mobile/app/(tabs)/tarot/result.tsx`: outlined card frame + `contain` rendering + true reversed rotation

## R12. 2024+ 경쟁앱 대규모 리서치 (100개 이상 충족)
- Decision: Google Play 기준으로 2024-01-01 이후 출시 유사 앱을 자동 수집/정제하고(320개), UI 패턴을 "짧은 상단 메시지 + 카드 중심 + 부드러운 전환 + 명확한 CTA"로 정리해 반영.
- URLs:
  - https://play.google.com/store/apps/details?id=com.koreantarot.app
  - https://play.google.com/store/apps/details?id=coocent.horoscope.astrology.tarot
  - https://play.google.com/store/apps/details?id=com.understandiching.ichingdivination
  - https://play.google.com/store/apps/details?id=org.yakovliev.myzodiacai
  - https://play.google.com/store/apps/details?id=com.pixelbyte.tarot
  - Full 320 URL catalog: `docs/COMPETITORS_2024PLUS.md`
- Applied:
  - `packages/tools/src/collect-competitors-2024.ts`: 2024+ 경쟁앱 자동 수집/필터 스크립트 추가
  - `docs/research/competitive-apps-2024plus.json`: 수집 원본 데이터(320개)
  - `docs/COMPETITORS_2024PLUS.md`: 320개 앱 URL/출시일/장르 표
  - `apps/mobile/app/(tabs)/_components/SectionCard.tsx`: 과하지 않은 카드 등장 모션 + 미세 그림자
  - `apps/mobile/app/(tabs)/tarot/TarotCardTile.tsx`: 카드별 스태거 셔플 모션(딜 느낌 강화)
  - `apps/mobile/app/(tabs)/tarot/reading.tsx`: 셔플 타이밍 확장(시각 피드백 강화)
  - `apps/mobile/app/(tabs)/home.tsx`: 말풍선 문장 전환 페이드/리프트 모션

## R13. 2024+ 유사 웹 리서치(100+), 트래픽 기반 큐레이션
- Decision:
  - 웹 기반 유사 서비스는 TAAFT의 `Released X ago` + `views` 신호를 사용해 2024+와 인기도를 1차 필터링했다.
  - `views >= 500`, 도메인 키워드 필터, 명백한 노이즈(`interior design`) 제거 후 104개를 유지했다.
  - 결과는 `core`(직접 키워드 일치)와 `adjacent`(소스 맥락 일치)로 분리해 후속 적용 검토에 사용한다.
- URLs:
  - https://theresanaiforthat.com/s/astrology/
  - https://theresanaiforthat.com/s/tarot/
  - https://theresanaiforthat.com/s/horoscope/
  - https://theresanaiforthat.com/s/numerology/
  - https://theresanaiforthat.com/s/fortune-telling/
  - https://theresanaiforthat.com/s/zodiac/
  - https://theresanaiforthat.com/s/palm-reading/
  - https://theresanaiforthat.com/s/divination/
  - https://theresanaiforthat.com/s/i-ching/
  - https://theresanaiforthat.com/s/oracle/
  - https://theresanaiforthat.com/s/runes/
  - https://theresanaiforthat.com/s/dream-interpretation/
  - https://theresanaiforthat.com/s/spirituality/
  - https://hypestat.com/
- Applied (research artifacts):
  - `packages/tools/src/collect-taaft-spiritual-2024.ts`: 원본 수집(174 rows)
  - `packages/tools/src/curate-web-research-2024.ts`: 100+ 유사 웹 큐레이션 및 feature/applicability 리스트 자동 생성
  - `docs/research/taaft-spiritual-2024plus.json`: 원본 데이터
  - `docs/research/web-research-2024plus-curated.json`: 큐레이션 데이터(104 rows, core/adjacent 포함)
  - `docs/WEB_RESEARCH_2024PLUS_CURATED.md`: 100+ 목록 + 기능/자료 + 적용 후보 리스트
