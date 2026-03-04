# App One 리서치: Little Alchemy형 원소 조합 + 방치형 결합

작성일: 2026-03-05

## 0) 리서치 목적
- 기존 그리드 기반 머지(2개 즉시 합성)에서
- **Little Alchemy류 자유 배치/드래그 기반 조합**으로 UX 전환 시
- 핵심 재미, 부작용(side effects), 방치형 기믹 결합법을 정리

---

## 1) 레퍼런스 조사 결과 요약

## 1-1. 공식/스토어 기반 핵심 신호

### Little Alchemy (Google Play)
- 설명 핵심: 4개 기본 요소에서 시작해 수백 개 요소를 발견
- 포인트: **느긋한 페이스, 조합 발견 자체가 퍼즐**
- 지표 참고(스토어 표기): 10M+ 다운로드, 오프라인/가벼운 플레이 호평

### Little Alchemy 2 (Google Play)
- 설명 핵심: 확장된 라이브러리, 도감(encyclopedia), 시각 스타일 강화
- 사용자 반응 포인트:
  - 장점: 쉬운 진입, 발견 중독성, 장시간 수집 플레이
  - 불만: 과한 애니메이션/가시성 저하, UX 취향 차이

## 1-2. 한국어권 자료 신호

### 네이버 블로그 공략(제공 링크 포함)
- 특징: 조합식 대량 정리 수요가 큼
- 시사점:
  1) **조합 데이터 양이 많아질수록 외부 공략 의존 증가**
  2) 인게임 힌트/도감 설계가 부족하면 이탈 또는 외부 검색으로 이탈

## 1-3. 오픈소스/클론 신호 (GitHub)
- `little alchemy clone` 검색 결과 다수(파이썬/JS/C++/Dart 등)
- 관찰 포인트:
  - 다수가 “조합 엔진 + UI 레이어” 분리 구조를 택함
  - 데이터셋 기반(요소쌍 -> 결과) 접근이 많음
  - UI는 구현 난이도보다 **조합 데이터 관리/히ント 설계**가 실제 난점

---

## 2) Little Alchemy형 UX를 App1에 적용할 때 핵심 차이

기존 App1: 보드(셀) + 동일 요소 머지
목표 App1: 자유 배치 + 드래그 드랍 + 겹침 유지 후 합성

### 변경 규칙(요청 반영)
1. N×N 고정 보드 삭제(자유 좌표)
2. 원소 랜덤 위치 스폰
3. 드래그는 이동 자체
4. A를 B 위에 올리고 **3초 유지**
5. 손을 떼면 드랍, 조건 만족 시 합성

---

## 3) 예상 사이드 이펙트(중요) + 대응

## 3-1. 충돌/판정 스트레스
문제:
- 요소가 겹쳤는지 모호
- 작은 화면에서 정확한 드랍 어려움

대응:
- 요소 반경(hit radius) 가시화(얇은 링)
- 유효 겹침 시 하이라이트
- 3초 카운트다운 링/게이지 표시
- 드랍 직전 스냅(snap-to-target) 옵션

## 3-2. 화면 난잡/요소 분실
문제:
- 자유 배치에서 요소가 겹쳐 뭉침
- 플레이어가 “어디 갔지?” 경험

대응:
- 자동 정렬 버튼(카테고리/티어)
- 확대/축소(핀치) + 미니맵(후순위)
- 최근 생성 요소 강조
- 겹침 임계치 초과 시 살짝 반발(repulse)

## 3-3. 합성 실패 체감 불쾌
문제:
- 3초 기다렸는데 합성 안 되면 피로

대응:
- 합성 가능 조합일 때만 카운트다운 시작
- 불가능 조합이면 즉시 피드백("조합 불가")
- 합성 실패 시 짧은 이유 메시지(잠금, 쿨다운, 조건 미달)

## 3-4. 방치형과 조합형의 템포 충돌
문제:
- 조합은 능동 플레이, 방치는 수동 성장
- 둘의 템포가 충돌하면 중간층 유저가 이탈

대응:
- 조합은 “발견 보상”, 방치는 “재화 성장”으로 역할 분리
- 오프라인 복귀 시 자동 합성 시도 로그 요약(선택)
- 조합으로만 얻는 희귀 재화(Residue+)를 소량 배치

## 3-5. 데이터 폭증/밸런스 붕괴
문제:
- 조합 수 늘수록 품질관리 어려움
- 특정 조합 루프가 OP가 되기 쉬움

대응:
- 조합 테이블에 태그/희귀도/락조건 포함
- A/B 실험 전제의 밸런스 프리셋 분리
- 로그 기반 “과사용 조합” 탐지

---

## 4) 권장 시스템 아키텍처 (App1 전환안)

## 4-1. 도메인 모델
- ElementInstance
  - id, form, tier, x, y, zIndex, state(idle/drag/hover)
- Recipe
  - lhsElementId, rhsElementId, resultElementId
  - holdSec(기본 3), condition(optional)
- MergeSession
  - sourceId, targetId, overlapStartTs, progress(0~1)

## 4-2. 런타임 상태
- FreeCanvasState
  - viewport, instances[], activeDragId, candidateTargetId
- AutoIdleState
  - tickets, essence, residue, offlineSummary

## 4-3. 이벤트 로그
- DRAG_START / DRAG_MOVE / DRAG_DROP
- MERGE_HOLD_BEGIN / MERGE_HOLD_CANCEL / MERGE_COMMIT
- OFFLINE_SUMMARY

---

## 5) 마일스톤 제안 (자유 배치 전환 특화)

## M-A (엔진 전환, 1차)
- 보드 그리드 제거
- 자유 좌표 스폰/드래그 구현
- 겹침 판정 + 3초 홀드 게이지
- 드랍 시 합성 커밋

완료 기준:
- 20회 드래그에서 판정 오작동 < 5%

## M-B (UX 안정화, 2차)
- 합성 가능/불가 시각 피드백
- 자동 정렬/줌 기본 제공
- 합성 실패 이유 메시지

완료 기준:
- 플레이테스트에서 “왜 안 합쳐지는지 모르겠다” 피드백 감소

## M-C (방치형 결합, 3차)
- 오프라인 정산 + 자유배치 인스턴스 복원
- 조합 발견 로그/도감 연동
- 희귀 조합 보상(Residue+) 추가

완료 기준:
- 복귀 루프에서 조합/방치 둘 다 동기 유지

## M-D (밸런스/운영, 4차)
- 레시피 테이블 분리(json)
- 힌트 시스템 1차
- 로그 기반 조합 밸런스 리포트

완료 기준:
- 수치 조정이 코드 수정 없이 가능

---

## 6) 구현 시 주의점 (실무)
1. 충돌 판정은 O(n^2) 급증 가능 → spatial hash/quadtree 고려
2. 드래그 프레임 저하 방지(렌더 최소화)
3. 멀티터치/OS 제스처 충돌 주의
4. save 데이터에 좌표 정밀도/버전 관리 필요

---

## 7) 결론
- App1을 Little Alchemy형으로 전환하는 건 타당함.
- 단, 핵심 성공요인은 “조합 시스템” 자체보다
  **판정 가시성 + 실패 피드백 + 화면 정리 UX**에 있음.
- 방치형 기믹은 조합과 경쟁시키지 말고,
  조합 발견을 강화하는 보조 루프로 결합하는 게 안정적임.

---

## 참고 URL
- https://littlealchemy.com
- https://littlealchemy2.com
- https://play.google.com/store/apps/details?id=com.sometimeswefly.littlealchemy
- https://play.google.com/store/apps/details?id=com.recloak.littlealchemy2
- https://m.blog.naver.com/dpslzkfmsk/222640867935
- https://github.com/topics/alchemy-game
- https://github.com/search?q=little+alchemy+clone&type=repositories
- https://github.com/search?q=alchemy+game+clone&type=repositories
- https://github.com/alexander-gekov/infinite-alchemy
- https://github.com/SeaPickle754/Little-Alchemy
