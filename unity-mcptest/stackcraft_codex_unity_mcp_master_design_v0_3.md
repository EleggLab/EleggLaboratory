
# StackCraft 기반 소규모 종족 변이/호감도/번식/가계도 게임
## Codex + Unity MCP 구현 지향 마스터 기획서 v0.3

문서 상태:
- 버전: v0.3
- 용도: GPT Codex / Unity MCP / 인간 디렉터 공용 구현 명세
- 기준 범위: 프로토타입 → Vertical Slice → Early Content Pack 01
- 문서 성격: 사람이 읽는 제안서가 아니라, AI가 작업 단위로 분해하고 구현 우선순위를 정할 수 있도록 설계한 구조형 명세
- 표현 제한: 노골적 성행위 묘사나 장면 스크립트는 제외한다. 본 문서는 `관계`, `호감도`, `교배`, `혈통`, `변이`, `가계도`, `성인 분위기 연출 레이어 분리`를 시스템 차원에서 정의한다.

---

## 0. 이 문서가 해결하려는 문제

이 프로젝트는 일반적인 `Stacklands류 카드 스택 게임`으로 접근하면 핵심 재미가 흐려진다.  
이 프로젝트의 실제 핵심은 아래 6개다.

1. 인간 남/여 주인공 2장으로 시작하는 소규모 혈통 시뮬레이션
2. 상단 고정 장소 카드로 인한 종족 변이 획득
3. 적대 카드(적색 상태) 정화 후 동료화
4. 종족별 선호 선물을 활용한 호감도 개방
5. 교배 조건과 시간 잠금을 중심으로 한 번식 루프
6. 모든 개체의 이름/혈통/세대/변이 이력을 기록하는 가계도 수집

즉 이 게임은 아래의 조합이다.

- 카드 기반 관리 게임
- 관계/호감도 공략 게임
- 종족/혈통 수집 게임
- 살아있는 보드 관찰 게임
- 성인 대상 분위기/긴장감이 있는 판타지 세계 시뮬레이션

이 문서는 위 5개 층을 `Codex가 구현 가능한 상태`로 재구성한다.

---

## 1. 외부 전제와 구현 상정

### 1-1. StackCraft 공개 정보 기준 전제
공개 설명 기준 StackCraft는 아래를 이미 제공하거나 강하게 시사한다.

- 카드 간 상호작용을 제어하는 Stacking Rules Matrix
- Feeding / Selling / Encounters / New Day로 구성된 Day Cycle
- 시간 기반 제작 및 발견 시스템
- RPS 전투
- 퀘스트 그룹
- Encounter 스폰
- ScriptableObject 중심 콘텐츠 추가
- 저장 시스템

따라서 본 프로젝트는 아래 원칙을 따른다.

- StackCraft의 구조를 버리지 않는다.
- 카드/타이머/Encounter/ScriptableObject 구동 철학을 유지한다.
- 구매용 카드팩 UI를 `고정 장소 슬롯 UI`로 치환한다.
- 새로 만들어야 하는 코어는 `Species`, `Affinity`, `Purification`, `Reproduction`, `Genealogy`, `AutoBehavior` 여섯 계층이다.
- 가능하면 기존 시스템 위에 덧붙이고, 원본 구조를 과도하게 파괴하지 않는다.

### 1-2. Codex + Unity MCP 전제
Codex는 클라우드/로컬 환경에서 코드 읽기, 수정, 실행, 테스트에 강하며 AGENTS.md 파일을 통해 작업 규칙을 주입할 수 있다고 가정한다.  
Unity MCP는 구현체마다 차이는 있지만 대체로 아래 기능군을 제공한다고 가정한다.

- 프로젝트/에셋/계층 검색
- GameObject 생성/수정/선택
- 씬 저장/로드
- 플레이 모드 실행/정지
- 콘솔 로그 수집
- 컴파일 상태 확인
- 스크린샷 획득
- 커스텀 MCP Tool 추가

문서 전체는 이 도구 세트를 활용하는 전제로 작성한다.

### 1-3. 검증 불가 영역
에셋 내부 실제 코드 구조, 네이밍, 폴더 배치, API 시그니처는 현재 공개 페이지만으로 확정할 수 없다.  
따라서 아래 항목은 `가정`으로 둔다.

- 기존 CardEntity 베이스 클래스 정확한 명칭
- Day Cycle 이벤트 훅의 실제 진입점
- Encounter 정의 클래스 실제 필드명
- 저장 시스템 직렬화 방식
- UI 프레임워크(UGUI / UIToolkit) 최종 채택 상태

문서 내 모든 구조는 `의미`를 우선하며, 실제 구현 시에는 현재 프로젝트 구조에 맞춰 이름만 매핑하면 된다.

---

## 2. 제품 정의

### 2-1. 제품 한 줄
`Stacklands 감각의 카드 보드 위에, 종족 변이·호감도·번식·가계도 수집을 얹은 소규모 판타지 관계 시뮬레이션`

### 2-2. 플레이 감정 목표
- 시작은 작고 가난하지만, 보드가 점점 살아있는 생태계처럼 보이게 한다.
- 카드를 보내고 기다리는 동안 “이번에는 어떤 종족/선물이 나올까” 기대가 생기게 한다.
- 적대 카드가 전투 후 정화되어 동료가 되는 순간에 강한 수집 보상을 준다.
- 선호 선물을 찾아 관계를 푸는 과정에 공략 재미를 준다.
- 출생한 자손이 단순 생산물이 아니라 이름과 계보를 가진 존재로 느껴지게 한다.
- 장기적으로는 “희귀 혈통”과 “가계도 미학”이 엔드게임 수집 동기가 되게 한다.

### 2-3. 비전에서 제외하는 것
현재 단계에서 의도적으로 제외한다.

- 거대 건물 트리
- 도시 경영
- 복잡한 장비/던전 파밍
- 수십 종 이상 대규모 도감
- 전술 전투 메타 심화
- 노골적 장면 대본 제작

---

## 3. 핵심 디자인 원칙

### 3-1. 카드 한 장은 곧 인격/생물 단위다
개체 카드는 이름, 종족, 성별, 혈통, 상태를 가진다.  
즉 개체는 자원 카드가 아니라 추적 가능한 엔티티다.

### 3-2. 플레이어 조작 대상과 생태계 대상은 다르다
주인공 인간 남/여는 플레이어 의사결정의 핵심이고, 비주인공 개체는 보드를 살아 있게 만드는 자동 생태계 역할을 맡는다.

### 3-3. 번식은 결과가 아니라 경로다
번식은 즉시 생산 버튼이 아니라 아래의 경로다.

- 대상 확보
- 적대 상태 정화
- 선물 탐색
- 호감도 해금
- 조건 충족
- 교배 잠금
- 출산/성장
- 자손 가치 판정
- 가계도 축적

### 3-4. 성인 요소는 시스템 뒤에 있다
게임의 장기 재미는 카드 상태 변화, 관계, 혈통 수집에서 나오고, 성인 연출은 그 시스템의 보상적 프레젠테이션 레이어다.

### 3-5. AI가 구현하기 쉬운 방식으로 쪼갠다
문서의 모든 시스템은 다음 세 가지 층으로 나눈다.

- Data Layer: ScriptableObject / enum / rule table
- Runtime Layer: 상태머신, 타이머, 판정기, 저장 상태
- Presentation Layer: 카드 비주얼, 패널, 애니메이션, SFX, 툴팁

---

## 4. 플레이어 경험 개요

### 4-1. 첫 5분
- 인간 남 카드 1장, 인간 여 카드 1장으로 시작
- 상단에는 숲 / 바위산 / 늪 / 바다 장소 카드가 고정 배치
- 각 장소에 인간을 보내면 일정 시간 후 돌아오거나 결과 카드가 생성됨
- 장소는 선물 자원, 적, 이벤트, 종족 변이 결과를 제공
- 플레이어는 “어느 장소가 어떤 종족/선물에 연결되는지”를 학습

### 4-2. 첫 15분
- 첫 비인간 종족 획득
- 적색 적대 카드 첫 등장
- 전투로 정화 가능한 적대 개체와 그렇지 않은 개체 차이 학습
- 선물 자원과 종족 선호 연결 학습

### 4-3. 첫 30분
- 정화 개체 확보
- 선물로 호감도 1~2단계 개방
- 첫 교배 자격 해금
- 첫 자손/알/임신 카드 등장
- 카드 상세 패널에서 부모/자식 관계 확인

### 4-4. 1시간 이후
- 종족이 다양해짐
- 자동 생태가 돌아가기 시작함
- 희귀 혈통/특성 조합을 노리는 장기 플레이 발생
- 가계도 화면이 실질적인 수집 목표가 됨

---

## 5. 코어 루프

### 5-1. 마이크로 루프
1. 장소 카드 확인
2. 적합한 개체를 장소 카드에 드래그
3. 시간 경과
4. 결과 획득
5. 선물 자원 관리
6. 대상 개체에 선물 제공
7. 호감도 상승
8. 교배 조건 충족 시 Pairing 실행
9. 잠금 시간 소모
10. 출산/성장 결과 확인
11. 자손을 가계도에 누적

### 5-2. 메조 루프
1일 단위로 Feeding → Encounter → Progression → Reset이 돌아간다.  
기존 StackCraft Day Cycle에 아래를 삽입한다.

- Affection decay 또는 maintenance
- Pregnancy progress
- Growth progress
- AutoBehavior tick
- Purification cooldown reduction
- Location refresh

### 5-3. 장기 루프
- 장소 탐사로 종족/선물 폭을 넓힘
- 적색 적대 개체를 정화해 혈통 가지를 넓힘
- 선호 선물 최적화를 통해 관계 형성 속도를 끌어올림
- 희귀 혈통 태그와 세대 기록을 수집
- 도감과 가계도를 완성

---

## 6. 시스템 범위 정의

### 6-1. 이번 단계 필수 시스템
- 주인공 2장
- 고정 장소 카드 4장
- 종족 변이
- 적색 적대 상태
- 정화
- 호감도
- 선물
- 교배 조건 검사
- 교배 잠금
- 임신/알/출산/성장
- 자동 행동
- 이름 생성
- 부모/자식/세대 기록
- 카드 상세 보기
- 가계도 보기
- 저장/불러오기 대응

### 6-2. 이번 단계 보류 시스템
- 건물 확장
- 마을/집창촌 같은 거점 경제
- 장비 테이블
- 퀘스트 내러티브 심화
- 세력전/맵 탐험 확장
- CG 갤러리
- 언어별 로컬라이징

---

## 7. 판 구조

### 7-1. 상단 영역
`Location Bar`  
기존 카드팩 구매 영역을 대체하는 핵심 UI다.

초기 슬롯:
- Forest
- RockyMountain
- Swamp
- Sea

각 슬롯 구성:
- 아이콘
- 이름
- 주요 태그
- 파견 가능 조건
- 현재 점유 상태
- 진행 타이머
- 예상 결과 카테고리 힌트

### 7-2. 메인 보드
- 개체 카드
- 자원 카드
- 정화 대기 카드
- 교배/출산 진행 카드
- 적색 적대 카드
- 이벤트 카드

### 7-3. 우측 상세 패널
선택 카드 상세:
- 이름
- 현재 종족
- 기원 종족
- 성별
- 성체 여부
- 호감도 단계
- 적대/정화 상태
- 교배 가능 여부
- 부모/자식
- 특성 태그
- 좋아하는 선물 / 싫어하는 선물
- 최근 이력

### 7-4. 하단 오버레이
- Day 카운터
- Feeding 남은 시간
- 현재 총 인구
- 임신/성장 큐
- 가계도 바로가기
- 도감 진행도
- 경고 로그(기아, 포화, 적 등장, 출산 등)

---

## 8. 개체 모델 정의

### 8-1. 개체 카드는 반드시 고유 ID를 가진다
모든 생물 카드에 전역 고유 ID를 부여한다.  
가계도와 저장을 위해 필수다.

### 8-2. 개체 공통 필드
```yaml
EntityId: string
DisplayName: string
Sex: Male | Female
AgeStage: Infant | Juvenile | Adult | Elder
OriginSpeciesId: string
CurrentSpeciesId: string
CardColorState: Default | HostileRed | Purifying | LockedBreeding | Pregnant | Incubating
IsProtagonist: bool
IsPurified: bool
IsAlive: bool
CanMoveAutonomously: bool
CanBreedAutonomously: bool
AffinityGroupIds: [string]
TraitTags: [string]
StatBlock:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
Reproduction:
  CanInitiate: bool
  CanReceivePregnancy: bool
  PregnancyProgressDays: int
  PregnancyDaysRequired: int
  LastMateEntityId: string|null
  CurrentMateEntityId: string|null
Genealogy:
  FatherEntityId: string|null
  MotherEntityId: string|null
  GenerationIndex: int
  LineageRootId: string
  BirthOrder: int
History:
  DiscoveryLocationId: string|null
  MutationHistory: [string]
  PurificationHistory: [string]
  GiftHistory: [string]
```

### 8-3. 주인공 카드 추가 필드
```yaml
PlayerRootFlags:
  IsMainProtagonist: true
  AutoBreedDisabledByDefault: true
  CannotBeAutoSacrificed: true
  AlwaysShowInGenealogyRoot: true
```

### 8-4. 개체 상태 분리 원칙
다음은 혼합하지 않는다.

- 종족 정체성
- 카드 색 상태
- 임신/잠금 등 일시 상태
- 혈통 기록
- 전투 스탯
- UI 표시 상태

이들을 별도 런타임 컴포넌트로 쪼개야 저장/디버깅이 쉬워진다.

---

## 9. 종족 구조 설계

### 9-1. 초기 종족 범위
프로토타입 1차 종족:

중립/아군화 가능한 기본 종족
- Human
- Elf
- Beastfolk
- Merfolk
- Slimeborn

적대 시작 후 정화 가능한 종족
- Orc
- Ogre
- Centaur

선택 이유:
- 판타지 이해가 쉽다
- 선호 선물 차이가 명확하다
- 외형 분화가 쉬워 카드 아트 차별화가 쉽다
- 교배 결과 태그를 정의하기 쉽다

### 9-2. 종족 데이터 스키마
```yaml
SpeciesId: string
DisplayName: string
BaseCardFrameColor: string
FactionType: Civil | Hostile | NeutralWild
BiomeAffinity:
  Forest: int
  RockyMountain: int
  Swamp: int
  Sea: int
GiftTasteProfileId: string
CombatProfile:
  Rock: int
  Paper: int
  Scissors: int
BaseStats:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
ReproductionProfile:
  MinimumAffinityTier: int
  GestationType: LiveBirth | Egg | Cocoon
  GestationDays: int
  RecoveryDays: int
  AdultAgeDays: int
MutationInputs:
  EligibleOriginSpeciesIds: [string]
  EligibleLocationIds: [string]
TraitPoolIds: [string]
NamingPoolId: string
LoreTags: [string]
```

### 9-3. 종족 디자인 원칙
- 종족은 많지 않되 역할이 분명해야 한다.
- 각 종족은 최소 1개 장소와 강한 연결이 있어야 한다.
- 각 종족은 최소 1개 확실한 선호 선물이 있어야 한다.
- 각 종족은 최소 1개 `전투/생존/번식/희귀 혈통` 강점을 가져야 한다.
- 종족 차이는 단순 숫자보다 플레이 스타일 차이로 느껴지게 한다.

### 9-4. 종족별 초기 컨셉

#### Human
- 기원 종족
- 변이의 출발점
- 선물 반응 범용
- 번식 조건 중립
- 혈통 연결 기준점

#### Elf
- 숲 연계
- 꽃/허브/빛나는 열매 선호
- Charm 높음
- Fertility 중상
- Combat 낮음~중간
- 희귀 혈통에서 우아/정령친화 태그 발생률이 높음

#### Beastfolk
- 숲/늪 경계
- 고기/버섯/따뜻한 천 선호
- Appetite 높음
- Combat/Fertility 중간
- 야성/민첩 태그 발생률 높음

#### Merfolk
- 바다 연계
- 진주/해초/어패류 선호
- Sea 탐사 보정
- 육지 이동 페널티 가능
- 자손에 수생 태그 부여 확률 보유

#### Slimeborn
- 늪 연계
- 젤/버섯/광물 진액 선호
- Gestation이 Cocoon 타입
- 변이 태그 발생 확률 높음
- 일반적 미형이 아니라 희귀 조합용 축

#### Orc
- 적색 적대 시작
- 전투 정화 후 합류
- 고기 선호
- Combat 높음
- Charm 낮음
- 정화 후 초기 Affinity 상한 제한 가능

#### Ogre
- 적색 적대 시작
- 큰 체력/낮은 민첩
- Appetite 높음
- 임신/회복 주기 길음
- 희귀 자손에서 거체 태그 발생률 높음

#### Centaur
- 적색 적대 시작
- 평원 카드가 없어도 RockyMountain/Forest 이벤트에서 등장 가능
- 당근/곡물/사과 선호
- 이동/탐사 보정
- 직접 전투보다 생존/운반 강점

---

## 10. 장소 시스템 설계

### 10-1. 장소는 카드팩의 대체물이다
장소는 단순 파견지가 아니라 `종족 해금`, `선물 공급`, `적 등장`, `이벤트`, `변이`의 입구다.

### 10-2. 초기 장소 4종
- Forest
- RockyMountain
- Swamp
- Sea

### 10-3. 장소 데이터 스키마
```yaml
LocationId: string
DisplayName: string
FrameStyle: string
AllowsSpeciesMutation: bool
AllowedInputSpeciesIds: [string]
BaseDurationSeconds: float
PrimaryDrops: [DropEntry]
SecondaryDrops: [DropEntry]
MutationRules: [MutationRuleRef]
HostileEncounterRules: [EncounterRef]
AffinityHintTags: [string]
RiskProfile:
  InjuryChance: float
  DelayChance: float
  HostileSpawnChance: float
RefreshPolicy:
  CooldownDays: int
  AlwaysAvailable: bool
```

### 10-4. 장소별 기본 의도

#### Forest
- 엘프/비스트계 변이 입구
- 꽃, 허브, 열매, 작은 고기 공급
- 부드러운 첫 학습 구역
- Charm/자연친화 종족 루트

#### RockyMountain
- 센타우로스 이벤트, 광물, 돌, 버섯, 뿔/가죽 재료 공급
- Combat/체력형 종족 루트
- 위험도 중간
- 적색 출현 확률 중간

#### Swamp
- 슬라임본, 독버섯, 늪고기, 점액 자원
- 변이/코쿤 계열 루트
- 위험도 높음
- 희귀 특성 태그 풀 넓음

#### Sea
- 머포크, 해초, 조개, 진주, 어패류 공급
- 식량과 희귀 선물 공급
- 대기 시간이 상대적으로 김
- 물속성 변이/희귀 태그 루트

### 10-5. 인간을 장소에 보내는 행위의 의미
인간 기원 카드가 특정 장소를 탐험하면 결과는 아래 네 갈래 중 하나다.

1. 자원만 가지고 돌아옴
2. 인간 상태 유지 + 보너스 획득
3. 현재 종족이 장소 친화 종족으로 변이
4. 위험 이벤트 발생

게임 감정상 “그 인간이 사라지고 다른 카드가 나온다”는 표현을 쓰더라도, 내부 데이터상으로는 동일 EntityId를 유지하며 CurrentSpeciesId만 바꾸는 방식을 권장한다.  
이 방식은 가계도와 서사를 유지한다.

### 10-6. 비인간 개체의 장소 사용 규칙
비인간 개체는 기본적으로 다음 중 하나다.

- 해당 종족 친화 장소에서 자원 채집만 함
- 특정 희귀 이벤트 조건 충족
- 낮은 확률로 재변이 가능

재변이는 너무 빠르게 열리지 않게 해야 한다.  
초기 버전에서는 인간 기원 개체만 본격 변이 가능하게 제한해도 좋다.

---

## 11. 적색 적대 상태와 정화 시스템

### 11-1. 적색 카드의 의미
적색은 단순 테두리 색이 아니라 시스템 상태다.

적색 상태 효과:
- 플레이어 소유 카드로 간주되지 않음
- 호감도 상승 불가
- 선물 제공 불가
- 교배 참여 불가
- 자동 적대 행동 가능
- 전투/정화 루프 대상으로 취급

### 11-2. 적색 카드 생성 경로
- Encounter phase에서 스폰
- 특정 장소 실패 결과
- 오염 이벤트
- Day milestone 스폰

### 11-3. 정화 흐름
```text
HostileRedSpawn
-> EngageCombat
-> WinConditionMet
-> PurifyingState
-> ConversionCountdown
-> DefaultCardColor + Recruitable
```

### 11-4. 정화 데이터 스키마
```yaml
PurificationProfileId: string
HostileSpeciesId: string
RequiredWinCount: int
PurificationDays: int
PostPurificationAffinityFloor: int
PostPurificationTraitTags: [string]
FailurePenalty:
  InjuryChance: float
  EscapeChance: float
  DeathChance: float
```

### 11-5. 정화 후 제약
정화 후 바로 깊은 관계로 가지 않게 하기 위해 아래 제약 중 일부를 사용한다.

- 초기 호감도 0 고정
- 1일 회복 디버프
- 첫 교배까지 최소 1단계 추가 호감도 요구
- 선호 선물 종류가 적음
- 플레이어가 일정 횟수 상호작용해야 자동 행동 해금

### 11-6. 정화 시스템의 기능적 의의
- 전투가 단순 제거가 아니라 수집 루프로 연결됨
- 적대 종족을 “얻는 기쁨”이 생김
- 원작의 적 등장 구조를 자연스럽게 계승
- 장기적으로 혈통 가지가 넓어짐

---

## 12. 선물 시스템

### 12-1. 선물은 호감도의 핵심 자원
호감도 상승은 대화 UI가 아니라 `카드 드래그`로 해결한다.  
즉 선물은 Stacklands류 UX와 잘 맞는다.

### 12-2. 선물 분류
- Flora: 꽃, 허브, 열매
- Food: 고기, 생선, 당근, 버섯
- Mineral: 조약돌, 광물 조각, 진주
- Exotic: 점액, 바다 유리, 빛나는 씨앗
- Comfort: 천 조각, 말린 잎, 향 주머니

### 12-3. 선물 데이터 스키마
```yaml
GiftItemId: string
DisplayName: string
Category: Flora | Food | Mineral | Exotic | Comfort
Rarity: Common | Uncommon | Rare
SourceLocationIds: [string]
BaseAffinityDelta: int
StackSize: int
Tags: [string]
```

### 12-4. 종족별 선호 프로필
```yaml
GiftTasteProfileId: string
LovedTags: [string]
LikedTags: [string]
NeutralTags: [string]
DislikedTags: [string]
HatedTags: [string]
Modifiers:
  SameGiftRepeatPenalty: float
  DailyCap: int
  SpecialBonusConditionTags: [string]
```

### 12-5. 초기 종족별 선호 예시
- Elf: 꽃, 허브, 빛나는 씨앗, 향기 관련
- Beastfolk: 고기, 버섯, 따뜻한 천
- Merfolk: 해초, 조개, 진주, 생선
- Slimeborn: 점액, 버섯, 광물 진액
- Orc: 고기, 훈제 육류
- Ogre: 대형 식량, 고기, 뿌리 채소
- Centaur: 당근, 사과, 곡물, 들꽃

### 12-6. 선물 제공 규칙
- 적색 상태에는 제공 불가
- 같은 날 같은 선물을 반복하면 효율 감소
- 배고픔 상태일 때 음식 선물 보정 가능
- 교배 직후 회복 상태에서는 일부 선물 효과 감소 가능
- 주인공과 비주인공 사이에도 동일 규칙 적용

### 12-7. 선물 UX
드래그 시 대상 카드 위에 아래 힌트를 띄운다.

- 매우 좋아함
- 좋아함
- 보통
- 별로
- 거부

초기 버전에서는 텍스트 대신 아이콘도 가능하나, 학습 편의상 텍스트 툴팁 병행 권장.

---

## 13. 호감도 시스템

### 13-1. 호감도 층위
호감도는 단순 수치가 아니라 단계와 수치를 함께 가진다.

```yaml
AffinityTier:
  0 = Stranger
  1 = Open
  2 = Warm
  3 = Bonded
  4 = MateEligible
  5 = Devoted
```

### 13-2. 호감도 런타임 필드
```yaml
OwnerEntityId: string
TargetEntityId: string
AffinityScore: int
AffinityTier: int
DailyInteractionsUsed: int
GiftCountToday: int
LastMeaningfulInteractionDay: int
BlockedReason: None | Hostile | Recovery | SpeciesRule | AgeRule
```

### 13-3. 호감도 상승 경로
- 선물
- 특정 장소 동행 이벤트
- 전투 지원
- 출산/양육 보정
- 희귀 이벤트 성공

초기 버전 핵심은 선물만으로 충분하다.  
다만 확장성을 위해 인터랙션 타입 enum은 미리 둔다.

### 13-4. 호감도 하락/정체 경로
- 기아
- 부정적 선물
- 장기간 방치
- 전투 중 아군 피해
- 번식 후 회복기를 무시한 반복 시도

### 13-5. 교배 개방 조건
호감도만으로는 부족하다. 아래를 전부 만족해야 한다.

- 서로 이성
- 둘 다 성체
- 둘 다 생존 상태
- 둘 다 적색 상태 아님
- 둘 다 현재 잠금 상태 아님
- 호감도 최소 MateEligible
- 종족 규칙상 조합 허용
- 회복 쿨다운 없음
- 현재 임신 진행 중 아님
- 플레이어 직접 개입 또는 자동 행동 허용 상태

### 13-6. 설계 원칙
호감도는 빠르게 올랐다가 곧바로 번식 버튼 누르는 구조가 아니라, 최소 2~3회의 장소 파견과 선물 루프를 거치게 해야 한다.

---

## 14. 교배/임신/출산 시스템

### 14-1. 교배 기본 규칙
- 남남 불가
- 여여 불가
- 미성체 불가
- 적색 상태 불가
- 호감도 기준 미달 불가
- 회복/잠금 중 불가

### 14-2. 교배 실행 결과
교배 실행 시 다음 중 하나를 발생시킨다.

1. PairingLock 시작
2. Pregnancy 상태 부여
3. Egg/Cocoon 카드 생성
4. 실패(낮은 확률, 조건상 디버프 또는 무효)

### 14-3. 교배 잠금
교배 중인 카드에는 아래 상태가 붙는다.

- 드래그 불가
- 전투 참여 불가
- 장소 파견 불가
- 선물 수령 제한
- 타이머 표시
- 프레임/아이콘 변화

### 14-4. Gestation 타입
- LiveBirth: 임신 상태 후 출생
- Egg: 알 카드 생성 후 부화
- Cocoon: 고치 카드 생성 후 개체 출현

### 14-5. Reproduction 데이터 스키마
```yaml
ReproductionRuleSetId: string
SpeciesPairKey: string
Allowed: bool
RequiredAffinityTier: int
PregnancyCarrierSex: Female
GestationType: LiveBirth | Egg | Cocoon
GestationDays: int
RecoveryDaysInitiator: int
RecoveryDaysReceiver: int
OffspringRollTableId: string
SpecialTraitBonusIds: [string]
```

### 14-6. 임신/알/고치 카드 표현
초기 버전은 카드로 처리한다.

- 임신: 부모 카드 자체의 상태 아이콘 + 상세 패널
- 알: 보드에 별도 카드 생성
- 고치: 보드에 별도 카드 생성

AI 구현 난이도를 낮추기 위해, `LiveBirth`도 초반에는 별도 상태 카드로 분리해도 좋다.
예:
- `Pregnancy_EntityRefCard`

### 14-7. 출산 결과
출산 시 생성되는 자손 카드 필드:
- 새 EntityId
- 이름 자동 생성
- 부모 참조
- GenerationIndex = max(parents)+1
- OriginSpeciesId = offspring result
- CurrentSpeciesId = offspring result
- 초기 AgeStage = Infant
- 초기 TraitTags
- LineageRootId는 부모 중 주인공 루트 계승 규칙 따름

### 14-8. 성장 단계
- Infant
- Juvenile
- Adult

초기 버전은 Elder 생략 가능.  
Infant/Juvenile는 교배/전투/위험 행동 불가.

---

## 15. 자손 결정 규칙

### 15-1. 자손 결과는 완전 랜덤이 아니다
자손은 아래 입력으로 결정한다.

- 부모 종족 2개
- 부모 특성 태그
- 장소 보정(선택 적용)
- 희귀 이벤트 보정
- 세대 보정
- 정화 혈통 보정

### 15-2. 결과 유형
- 부모 중 한쪽 순혈
- 부모 중 한쪽 우세 계승
- 하이브리드 태그 부여
- 희귀 변이형
- 코쿤/알 특수형

### 15-3. 자손 롤 테이블 스키마
```yaml
OffspringRollTableId: string
ParentSpeciesA: string
ParentSpeciesB: string
Entries:
  - ResultSpeciesId: string
    Weight: int
    AddedTraitTags: [string]
    ForbiddenIfMissingParentTags: [string]
```

### 15-4. 초기 규칙 단순화 권장
초기 버전은 유전자 수치 기반이 아니라 `룰테이블 기반`으로 간다.

예:
- Human + Elf = Human 30 / Elf 30 / HalfElf 40
- Human + Orc = Human 20 / Orc 20 / HalfOrc 60
- Elf + Orc = Elf 15 / Orc 15 / WildHybrid 70

### 15-5. trait tag 풀 예시
- Graceful
- Fierce
- Swift
- Hardy
- Fertile
- SeaTouched
- ForestBlessed
- SwampMarked
- GiantBlood
- PurifiedLine
- Gentle
- Wild

### 15-6. 희귀 혈통 설계
희귀 혈통은 단순 희귀 카드가 아니라 “가계도 목표”가 되어야 한다.

예:
- PurifiedLine 2세대 이상
- ForestBlessed + SeaTouched 동시 보유
- GiantBlood + Graceful 동시 보유
- Devoted parents 보정

---

## 16. 자동 행동 AI

### 16-1. 자동 행동 목표
보드가 생명력을 가지되, 플레이어를 대신 플레이하면 안 된다.

### 16-2. 자동 행동 대상
- 비주인공 Adult 개체만 기본 활성화
- 주인공은 기본 비활성화
- 설정에서 주인공 자동 행동 허용 옵션은 후순위

### 16-3. 자동 행동 상태
```yaml
Idle
SeekFood
SeekGiftCandidate
Wander
EvaluateMate
MoveToMate
BreedingLocked
Recover
AvoidThreat
```

### 16-4. 자동 행동 조건
- 배고픔이 심하면 Food 우선
- 적색 적대가 근처면 AvoidThreat 또는 전투 참여
- 같은 종/이성/성체/호감도 조건 충족 시 EvaluateMate
- 선호 선물을 가진 경우 타깃에게 전달하는 AI는 초기 버전에서 제외 가능
- 자동 교배는 `내부 친밀도 >= 임계`에서만 발생

### 16-5. 자동 교배 제약
- 1일 1회 이하
- 보드 인구 소프트캡 이상이면 확률 감소
- 플레이어가 잠금 처리한 카드에는 금지
- 주인공과는 자동 교배 안 함(기본값)

### 16-6. 자동 행동 구현 원칙
A*급 경로탐색은 필요 없다.  
보드가 카드형이라면 단순 슬롯/거리 기반 선정으로 충분하다.

---

## 17. 이름/가계도 시스템

### 17-1. 이름은 반드시 카드 가치의 일부다
이름이 없으면 자손과 혈통 축적의 감정 가치가 급감한다.

### 17-2. 이름 데이터
```yaml
NamePoolId: string
CultureTag: Human | Elf | Orc | Sea | Swamp | Mixed
MaleNames: [string]
FemaleNames: [string]
SurnameRules: Patrilineal | Matrilineal | Hybrid | None
```

### 17-3. 이름 생성 규칙
- 순혈 종족은 해당 종족 이름 풀 사용
- 하이브리드는 부모 종족 우세 규칙 또는 혼성 풀 사용
- 동일 이름 중복 시 숫자 suffix 또는 별칭 적용
- 플레이어 수동 개명 기능은 후속

### 17-4. 가계도 데이터 모델
```yaml
GenealogyNode:
  EntityId: string
  DisplayName: string
  SpeciesId: string
  Sex: string
  GenerationIndex: int
  FatherEntityId: string|null
  MotherEntityId: string|null
  ChildEntityIds: [string]
  TraitTags: [string]
  BirthDayIndex: int
  DeathDayIndex: int|null
  IsProtagonistLine: bool
```

### 17-5. 가계도 보기 방식
최소 2종 제공:
- 선택 카드 중심 국소 가계도
- 전체 루트 계보 트리

### 17-6. 가계도 UX 우선순위
1. 카드 선택 시 직계 부모/자식 먼저
2. 전체 화면에서 세대별 펼치기
3. 필터:
   - 종족별
   - 루트별
   - 정화 혈통만
   - 희귀 태그 포함만
   - 생존 개체만

### 17-7. 도감과 가계도의 차이
- 도감: 종족/하이브리드 해금 기록
- 가계도: 실제 개체 역사 기록

둘은 반드시 분리한다.

---

## 18. 전투 시스템 연동

### 18-1. 전투 목적
전투는 제거가 아니라 정화/확보를 위한 문이다.

### 18-2. 기존 RPS 전투 활용 방침
StackCraft 공개 설명의 RPS 전투를 그대로 활용하고, 결과만 본 프로젝트 규칙에 맞게 후처리한다.

전투 후처리:
- 승리: 정화 카운트 증가 또는 즉시 정화
- 패배: 부상, 도주, 사망 가능
- 무승부: 시간 지연

### 18-3. 종족별 전투 의도
- Orc: 공격적, 전투력 높음
- Ogre: 느리지만 단단함
- Centaur: 기동성/회피 강점

### 18-4. 전투가 호감도와 연결되는 방식
선택 사항이지만 향후 확장으로 아래를 고려한다.

- 전투에서 구해준 개체는 호감도 보정
- 특정 종족은 강한 개체에 호감을 더 쉽게 품음
- 정화 직후 첫 상호작용 보너스

---

## 19. 밸런스 설계

### 19-1. 전체 밸런스 목표
- 첫 변이는 5~10분 안에 나온다.
- 첫 정화는 15~25분 안에 가능하다.
- 첫 호감도 해금은 20~30분 안에 가능하다.
- 첫 번식은 30~45분 안에 가능하다.
- 1시간 내 3세대의 씨앗이 보이기 시작한다.
- 자동 생태는 45분 이후부터 눈에 띈다.

### 19-2. 초기 수치 가이드

#### 장소 파견 시간
- Forest: 20초
- RockyMountain: 25초
- Swamp: 28초
- Sea: 32초

#### 호감도 상승 예시
- Loved 선물: +20
- Liked 선물: +12
- Neutral: +4
- Disliked: -6
- Hated: -12

#### 단계 임계
- Stranger → Open: 20
- Open → Warm: 50
- Warm → Bonded: 90
- Bonded → MateEligible: 140
- MateEligible → Devoted: 220

#### 반복 패널티
- 같은 선물 2회째: 0.75배
- 같은 선물 3회째 이후: 0.5배

#### 교배 소요
- Pairing Lock: 15초
- LiveBirth Gestation: 2일
- Egg Hatch: 2일
- Cocoon Hatch: 3일
- 산후 회복: 1일

### 19-3. 인구 소프트캡
초기 보드 소프트캡:
- 10개체까지 자유
- 11~15개체는 자동 교배 확률 감소
- 16개체 이상은 Feeding 압박 증가

### 19-4. 희귀성 제어
희귀 하이브리드는 아래 3축으로 만든다.
- 종족 조합 희귀도
- 부모 특성 태그 조합
- 정화 혈통 포함 여부

---

## 20. UI/UX 상세 설계

### 20-1. 카드 프레임 규칙
- 기본 동료: 기본 프레임
- 적대: 붉은 프레임
- 정화 중: 붉은 잔광 + 정화 아이콘
- 교배 잠금: 자물쇠 아이콘
- 임신/알/고치: 상태 배지
- 희귀 혈통: 모서리 문양/빛 효과

### 20-2. 카드 확대 보기
확대 시 표시:
- 아트
- 이름
- 종족
- 성별
- 세대
- 호감도 요약
- 좋아하는 선물
- 부모/자식 요약
- 변이 이력
- 특성 태그
- 상태 타이머

### 20-3. 가계도 화면 레이아웃
좌측 필터, 중앙 트리, 우측 노드 상세 권장.

좌측 필터:
- 루트
- 종족
- 세대 범위
- 태그
- 정화 혈통 포함 여부
- 생존 여부

중앙:
- 세대별 열 배치
- 부모→자식 선 연결
- 카드 썸네일 표시

우측:
- 선택 노드 상세
- 관련 개체 하이라이트
- “보드에서 선택” 버튼

### 20-4. 장소 카드 UX
장소 카드에는 완전한 결과표를 다 보여주지 않는다.  
대신 다음만 준다.

- 주 태그
- 위험도
- 예상 선물 계열
- 예상 종족 계열
- 현재 점유 여부

### 20-5. 피드백 우선순위
아래 5개는 반드시 즉시 피드백해야 한다.

- 변이 발생
- 적 등장
- 정화 완료
- 호감도 단계 상승
- 출산/부화 완료

---

## 21. 아트/연출 가이드

### 21-1. 아트 방향
- 카드 게임으로서 읽기 쉬움 우선
- 종족 차이는 실루엣과 프레임 태그로 먼저 전달
- 디테일은 확대 보기에서 보강
- 성인 분위기는 직설적 노출보다 표정, 포즈, 조명, 상태 아이콘, 관계 맥락으로 전달

### 21-2. 종족별 컬러 감성
- Human: 중립/베이지/갈색
- Elf: 초록/금색/은빛
- Beastfolk: 갈색/황토/숲색
- Merfolk: 청록/하늘/진주색
- Slimeborn: 보라/청록/점액 광택
- Orc: 붉은 갈색/전투 흔적
- Ogre: 짙은 붉은 회색
- Centaur: 적갈색/황금 초원 느낌

### 21-3. 성인 연출 분리 원칙
성인 분위기 관련 시각은 아래 계층으로 분리한다.

- BaseCardArt
- AffectionStateFX
- IntimacyPresentationLayer

즉 코어 로직은 `교배 시작`, `교배 진행`, `회복`, `관계 단계`만 알고, 실제 표현은 별도 레이어가 담당한다.

---

## 22. 사운드/감정 연출 가이드

### 22-1. 장소 파견
- Forest: 잎사귀/새소리
- RockyMountain: 바람/돌 구르는 소리
- Swamp: 물방울/점액 질감
- Sea: 파도/조개/물결

### 22-2. 관계 진행
- Loved 선물: 부드러운 상승 SFX
- 호감도 단계 상승: 짧은 하프/벨
- 정화 완료: 어두운 잔향에서 밝은 해소음으로 전환

### 22-3. 출생/부화
- 생체형 출산, 알 부화, 고치 파열을 모두 다른 사운드군으로 구분
- 지나치게 자극적이기보다 “새로운 생명/혈통 탄생” 느낌을 강조

---

## 23. 저장/불러오기 설계

### 23-1. 저장 필수 항목
- Day index
- 모든 생물 EntityId 및 상태
- 모든 개체 위치/스택 상태
- 장소 점유 상태
- 진행 중 타이머
- 호감도 테이블
- 가계도 노드 전체
- 이름 생성기 사용 히스토리
- 도감 해금 상태
- 설정 값

### 23-2. 저장 구조 권장
```yaml
SaveGame:
  Meta:
    Version: string
    DayIndex: int
    Seed: int
  Entities: [...]
  Affinities: [...]
  GenealogyNodes: [...]
  ActiveProcesses: [...]
  Encyclopedia: [...]
  Settings: [...]
```

### 23-3. 마이그레이션 대비
향후 종족/태그가 늘어날 때를 대비해 다음 원칙을 지킨다.
- enum 대신 string id 기반 저장 우선
- 누락 SO는 fallback profile 사용
- 버전 번호를 저장에 포함
- migration step table 제공

---

## 24. 기술 구조 권장안

### 24-1. 폴더 구조 제안
```text
Assets/
  Game/
    Core/
      Cards/
      DayCycle/
      Encounters/
      Saving/
    SpeciesSystem/
      Data/
      Runtime/
      UI/
      Tests/
    AffectionSystem/
      Data/
      Runtime/
      UI/
      Tests/
    ReproductionSystem/
      Data/
      Runtime/
      UI/
      Tests/
    PurificationSystem/
      Data/
      Runtime/
      UI/
      Tests/
    GenealogySystem/
      Data/
      Runtime/
      UI/
      Tests/
    LocationSystem/
      Data/
      Runtime/
      UI/
      Tests/
    Common/
      ScriptableObjects/
      Utilities/
      Debug/
```

### 24-2. 런타임 컴포넌트 목록
- CardEntityRuntime
- SpeciesRuntimeState
- GiftReceiverRuntime
- AffinityRuntimeState
- ReproductionRuntimeState
- PurificationRuntimeState
- AutoBehaviorRuntimeState
- GenealogyRuntimeState
- NameRuntimeState
- LocationVisitRuntimeState

### 24-3. 서비스 계층 권장
- SpeciesResolverService
- LocationMutationResolver
- AffinityService
- GiftEvaluationService
- ReproductionEligibilityService
- OffspringGeneratorService
- PurificationService
- GenealogyService
- NameGenerationService
- EncyclopediaService

### 24-4. 이벤트 버스 권장 이벤트
```yaml
EntityMutated
HostileSpawned
HostilePurified
GiftGiven
AffinityTierChanged
BreedingStarted
BreedingCompleted
PregnancyStarted
EggCreated
CocoonCreated
OffspringBorn
GrowthStageChanged
EntityDied
GenealogyUpdated
```

---

## 25. ScriptableObject 상세 스키마

### 25-1. SpeciesDataSO
```yaml
SpeciesId: string
DisplayName: string
FrameThemeId: string
BiomeAffinityMap:
  Forest: int
  RockyMountain: int
  Swamp: int
  Sea: int
GiftTasteProfileId: string
CombatArchetypeId: string
BaseStats:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
ReproductionProfileId: string
TraitPoolIds: [string]
IsHostileDefault: bool
CanBePurified: bool
NamePoolId: string
EncyclopediaSortOrder: int
ArtKey: string
```

### 25-2. LocationDataSO
```yaml
LocationId: string
DisplayName: string
DurationSeconds: float
PrimaryDropTableId: string
SecondaryDropTableId: string
MutationRuleIds: [string]
EncounterRuleIds: [string]
AllowedInputSpeciesIds: [string]
RiskLevel: int
HintTextKey: string
ArtKey: string
```

### 25-3. GiftPreferenceProfileSO
```yaml
ProfileId: string
LovedTags: [string]
LikedTags: [string]
NeutralTags: [string]
DislikedTags: [string]
HatedTags: [string]
SameGiftRepeatPenaltyCurveId: string
DailyGiftCap: int
ContextualBonusRules: [string]
```

### 25-4. ReproductionRuleSetSO
```yaml
RuleSetId: string
SpeciesA: string
SpeciesB: string
Allowed: bool
RequiredAffinityTier: int
GestationType: string
GestationDays: int
RecoveryDaysA: int
RecoveryDaysB: int
OffspringRollTableId: string
SpecialTraitBonusIds: [string]
```

### 25-5. OffspringRollTableSO
```yaml
TableId: string
Entries:
  - ResultSpeciesId: string
    Weight: int
    AddedTraits: [string]
    RequiredParentTraits: [string]
    ForbiddenParentTraits: [string]
```

### 25-6. TraitTagDataSO
```yaml
TraitId: string
DisplayName: string
Rarity: Common | Rare | Epic
DescriptionKey: string
PassiveModifiers:
  Fertility: int
  Charm: int
  Combat: int
  Appetite: int
ArtBadgeKey: string
```

### 25-7. NamePoolSO
```yaml
NamePoolId: string
CultureTag: string
MaleNames: [string]
FemaleNames: [string]
FamilyNames: [string]
HybridPatterns: [string]
```

### 25-8. AffinityThresholdSO
```yaml
Thresholds:
  StrangerToOpen: int
  OpenToWarm: int
  WarmToBonded: int
  BondedToMateEligible: int
  MateEligibleToDevoted: int
```

---

## 26. 런타임 상태머신 상세

### 26-1. Location Visit State
```text
Idle
-> AssignedToLocation
-> TravelOrProcessing
-> ResolveOutcome
-> ReturnOrTransform
-> Cooldown(optional)
-> Idle
```

### 26-2. Purification State
```text
Hostile
-> CapturedOrDefeated
-> Purifying
-> PurifiedRecovery
-> Recruitable
```

### 26-3. Affection State
```text
NoRelation
-> Known
-> Open
-> Warm
-> Bonded
-> MateEligible
-> Devoted
```

### 26-4. Reproduction State
```text
Unavailable
-> Eligible
-> PairingLock
-> Gestation
-> BirthPending
-> Recovery
-> Eligible
```

### 26-5. Growth State
```text
Infant
-> Juvenile
-> Adult
-> Elder(optional)
```

### 26-6. Auto Behavior State
```text
Idle
-> SeekNeed
-> Move
-> Interact
-> Resolve
-> Cooldown
-> Idle
```

---

## 27. 초기 콘텐츠 팩 설계

### 27-1. 장소 결과표 개요

#### Forest
자원:
- Flower
- Herb
- Berry
- SoftMeat
- TwigCharm

변이:
- Human -> Elf
- Human -> Beastfolk

적 이벤트:
- Hostile Orc Scout
- Forest Spirit Misfire(후속)

#### RockyMountain
자원:
- Stone
- Mushroom
- Carrot
- OreShard
- Apple

변이/이벤트:
- Human -> Centaur (희귀)
- Beastfolk -> Hardy variant

적 이벤트:
- Hostile Centaur Raider
- Hostile Ogre Wanderer

#### Swamp
자원:
- SlimeGel
- BogMushroom
- MarshMeat
- DarkHerb

변이:
- Human -> Slimeborn
- Beastfolk -> SwampMarked variant

적 이벤트:
- Hostile Orc
- Toxin delay event

#### Sea
자원:
- Fish
- Seaweed
- Shell
- Pearl
- SeaGlass

변이:
- Human -> Merfolk
- Elf -> SeaTouched variant (희귀)

적 이벤트:
- Tidal hazard
- Wild aquatic hostile (후속)

### 27-2. 선물 품목 1차
- Wild Flower
- Fragrant Herb
- Carrot
- Red Apple
- Smoked Meat
- Fresh Fish
- Seaweed Bundle
- Pearl Fragment
- Slime Gel
- Bog Mushroom
- Shiny Ore
- Soft Cloth

### 27-3. 초기 하이브리드 1차
- HalfElf
- HalfOrc
- TidebornHuman
- WildHybrid
- BogTouched
- PurifiedScion

### 27-4. 초기 희귀 trait 1차
- Graceful
- Fierce
- SeaTouched
- ForestBlessed
- PurifiedLine
- GiantBlood
- Swift
- Fertile
- Gentle
- Wild

---

## 28. 예시 규칙 테이블

### 28-1. 호감도 예시 표

| 선물 태그 | 엘프 | 오크 | 오우거 | 켄타우로스 | 머포크 | 슬라임본 |
|---|---:|---:|---:|---:|---:|---:|
| flower | +20 | -4 | -6 | +6 | +4 | 0 |
| herb | +16 | 0 | 0 | +4 | +6 | +2 |
| meat | 0 | +20 | +18 | +2 | +4 | +6 |
| carrot | +2 | 0 | +4 | +18 | 0 | 0 |
| fish | 0 | +4 | +2 | 0 | +18 | +4 |
| pearl | +4 | -2 | -2 | 0 | +20 | +2 |
| slime | -4 | +2 | +2 | -2 | +2 | +18 |
| mushroom | +4 | +8 | +6 | +2 | 0 | +14 |

### 28-2. 자손 예시 표

| 부모 A | 부모 B | 결과 후보 | 가중치 |
|---|---|---|---:|
| Human | Elf | Human | 30 |
| Human | Elf | Elf | 30 |
| Human | Elf | HalfElf | 40 |
| Human | Orc | Human | 20 |
| Human | Orc | Orc | 20 |
| Human | Orc | HalfOrc | 60 |
| Elf | Merfolk | Elf | 25 |
| Elf | Merfolk | Merfolk | 25 |
| Elf | Merfolk | TidebornHuman | 50 |
| Orc | Ogre | Orc | 35 |
| Orc | Ogre | Ogre | 25 |
| Orc | Ogre | WildHybrid | 40 |

---

## 29. 밸런스 테스트 시나리오

### 29-1. 테스트 목표
- 첫 종족 해금 시간이 너무 느리지 않은지
- 첫 정화 진입이 막히지 않는지
- 호감도 루프가 지루하지 않은지
- 자손 가치가 체감되는지
- 자동 생태가 보드 혼잡을 유발하지 않는지

### 29-2. 테스트 케이스 목록

#### Case_A_FirstMutation
- 시작 후 10분 안에 비인간 1종 확보 가능한가

#### Case_B_FirstPurification
- 시작 후 25분 안에 적색 종족 1종 정화 가능한가

#### Case_C_FirstMateEligible
- 올바른 선물 루프로 30분 안에 MateEligible 도달 가능한가

#### Case_D_FirstBirth
- 45분 안에 첫 자손이 나오는가

#### Case_E_AutoEcologyNoise
- 60분 시점 보드 인구가 통제 가능한가

#### Case_F_GenealogyPersistence
- 저장 후 로드 시 혈통 관계가 깨지지 않는가

---

## 30. Codex 구현 전략

### 30-1. Codex에게 한 번에 시키지 말 것
금지 예:
- “이 게임 전체를 구현해”
- “종족 시스템 다 만들어”
- “UI까지 다 붙여”

권장:
- 데이터 구조 생성
- 단일 서비스 구현
- 단일 패널 구현
- 단일 테스트 케이스 추가
- 단일 이벤트 체인 연결

### 30-2. 태스크 단위 규칙
한 태스크는 아래를 넘지 않게 한다.

- 수정 파일 8개 이내 권장
- 새 클래스 5개 이내 권장
- UI 1개 시스템 1개 정도 결합 허용
- 반드시 acceptance criteria 포함
- 테스트 또는 디버그 루틴 포함

### 30-3. Codex에 넘길 때 필요한 정보
- 현재 프로젝트 구조
- 현재 에셋 네이밍 규칙
- SO 생성 위치
- 테스트 방법
- 플레이 모드 실행 방법
- 기존 StackCraft의 교체 지점
- 절대 건드리면 안 되는 원본 영역

### 30-4. Codex 산출물 검사 원칙
- 컴파일 에러 0
- 플레이 모드 진입 가능
- 콘솔 에러 0 또는 허용 목록만
- 기존 기능 회귀 없음
- 최소 1개 테스트 또는 디버그 시나리오 제공

---

## 31. Unity MCP 사용 전략

### 31-1. Unity MCP에서 기대하는 최소 도구
- search assets / search hierarchy
- open/select GameObject
- create/update script or asset
- run compilation check
- read console
- enter/exit play mode
- capture screenshot

### 31-2. 권장 작업 흐름
1. 프로젝트 구조 검색
2. 기존 카드/DayCycle 관련 클래스 위치 찾기
3. 데이터 SO 추가
4. 런타임 서비스 추가
5. UI 패널 추가
6. 플레이 모드 실행
7. 콘솔 확인
8. 스크린샷 검증
9. 로그 기준 문제 수정

### 31-3. MCP로 잘 되는 일
- 씬/계층 상태 파악
- 카드 프리팹 연결
- 패널 배치
- 플레이 모드 반복 확인
- 콘솔 기반 회귀 검증

### 31-4. MCP로 불안정할 수 있는 일
- 대규모 아트 작업
- 복잡한 애니메이터 세팅
- 프로젝트마다 다른 커스텀 에디터 대응
- 패키지 내부 구조 미확정 상태에서의 광범위 리팩터링

---

## 32. AGENTS.md 초안

아래는 프로젝트 루트의 `AGENTS.md`에 넣기 좋은 초안이다.

```md
# AGENTS.md

## Mission
Implement the game as a small-scale card-based fantasy lineage simulation built on top of the existing StackCraft project structure.

## Priorities
1. Preserve existing StackCraft flow unless a task explicitly asks to replace it.
2. Prefer additive architecture over destructive rewrites.
3. Keep all gameplay logic data-driven.
4. Separate gameplay logic from presentation logic.
5. Keep adult presentation abstract and isolated from core systems.

## Mandatory architecture rules
- Species, affinity, purification, reproduction, genealogy, and location mutation must be separate systems.
- Every living entity card must have a stable persistent EntityId.
- All cross-system references should prefer string ids or serializable references.
- Avoid hardcoding per-species logic in monolithic switch statements when a data-driven table is viable.
- New features must be save/load safe.

## Working style
- For any task, first inspect the current project structure and identify the correct integration points.
- Make the smallest safe change that satisfies the task.
- After code changes, run a compile check and read Unity console logs.
- If the task affects gameplay state, provide either a unit test, editor test, or a debug verification path.
- If unsure about a project-specific type or method, inspect the repository first instead of inventing names.

## System boundaries
- Core logic must not depend on explicit adult scene assets.
- Presentation-specific visuals should be behind interfaces or clearly isolated layers.
- Genealogy data must persist across saves and scene reloads.
- Protagonist cards are special entities and should not be auto-bred by default.

## Preferred deliverables per task
- Summary of modified files
- What was implemented
- What assumptions were made
- How to test in Unity
- Any unresolved risks
```

---

## 33. Codex 태스크 백로그

### 33-1. Epic 구조
- Epic_A_LocationMutation
- Epic_B_HostilePurification
- Epic_C_GiftAffinity
- Epic_D_Reproduction
- Epic_E_Genealogy
- Epic_F_AutoEcology
- Epic_G_UXPanels
- Epic_H_SaveLoadIntegration

### 33-2. 태스크 상세

#### Task_001_Audit_StackCraft_IntegrationPoints
목표:
- 기존 StackCraft 프로젝트에서 카드 엔티티, Day Cycle, Encounter, 저장, UI 탑바 관련 파일을 찾고 문서화한다.

완료 기준:
- 통합 지점 목록 md 파일 1개
- 건드려야 할 클래스와 건드리면 안 될 클래스 구분

#### Task_002_Create_Core_ID_And_Runtime_State
목표:
- 모든 생물 카드에 stable EntityId를 부여할 수 있는 기반 추가

완료 기준:
- EntityId 생성/유지 로직
- 저장 연동 포인트 확인
- 디버그 로그 가능

#### Task_003_Create_SpeciesData_Assets_And_Enums
목표:
- SpeciesDataSO, NamePoolSO, TraitTagDataSO 생성

완료 기준:
- 초기 8종 종족 데이터 생성 가능
- 에디터에서 SO 작성 가능

#### Task_004_Replace_TopBar_Boosters_With_LocationBar
목표:
- 기존 카드팩 탑바를 4개 고정 장소 카드 UI로 대체 또는 병행

완료 기준:
- 상단 UI에 Forest/RockyMountain/Swamp/Sea 표시
- 점유 상태와 타이머 표시

#### Task_005_Implement_Location_Assignment_And_Result_Resolution
목표:
- 개체 카드 드래그 후 장소 파견, 타이머 종료 후 결과 생성

완료 기준:
- 최소 1개 위치에서 자원 드롭
- 최소 1개 위치에서 종족 변이
- 콘솔 에러 없음

#### Task_006_Implement_Hostile_State_And_Purification_Flow
목표:
- 적색 적대 상태와 전투 후 정화 흐름 구현

완료 기준:
- HostileRed → Purifying → Recruitable 상태 전환
- UI 배지 변화

#### Task_007_Implement_Gift_Item_And_Preference_Evaluation
목표:
- 선물 카드와 종족별 선호도 계산기 구현

완료 기준:
- Loved / Liked / Neutral / Disliked / Hated 판정 가능
- Affinity delta 반환

#### Task_008_Implement_Affinity_Runtime_And_Tiering
목표:
- 개체 간 호감도 저장 및 티어 계산

완료 기준:
- 특정 두 개체 사이 관계 점수 저장
- 티어 변경 이벤트 발생

#### Task_009_Implement_Card_Detail_Panel
목표:
- 카드 선택 시 이름, 종족, 선호 선물, 호감도, 혈통 요약 표시

완료 기준:
- 선택 카드 정보 패널 동작
- null/미선택 안전 처리

#### Task_010_Implement_Breeding_Eligibility_Validator
목표:
- 교배 가능 여부를 단일 서비스로 판정

완료 기준:
- 성별/성체/호감도/적대/회복/잠금 검사
- 실패 이유 enum 반환

#### Task_011_Implement_Breeding_Lock_And_Gestation
목표:
- Pairing lock, Pregnancy/Egg/Cocoon 처리

완료 기준:
- 타이머 진행
- 완료 시 자손 생성 경로 연결

#### Task_012_Implement_Offspring_Generator
목표:
- 자손 종족 및 trait 생성기 구현

완료 기준:
- 부모 종족 조합 테이블 적용
- 부모/자식 연결 저장

#### Task_013_Implement_Name_Generation
목표:
- 이름 풀 기반 이름 자동 생성

완료 기준:
- 종족/혼혈 규칙에 맞는 이름 부여
- 중복 충돌 처리

#### Task_014_Implement_Genealogy_Database
목표:
- 가계도 노드 저장/갱신/조회 시스템 구현

완료 기준:
- 부모, 자식, 세대 추적 가능
- 저장/불러오기 유지

#### Task_015_Implement_Genealogy_Tree_Screen
목표:
- 전체 가계도 화면 구현

완료 기준:
- 루트 선택
- 세대별 보기
- 선택 노드 상세 표시

#### Task_016_Implement_NonProtagonist_AutoBehavior
목표:
- 비주인공 자동 행동 기본 상태 구현

완료 기준:
- Idle/SeekFood/EvaluateMate/BreedingLock 최소 구현
- 주인공 자동 행동 기본 비활성화

#### Task_017_Implement_SaveLoad_Migration_Safety
목표:
- 신규 시스템 전부 저장/불러오기 연동

완료 기준:
- 저장 후 로드 시 EntityId/가계도/호감도 유지
- 버전 필드 존재

#### Task_018_Create_Balance_Debug_Panel
목표:
- 수치 조정 디버그 패널 제공

완료 기준:
- 장소 시간
- 호감도 델타
- 임신 일수
- 자동 교배 확률
를 에디터/디버그에서 조정 가능

---

## 34. 태스크별 수용 기준 템플릿

아래 템플릿을 각 Codex 태스크에 붙여 넣는다.

```md
## Acceptance Criteria
- No compile errors.
- Unity enters play mode successfully.
- No new console errors after the feature is exercised once.
- The feature can be triggered through one explicit in-editor or in-game path.
- Data is serialized safely if the task affects persistent state.
- The task includes a short verification note.

## Verification
1. Open scene: ...
2. Press play.
3. Create/select ...
4. Perform action ...
5. Confirm expected UI/log/state ...

## Output format
- Modified files
- Summary
- Assumptions
- Verification steps
- Known limitations
```

---

## 35. Codex 프롬프트 초안

### 35-1. 통합 지점 조사 프롬프트
```text
Inspect the current Unity project and identify the integration points for:
1) card entity runtime,
2) day cycle phases,
3) encounter spawning,
4) save/load,
5) top bar UI.

Do not modify code yet.
Return:
- the relevant files,
- why each file matters,
- the safest extension points,
- any risky areas that should not be rewritten.
```

### 35-2. Location Bar 구현 프롬프트
```text
Implement a first-pass Location Bar that replaces or coexists with the existing booster-pack top bar.
Requirements:
- Show four fixed locations: Forest, RockyMountain, Swamp, Sea
- Each slot must display occupancy and a progress timer if active
- Integrate with existing card drag/drop flow if available
- Avoid breaking existing UI panels
- Provide a short verification guide after implementation
```

### 35-3. 호감도 시스템 프롬프트
```text
Implement a data-driven affinity system between entity cards.
Requirements:
- stable relation record between two EntityIds
- score + tier
- configurable thresholds from data
- one public method to apply gift-based affinity delta
- return reason if relation update is blocked
- include at least one test or debug entry point
```

### 35-4. 가계도 시스템 프롬프트
```text
Implement a genealogy database that stores parent-child relationships for every offspring entity.
Requirements:
- persistent EntityId references
- generation index
- father/mother references
- child list
- save/load compatibility
- query methods for direct parents, direct children, and full lineage root
Do not build the full screen yet unless needed for verification.
```

---

## 36. 디버그/테스트 도구 설계

### 36-1. 필요한 디버그 버튼
- Spawn Human Male
- Spawn Human Female
- Force Location Result: Forest
- Force Hostile Orc
- Force Purify Selected
- Give Selected Gift: Flower
- Set Affinity Tier
- Force Breed Selected Pair
- Force Birth Complete
- Open Genealogy Window

### 36-2. 테스트 씬 구성
`Prototype_SpeciesLoop.unity`

포함:
- 4개 장소 바
- 최소 카드 보드
- 우측 상세 패널
- 디버그 패널
- 콘솔 클리어 버튼(optional)

### 36-3. 플레이 모드 스모크 테스트
1. 씬 로드
2. 인간 남/여 생성
3. 숲 파견
4. 엘프 또는 꽃 획득
5. 꽃 선물
6. 호감도 상승 확인
7. 교배 조건 디버그 충족
8. 자손 생성
9. 가계도 반영
10. 저장/불러오기 후 유지 확인

---

## 37. 리스크와 대응

### 37-1. 리스크: 기존 에셋 구조를 많이 건드려서 회귀 발생
대응:
- 통합 지점 조사 태스크를 먼저 수행
- 기존 파일 직접 수정 최소화
- Adapter/Facade 패턴 사용

### 37-2. 리스크: 종족별 예외가 늘어나 코드가 하드코딩 지옥이 됨
대응:
- SO 기반 룰테이블 우선
- 서비스 계층에서 데이터 조회
- per-species custom class는 극히 제한

### 37-3. 리스크: 자동 행동이 보드를 어지럽힘
대응:
- 비주인공만
- 성체만
- 확률 낮게 시작
- 인구 소프트캡과 쿨다운

### 37-4. 리스크: 가계도 저장이 깨짐
대응:
- EntityId 불변
- 저장/로드 전용 테스트
- 노드 생성과 엔티티 생성 시점의 책임 분리

### 37-5. 리스크: 성인 표현이 코어 로직에 엮여 유지보수 난이도 상승
대응:
- IntimacyPresentationLayer로 분리
- 코어는 상태와 이벤트만 안다
- 프레젠테이션은 이벤트 구독으로 처리

---

## 38. 후속 확장 로드맵

### 38-1. Vertical Slice 이후
- 사막 / 폐허 / 화산 추가
- 추가 적대 종족
- 하이브리드 종족 확장
- 도감 보상
- 이벤트 선택지

### 38-2. 관계 확장
- 선물 외 상호작용
- 동행 탐험
- 질투/선호 경합
- 부모 성향이 자손 성장에 미치는 영향

### 38-3. 거점 확장
현재 문서 범위 바깥이지만 나중에 아래 순서로 붙인다.
- 쉼터
- 보육/알 보관
- 가계도 전시 공간
- 특정 종족 전용 시설

---

## 39. 이 문서를 읽는 Codex를 위한 우선순위 요약

1. 먼저 현재 StackCraft 구조를 조사한다.
2. EntityId와 저장 친화적 개체 모델을 만든다.
3. Species / Location / Gift / Affinity 데이터 자산을 만든다.
4. 탑바를 Location Bar로 바꾼다.
5. 장소 결과 처리와 종족 변이를 만든다.
6. 적색 정화 흐름을 만든다.
7. 선물과 호감도 시스템을 만든다.
8. 교배 자격 판정과 잠금을 만든다.
9. 자손 생성과 가계도를 만든다.
10. 자동 생태와 디버그 툴을 붙인다.
11. 마지막에 프레젠테이션을 얹는다.

---

## 40. 최종 설계 결론

이 프로젝트의 가장 강한 방향은 명확하다.

- 많은 카드 종류를 늘리는 게임이 아니다.
- 소수 종족과 선명한 관계 루프를 중심으로 간다.
- 인간 남/여 주인공 2장으로 감정 축을 만든다.
- 장소 카드는 카드팩의 대체물이자 종족 해금 장치다.
- 적색 적대 종족은 제거 대상이 아니라 정화 후 혈통 편입 대상이다.
- 선물은 자원 소비가 아니라 호감도 퍼즐이다.
- 번식은 곧 생산이 아니라 조건, 시간, 잠금, 혈통 가치의 시스템이다.
- 가계도는 UI 기능이 아니라 장기 플레이의 목적 그 자체다.
- 성인 분위기는 코어 로직을 지배하지 않고 뒤에서 강화해야 한다.
- Codex와 Unity MCP를 쓰려면 큰 서술보다 `작은 태스크 + 명확한 수용 기준 + 검사 루프`가 중요하다.

이 문서를 기준으로 다음 단계는 두 갈래다.

A. `실제 AGENTS.md + Task 파일 세트 생성`
- 저장소에 바로 투입 가능한 작업 지시 문서 묶음

B. `밸런스 표/드롭 테이블/종족별 상세 수치 문서`
- 디자이너 조정용 숫자 문서

본 버전은 A와 B의 공통 부모 문서로 사용한다.
