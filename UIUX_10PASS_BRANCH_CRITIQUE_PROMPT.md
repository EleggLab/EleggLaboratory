# UI/UX 50-Pass Branch Critique Prompt

파일명 `UIUX_10PASS_BRANCH_CRITIQUE_PROMPT.md` 는 워크스페이스 호환성을 위해 유지하지만, 실제 기본 반복값은 50회다.

이 문서는 앞으로 이 워크스페이스에서 UI/UX와 아트 방향을 만들 때 쓰는 상위 프롬프트 문서다.

핵심 이름:

- `50-Pass Branch Critique Loop`

이 문서는 다음 기존 작업에서 가져올 만한 원칙을 합쳐 정리한 것이다.

- `PROJECT_UIUX_POLICY.md`
- `MEMORY.md`
- `memory/2026-03-28.md`
- `unity-mcptest/stackcraft_codex_unity_mcp_master_design_v0_4_en.md`
- `game_DEV/word-morph-lab/request.json`

## 1. 절대 전제

- 이 프로젝트의 기본 UI/UX 틀은 사용자의 원작이다.
- 지금 보이는 구조는 임시 스캐폴딩이 아니라 의도가 담긴 authored trunk다.
- 개선은 가능하지만, 기본적으로는 `가지를 치고 다듬는 방식`으로 접근한다.
- generic AI UI, 흔한 SaaS 카드 레이아웃, 몰개성한 모바일 앱 템플릿으로 평탄화하지 않는다.

## 2. 가져온 핵심 원칙

### 2-1. trunk 보존 원칙

기존 작업에서 가져온 기본 태도:

- 기존 흐름은 명시적으로 교체하라고 하지 않으면 보존한다.
- additive architecture를 destructive rewrite보다 우선한다.
- 구조를 갈아엎기보다 integration point를 먼저 찾는다.
- 가장 작은 안전한 변화로 목적을 달성한다.

이 원칙은 다음 기존 문서의 작업 철학에서 가져왔다.

- `unity-mcptest/stackcraft_codex_unity_mcp_master_design_v0_4_en.md`

### 2-2. 감정 경험 우선 원칙

화면은 정보 배치가 아니라 감정 곡선을 설계하는 것이다.

- curiosity
- anticipation
- reveal
- payoff
- retention

기존 설계 문서에서 가져온 감정 경험 해석:

- 사용자는 단순히 버튼을 누르는 것이 아니라 다음 결과를 기대해야 한다.
- 캐릭터/카드/개체는 generic resource가 아니라 정서적 anchor여야 한다.
- 결과물은 disposable output이 아니라 추적 가능하고 기억되는 존재처럼 느껴져야 한다.

이 원칙은 다음 기존 문서의 emotional experience와 design principles를 변환해 가져왔다.

- `unity-mcptest/stackcraft_codex_unity_mcp_master_design_v0_4_en.md`

### 2-3. 무드 보드 우선 원칙

기존 메모에서 가져온 무드 해석:

- dark dossier mood
- black or zinc base
- strong accent color
- oversized hero typography
- poster-like character treatment
- map or list or sheet처럼 정보가 층위화된 presentation
- soft fade-in
- hover or focus zoom
- subtle glass or dim panel

중요:

- 이 무드는 `톤과 위계` 참고용이다.
- gameplay structure를 그대로 복사하는 기준이 아니다.

이 원칙은 다음 메모에서 가져왔다.

- `MEMORY.md`
- `memory/2026-03-28.md`

### 2-4. 프롬프트 위생 원칙

기존 이미지 생성 작업에서 가져온 프롬프트 위생:

- positive prompt는 중심 피사체, 구도, 선화, 셀 셰이딩, 표정, 안정성, 조명, 무드 순으로 쌓는다.
- negative prompt는 다음 류를 기본 차단값으로 고려한다:
  - low quality
  - worst quality
  - blurry
  - realistic
  - painterly
  - 3d
  - text
  - watermark
  - multiple views
  - cropped
  - bad anatomy
  - duplicate body
  - deformed face

이 원칙은 다음 기존 파일에서 가져왔다.

- `game_DEV/word-morph-lab/request.json`

## 3. 50-Pass Branch Critique Loop

기본 옵션:

- 기본 반복 수: `50`
- 기본 상태: `항상 켜짐`
- 사용자가 빠르게 하자고 하지 않는 한 생략하지 않는다.

### pass 구성

1. Trunk Keeper (`1 / 11 / 21 / 31 / 41`)
   - 원작 UI/UX에서 절대 잃으면 안 되는 골격을 선언한다.
   - 현재 trunk에서 첫 working branch를 직접 만든다.
2. Structure Critic (`2 / 12 / 22 / 32 / 42`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 레이아웃, 그룹, 블록 간 위계를 직접 수정한다.
3. Hierarchy Critic (`3 / 13 / 23 / 33 / 43`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 시선 흐름, 강조 순서, 정보 밀도를 직접 수정한다.
4. Interaction Critic (`4 / 14 / 24 / 34 / 44`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 탭, 클릭, reveal 순서, friction, user journey를 직접 수정한다.
5. Mood Critic (`5 / 15 / 25 / 35 / 45`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 사용자의 세계관과 감정을 유지하도록 직접 수정한다.
6. Craft Critic (`6 / 16 / 26 / 36 / 46`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 타이포, 여백, 정렬, 크기, 리듬, 세부 완성도를 직접 수정한다.
7. Accessibility Critic (`7 / 17 / 27 / 37 / 47`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 가독성, 명암, 터치 타겟, 명확성, 이해 가능성을 직접 수정한다.
8. Anti-Generic Critic (`8 / 18 / 28 / 38 / 48`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - generic해진 부분을 직접 걷어내고 흔한 AI 산출물 냄새를 제거한다.
9. Platform Critic (`9 / 19 / 29 / 39 / 49`)
   - 직전 pass가 남긴 working branch를 이어받는다.
   - 실제 기기, 마켓, 스토어 캡처, 릴리즈 현실성 기준으로 직접 수정한다.
10. Final Integrator (`10 / 20 / 30 / 40 / 50`)
    - 직전 pass가 남긴 working branch를 이어받는다.
    - 그 라운드의 마지막 직접 수정 pass를 수행한다.
    - pass 50에서는 이 결과가 곧 최종 수정본이다.

### 라운드 규칙

- 1라운드: pass `1-10`
- 2라운드: pass `11-20`
- 3라운드: pass `21-30`
- 4라운드: pass `31-40`
- 5라운드: pass `41-50`
- 각 라운드는 직전 라운드가 직접 수정해 남긴 working branch를 이어받아 더 깊게 다듬는다.

### working branch 규칙

- `pass 1 -> working branch v1`
- `pass 2 -> v1을 직접 수정해 v2`
- `pass 3 -> v2를 직접 수정해 v3`
- ...
- `pass 50 -> v49를 직접 수정해 v50`
- 각 pass는 평가 메모만 남기지 않는다.
- 각 pass는 실제 수정본을 만들고 다음 pass로 handoff한다.
- `50명의 평가 보고서를 먼저 모으고 나중에 구현`하는 방식은 기본값이 아니다.
- 별도의 최종 구현 단계는 없고, `v50`이 최종 결과물이다.

### 반복 규칙

- 각 pass는 이전 pass가 남긴 작업본을 직접 수정해서 다음 pass로 넘긴다.
- 매 pass는 `무엇을 보존했는지`와 `무엇을 개선했는지`를 분리해서 판단한다.
- 매 pass는 `이번 pass에서 실제로 적용한 변경`과 `다음 pass를 위한 handoff note`를 남긴다.
- pass가 진행될수록 더 generic해지면 실패다.
- 더 깨끗해졌더라도 원작의 맛이 줄면 rollback 후보로 본다.

## 4. 기본 출력 형식

UI/UX 제안이나 수정안을 낼 때 기본적으로 아래 순서를 따른다.

1. trunk 선언
   - 무엇이 원작의 핵심인지 먼저 말한다.
2. 문제 선언
   - 지금 불편하거나 약한 점을 짚는다.
3. 50-step handoff 요약
   - 어느 pass가 무엇을 직접 수정했는지 적는다.
4. final state
   - 무엇을 유지했고 무엇이 최종 반영됐는지 적는다.
5. anti-generic 체크
   - 왜 이게 더 좋아졌지만 더 평범해지지는 않았는지 적는다.

## 5. 실전용 마스터 프롬프트

아래 프롬프트를 기본 템플릿으로 쓴다.

```text
당신은 이 프로젝트의 UI/UX를 다루는 설계자다.

중요 전제:
- 이 프로젝트의 기본 UI/UX 틀은 사용자의 원작이다.
- 현재 구조를 placeholder처럼 취급하지 말고 authored trunk로 취급하라.
- 기존 화면의 layout DNA, interaction rhythm, information hierarchy, emotional framing을 먼저 보존하라.
- generic AI UI, 흔한 SaaS 카드 레이아웃, 몰개성한 모바일 앱 템플릿으로 평탄화하지 마라.

작업 규칙:
- 기존 흐름은 명시적으로 교체하라는 요청이 없으면 보존하라.
- additive refinement를 destructive rewrite보다 우선하라.
- 가장 작은 안전한 수정으로 가장 큰 품질 향상을 노려라.
- 시스템화, 정렬, 타이포, 여백, 모션, 접근성, 퍼포먼스는 고도화해도 된다.
- 다만 결과가 더 generic해지면 실패다.

감정 경험 기준:
- curiosity -> anticipation -> reveal -> payoff의 흐름을 설계하라.
- 캐릭터, 카드, 결과물, 선택지는 disposable output이 아니라 emotional anchor처럼 느껴져야 한다.

무드 기준:
- dark dossier mood 또는 프로젝트에 맞는 authored mood를 유지하라.
- oversized hero treatment, strong contrast, sheet-like information layering, subtle glass/dim panels 같은 표현은 필요할 때 활용하라.
- 무드는 tone and hierarchy 참고용이지, 구조 복사용이 아니다.

반드시 50-Pass Branch Critique Loop를 수행하라.

구성은 10개 역할을 5라운드 반복하는 방식이다:
- 1 / 11 / 21 / 31 / 41: Trunk Keeper
- 2 / 12 / 22 / 32 / 42: Structure Critic
- 3 / 13 / 23 / 33 / 43: Hierarchy Critic
- 4 / 14 / 24 / 34 / 44: Interaction Critic
- 5 / 15 / 25 / 35 / 45: Mood Critic
- 6 / 16 / 26 / 36 / 46: Craft Critic
- 7 / 17 / 27 / 37 / 47: Accessibility Critic
- 8 / 18 / 28 / 38 / 48: Anti-Generic Critic
- 9 / 19 / 29 / 39 / 49: Platform Critic
- 10 / 20 / 30 / 40 / 50: Final Integrator

각 pass 규칙:
- 이전 pass가 남긴 working branch를 직접 수정하고 다음 pass로 넘겨라.
- 무엇을 보존했는지 먼저 적고, 무엇을 개선했는지 그다음 적어라.
- 이번 pass에서 실제로 적용한 변경을 적어라.
- 다음 pass가 이어받을 handoff note를 적어라.
- generic drift가 발생하면 되돌려라.
- 평가만 50개 모으고 나중에 따로 구현하지 마라.
- pass 50 결과물이 곧 최종 수정본이다.

최종 출력 형식:
1. trunk 요약
2. 핵심 문제
3. 50-step handoff 요약
4. final state
5. anti-generic 검토
6. implementation notes
```

## 6. 이미지 아트용 보조 프롬프트 규칙

이미지나 캐릭터 아트 쪽으로 갈 때는 아래를 추가한다.

### positive prompt 조립 순서

- subject
- composition
- camera distance
- line quality
- shading style
- face stability
- silhouette clarity
- costume motif
- lighting
- emotional tone
- world texture

### negative prompt 기본값

- low quality
- worst quality
- blurry
- realistic
- painterly
- 3d
- text
- watermark
- multiple views
- cropped
- extra arms
- extra hands
- extra fingers
- duplicate body
- deformed face
- bad anatomy

## 7. 짧은 호출 문구

앞으로 짧게 부를 이름:

- `50-Pass Branch Critique Loop`

짧은 호출 예시:

- `이번 UI는 50-Pass Branch Critique Loop로 진행`
- `원작 trunk 유지하고 50-pass로 다듬기`
- `generic drift 없이 branch 방식으로 refine`
