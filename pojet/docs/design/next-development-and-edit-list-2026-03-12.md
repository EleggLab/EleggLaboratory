# Pojet 추가 개발/첨삭 리스트 (재미 + 고수위 성인 톤)

작성일: 2026-03-12
기준: 1로그 1선택, 텍스트 RPG 몰입, 성인용 고수위 톤(직접 노골 묘사보다 강한 관능/권력 긴장 중심)

## 1) 리서치 핵심 결론 (출시/정책 제약)

1. Steam은 성인 콘텐츠 라벨/연령 게이트/설문 고지가 필수이며, 빌드에 올라간 성인 콘텐츠는 접근 불가 상태여도 고지 대상이다.
2. Steam은 Live-Generated AI 기반 Adult Only Sexual Content에 별도 리스크 제한이 있다.
3. itch.io는 성인 분류 미표기 시 디스커버리 제외/결제 비활성화 가능성이 있고, 최근 결제사 정책 영향으로 NSFW 노출 정책이 수시로 변동 중이다.
4. Apple App Store는 노골적 성적/포르노성 콘텐츠를 금지한다.
5. Google Play도 성적 만족 목적의 포르노/노골 성적 콘텐츠를 금지한다.
6. 한국 유통 기준으로는 게임 등급 분류(특히 18+) 체계와 사전 준비물이 명확히 요구된다.

## 2) 우선 개발 리스트 (P0~P2)

## P0 (바로 착수)

1. 플랫폼 분리 전략 확정
- PC(Steam/itch)용 고수위 빌드와 모바일 친화 빌드(완화판) 분리.
- 수용 기준: 빌드별 정책 체크리스트 100% 통과.

2. 수위 레이어 시스템
- `S1~S5` 단계(유혹/긴장/권력/금기/후폭풍) 정의.
- 각 이벤트/로그에 수위 태그를 부여하고 Act별 상한 적용.
- 수용 기준: Act 1~5 수위 곡선이 의도대로 상승.

3. 재미 루프 강화(선택-결과-보상)
- 선택 직후 체감 보상(자원/관계/새 선택지) + 2~3틱 후폭풍 동시 설계.
- 수용 기준: 선택 직후 의미 체감률(내부 QA 설문) 80% 이상.

4. 이벤트 다양성 엔진 고도화
- 현재 cooldown 외에 카테고리 균형, NPC 교대, 결과 상태 기반 가중치 추가.
- 수용 기준: 이벤트 다양성 비율(유니크 이벤트/오픈 이벤트) 0.20 이상.

5. 1로그 1선택 몰입 템플릿
- 로그 구조를 고정 템플릿으로 통일:
  - 상황 압력
  - 감정/관계 압력
  - 선택 갈림 포인트
  - 후속 훅
- 수용 기준: 플레이 로그 샘플 100개에서 템플릿 누락 5% 이하.

## P1 (다음 스프린트)

6. NPC 욕망/권력 성향 매트릭스
- 각 NPC에 `유혹 반응`, `지배 반응`, `거절 반응`, `질투 반응` 축 추가.
- 수용 기준: 핵심 NPC 20명 이상에 반응 프로파일 완료.

7. 대사 톤 변조 시스템
- 같은 사건이라도 관계 수치/수위 레벨에 따라 대사 톤 자동 변조.
- 수용 기준: 동일 이벤트 3회 재생 시 문장 체감 중복률 40% 이하.

8. 비주얼 연출 동기화
- 배경/초상/이펙트를 수위 및 관계 축과 동기화.
- 수용 기준: 상태 변화 시 1초 내 시각 변화 반영.

9. 고수위 분기 전용 보상
- 고위험 고수위 선택에만 열리는 유물/호칭/루트 잠금 해제 추가.
- 수용 기준: 상위 루트 달성 동기(재플레이 지표) 상승.

## P2 (확장)

10. 라이브 밸런싱 대시보드
- 이벤트 선택률, 이탈 구간, 수위 곡선 체류시간 실시간 추적.
- 수용 기준: 주간 리포트 자동 생성.

11. 챕터형 시나리오 팩 운영
- 시즌 단위로 사건팩(학교/항구/성소/폐허)을 공급.
- 수용 기준: 신규 팩 투입 후 7일 리텐션 개선.

## 3) 첨삭(현재 데이터/문장) 리스트

1. `companions.json`의 플레이스홀더 문구(`정리 문구`) 전면 교체.
2. `questlines.json`의 번호형 제목(`재의 의뢰 001`)을 서사형 제목으로 교체.
3. `events-t2/t3.json` 잔여 영문 선택지/템플릿 문구를 원문 데이터에서도 제거.
4. 로그 문장 조사/어미 검수 자동화(`명성가`류 문장 오류 방지).
5. `log-lines.json` 반복 번호 문장(`(1)(2)(3)`)을 의미 있는 변주 문장으로 재작성.
6. `npcs/factions/regions` 설명문을 세계관 톤으로 재서술(현재 중립 설명이 많은 구간 보강).
7. 이벤트 본문의 상황-감정-결정-후폭풍 4요소 누락 케이스 정리.
8. T3 이벤트는 반드시 장기적 대가 문장을 포함하도록 강제.

## 4) 운영 지표 (재미 + 고수위 톤)

1. 이벤트 다양성 비율: `>= 0.20`
2. 동일 이벤트 연속 반복 최대치: `<= 2`
3. 로그 연결 훅 포함률: `>= 95%`
4. 수위 곡선 역주행(급락) 발생률: `<= 10%`
5. 선택 후 즉시 보상 체감률(내부 QA): `>= 80%`
6. 재플레이 시 신규 체감 분기율: `>= 35%`

## 5) 즉시 실행 추천 순서

1. P0-1 플랫폼 분리 전략 확정
2. P0-2 수위 레이어 도입
3. P0-4 이벤트 다양성 엔진 강화
4. 첨삭 1~5 (데이터 클린업)
5. P1-6/7 NPC 반응 매트릭스 + 대사 변조

## 참고 링크

- Steam Content Survey: https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- Steam Onboarding Rules: https://partner.steamgames.com/doc/gettingstarted/onboarding
- ESRB Ratings Guide: https://www.esrb.org/ratings-guide/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Developer Program Policy: https://support.google.com/googleplay/android-developer/answer/16329168?hl=en
- Google Play UGC Policy: https://support.google.com/googleplay/android-developer/answer/9876937?hl=en-GB
- itch Creator FAQ (adult): https://itch.io/docs/creators/faq#is-adult-content-allowed
- itch Quality Guidelines: https://itch.io/docs/creators/quality-guidelines
- itch Update on NSFW content: https://itch.io/updates/update-on-nsfw-content
- GCRB Enforcement: https://www.gcrb.or.kr/english/enforcement/Enforcement.aspx
- MDA 원문: https://www.cs.northwestern.edu/~hunicke/MDA.pdf
- Choice/Consequence 설계 힌트: https://www.gdcvault.com/play/1023346/Choice-Consequence-and
