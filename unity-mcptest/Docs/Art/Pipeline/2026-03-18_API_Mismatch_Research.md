# NovelAI API Mismatch Research

## 핵심 결론
원본과 비슷하지 않았던 1차 원인은 `프롬프트 부족`이 아니라 `생성 조건 손실`이다.  
특히 아래 3개가 크다.

1. 파일명만 보면 빠지는 정보가 많다.
2. 원본 PNG는 `NovelAI Diffusion V4.5` 메타데이터를 갖고 있다.
3. 현재 자동 API에서 바로 검증된 경로는 `nai-diffusion-3`이라 모델 경로 자체가 다르다.

## 이번에 직접 확인한 사실
- 프롬프트형 PNG 27장은 전부 NovelAI 메타데이터를 가지고 있었다.
- 메타데이터 안에는 아래가 들어 있었다.
  - full prompt
  - undesired content (`uc`)
  - sampler
  - steps
  - scale
  - cfg_rescale
  - seed
  - `Source: NovelAI Diffusion V4.5 C02D4F98`
- 같은 이미지를 `파일명 프롬프트 + seed`만으로 다시 뽑았을 때는 원본과 크게 달랐다.
- 같은 이미지를 `PNG 메타데이터 기반 prompt/uc/sampler/steps/scale/seed`로 다시 뽑았을 때는 훨씬 가까워졌다.

## 왜 이렇게 되는가
### 1. Sampler와 세부 설정이 결과를 크게 바꾼다
NovelAI 공식 docs는 sampler가 이미지에 큰 영향을 주고, 같은 prompt라도 sampler가 다르면 결과가 달라진다고 설명한다.

### 2. Prompt만 같아도 모델이 다르면 결과가 달라진다
우리 원본은 `V4.5`에서 생성됐고, 자동 API에서 바로 검증된 모델은 `nai-diffusion-3`였다.  
같은 prompt/seed라도 모델이 다르면 스타일과 비율이 달라지는 건 자연스럽다.

### 3. NovelAI는 과거에도 같은 prompt+seed가 바뀐 적이 있다
NovelAI 공식 Reddit 공지에 따르면 V3 토큰 버그 수정 후에는 같은 prompt와 seed를 넣어도 예전 이미지와 약간 다를 수 있었고, 옛 이미지는 메타데이터를 불러와 UI에서 재생성하는 방식으로 대응한다고 했다.  
즉, `prompt+seed만 저장`하는 건 충분하지 않다.

### 4. 레퍼런스 기능을 썼다면 prompt만으로는 복제가 안 된다
공식 docs 기준으로 `Vibe Transfer`와 `Character Reference`는 별도의 강력한 conditioning이다.  
원본 생성에 이런 기능이 개입됐다면 prompt 텍스트만으로는 원본을 재현하기 어렵다.

## 해결 방법
### 해결 1. PNG 메타데이터를 기준 진실로 삼기
- 파일명 대신 PNG `Comment` JSON을 읽는다.
- prompt뿐 아니라 `uc`, `sampler`, `steps`, `scale`, `cfg_rescale`, `seed`까지 함께 재사용한다.

### 해결 2. 자동 초안과 최종 재현을 분리하기
- 자동 API: 대량 초안, 종족 배리에이션, 빠른 분기 검증
- V4.5 웹 UI: 원본풍 재현, seed 고정 미세 조정, vibe/reference 기반 정제

### 해결 3. 비교 단위를 바꾼다
- `파일명 prompt 그대로` 비교가 아니라
- `원본 PNG metadata replay`를 먼저 통과 기준으로 삼는다.

### 해결 4. 최종 스타일 복제는 V4.5 UI에서 한다
- 메타데이터 import 또는 PNG 업로드 기반 재생성
- 필요 시 `Vibe Transfer`로 스타일만 고정
- 같은 캐릭터 반복은 `Character Reference`

## 권장 다음 단계
1. 메타데이터가 있는 PNG를 전부 인덱싱
2. `metadata replay`로 가까운 재현이 되는지 먼저 확인
3. 가까워진 컷만 seed lock
4. 그 다음에 종족 확장
5. 마지막에만 adult 이벤트 컷 확장

## 참고 링크
- NovelAI Sampling Docs: https://docs.novelai.net/en/image/sampling/
- NovelAI Steps & Guidance Docs: https://docs.novelai.net/en/image/stepsguidance
- NovelAI Character Reference Docs: https://docs.novelai.net/en/image/characterreference
- NovelAI Vibe Transfer Docs: https://docs.novelai.net/en/image/vibetransfer
- NovelAI Upload Image Docs: https://docs.novelai.net/ja/image/uploadimage/
- Official NovelAI Reddit post about same prompt/seed changing after fix: https://www.reddit.com/r/NovelAi/comments/18nxnta/bugfix_image_gen_naidiffusionv3_token_bug/
