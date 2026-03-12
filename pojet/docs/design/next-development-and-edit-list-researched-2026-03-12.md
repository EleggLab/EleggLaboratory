# Pojet 추가 개발 + 첨삭 리스트 (Research-backed)

작성일: 2026-03-12
목표: **재미 + 강한 성인 톤**을 유지하면서, 스토리 완성도/출시 안정성/운영 효율을 동시에 올린다.

---

## 1) 리서치 핵심 결론 (정책/출시 리스크)

1. Steam은 성인 콘텐츠 자체보다 **라벨링/연령게이트/설문 공개 정확성**을 강하게 본다.
2. Steam Content Survey 기준, **Adult Only Sexual Content + Live-Generated AI** 조합은 현재 리스크가 매우 높다.
3. itch.io는 2025년 NSFW 정책 변동 이후, 결제 파트너 이슈로 **노출/검색/결제 정책이 흔들릴 수 있음**.
4. Apple/Google 모바일 스토어는 성적 만족 목적 콘텐츠에 매우 보수적이므로, **모바일판은 별도 설계**가 사실상 필수.
5. ESRB/GCRB 관점에서도 18+ 등급 설계와 디스크립터 대응을 초기에 내장해야 재작업이 줄어든다.

---

## 2) 추가 개발 리스트 (우선순위)

## P0 (즉시 착수)

1. **성인 톤 강도 계층(S1~S5) 엔진화**
- 모든 로그/이벤트에 톤 강도 태그를 부여.
- Act 진행, 관계도, 스탯에 따라 자동 증폭/완화.
- 목표: “야한 게임 같은데 문장 품질은 안정적” 상태 확보.

2. **1로그 1선택 체감 강화 루프**
- 선택 직후: 즉시 보상(감정 반응/관계 변화/리소스 변화)
- 2~3틱 후: 지연 보상(새 분기/잠금 해제/반작용)
- 목표: 선택이 진짜 의미 있게 느껴지도록 설계.

3. **분기 구조 업그레이드 (Stack of Bushes + Arm-and-Fingers)**
- 중반까지는 합류형 분기로 관리 비용 절감.
- 후반은 대형 분기(엔딩 축)로 플레이 감정차 극대화.
- 목표: 재플레이 체감 증가 + 제작비 폭증 방지.

4. **이벤트 반복 억제 고도화**
- 현재 쿨다운 외에 NPC/지역/카테고리/감정상태 기반 다양성 가중치 추가.
- 목표: 같은 결의 이벤트 연속 노출 방지.

5. **문장 품질 게이트 자동화**
- placeholder 금지(`????`, `인물-`, `이벤트#`) 정규식 + 사전 필터
- 조사/접속어 품질 검사 + 리라이트 큐 자동 적재
- 목표: 플레이 중 깨지는 문장 0에 가깝게.

6. **배포 타깃 분리**
- `PC-Adult`와 `Mobile-Safe` 콘텐츠 프로파일 분리.
- 동일 코드, 다른 콘텐츠 레이어로 운영.
- 목표: 플랫폼 리스크를 빌드 레벨에서 차단.

## P1 (다음 스프린트)

7. **NPC 욕망/권력/의존 매트릭스 도입**
- NPC별 반응을 유혹/지배/거래/폭력 축으로 분리.
- 선택별 반응이 캐릭터답게 달라지도록 설계.

8. **페이싱 컨트롤러**
- 장문 로그 연속 시 선택지 조기 삽입.
- 긴장도 하락 시 강한 유혹/갈등 이벤트 자동 호출.
- 목표: wall-of-text 방지 + 몰입 유지.

9. **에셋 호출 최적화**
- 배경/초상 AVIF/WebP 전환, lazy load, 프리로드 큐 최적화.
- 스토리 몰입 유지하며 용량/로딩시간 절감.

10. **실시간 밸런스 대시보드**
- 이벤트 다양성, 반복률, 선택 후 체감지표, 이탈구간 자동 집계.
- 목표: 감으로 조정하지 않고 수치로 튜닝.

## P2 (확장)

11. **시즌형 콘텐츠 캘린더**
- 주간/월간 대형 사건으로 메타 스토리 축적.

12. **세이브 마이그레이션/버전 안정화**
- 콘텐츠 업데이트 시 기존 세이브 손상 방지.

---

## 3) 첨삭(수정) 리스트

1. **명사 placeholder 전면 제거**
- `인물`, `????`, `1번째 이벤트` 같은 임시 표기 전수 교체.

2. **선택지 문장 고도화**
- 모든 선택지를 `행동 + 의도 + 리스크` 3요소로 통일.

3. **로그 연결문 강화**
- 각 로그 첫 문장에 이전 선택의 결과 흔적(감정/상태/환경)을 명시.

4. **반복 수식어 정리**
- 같은 유혹 표현 반복을 금지하고 상황별 어휘군 분리.

5. **조사/어미 교정 룰 고정**
- 자동 생성 문장에서 어색한 조사 결합을 룰로 차단.

6. **장면 길이 규격화**
- 1로그 길이 상한/하한, 선택지 길이 상한을 정의해 가독성 유지.

7. **성인 톤의 단계적 상승 설계**
- 초반 훅(긴장/유혹) → 중반 권력/관계 심화 → 후반 금기/결정적 분기.
- 과도한 반복 자극 대신 “누적 긴장”을 설계.

8. **재미 보호 장치**
- 고강도 장면 뒤에는 정보/전술/보상 장면을 배치해 피로도 완화.

---

## 4) QA/시뮬레이션 실행 기준 (100회 이상)

1. 기본: 120~300회 자동 러닝 (시드 고정 + 랜덤 혼합)
2. 필수 통과:
- placeholder 검출 0건
- 인접 동일 이벤트 비율 목표치 이하
- 로그 연결 단서 포함률 95%+
- 선택 직후 변화 체감률(내부 QA 체크) 80%+
3. 실패 항목은 자동으로 `rewrite queue`에 누적.

---

## 5) 바로 실행할 2주 플랜

1. 주 1: P0-1~P0-4 구현 (톤 계층, 선택 체감, 분기 축, 반복 억제)
2. 주 2: P0-5~P0-6 + 첨삭 1~4 전수 정리
3. 주 2 말: 200회 시뮬레이션 + 실패 케이스 리라이트

---

## 참고 소스

- Steam Onboarding: https://partner.steamgames.com/doc/gettingstarted/onboarding
- Steam Content Survey (Mature/AI): https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- itch.io NSFW Update (2025-07-24): https://itch.io/updates/update-on-nsfw-content
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Inappropriate Content: https://support.google.com/googleplay/android-developer/answer/9878810?hl=en
- ESRB Ratings Guide: https://www.esrb.org/ratings-guide/
- GCRB Rating Guide: https://www.gcrb.or.kr/English/enforcement/ratingguide.aspx
- GCRB Content Descriptors: https://www.gcrb.or.kr/English/enforcement/contentdescriptors.aspx
- MDA Framework: https://www.cs.northwestern.edu/~hunicke/MDA.pdf
- Choice of Games (Delayed Branching): https://www.choiceofgames.com/2011/12/4-common-mistakes-in-interactive-novels/
- Choice of Games (Arm-and-Fingers): https://www.choiceofgames.com/2016/11/end-game-and-victory-design/
