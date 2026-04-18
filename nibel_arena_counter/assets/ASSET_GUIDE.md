# Nibel Arena Counter Asset Guide

이 문서는 `니벨 아레나 카운터` 앱에 교체 투입할 이미지 자산 규격서입니다.
현재 앱에는 플레이스홀더가 들어 있고, 아래와 같은 파일명으로 실제 이미지를 전달해 주시면 그대로 교체 적용할 수 있습니다.

## 1. 제출 개수

필수 제출:

- 테마당 4장
- 총 4테마 x 4장 = 16장

권장 제출:

- 테마당 5장
- 총 4테마 x 5장 = 20장

테마 목록:

- `cooking_oil`
- `goddess_squad`
- `infinity_rail`
- `arcana`

## 2. 폴더 구조

아래 구조 그대로 주시면 가장 좋습니다.

```text
assets/
  themes/
    cooking_oil/
      background_main.png
      hero_loop.gif
      initiative_first.png
      initiative_second.png
      theme_thumb.png
    goddess_squad/
      background_main.png
      hero_loop.gif
      initiative_first.png
      initiative_second.png
      theme_thumb.png
    infinity_rail/
      background_main.png
      hero_loop.gif
      initiative_first.png
      initiative_second.png
      theme_thumb.png
    arcana/
      background_main.png
      hero_loop.gif
      initiative_first.png
      initiative_second.png
      theme_thumb.png
```

압축해서 주실 때도 이 구조를 유지해 주시면 바로 덮어쓸 수 있습니다.

## 3. 필수 이미지 상세 규격

### `background_main.png`

용도:

- 메인 화면 전체 세로 배경
- 카드와 숫자 패널 뒤에 깔리는 핵심 분위기 이미지

권장 규격:

- 파일명: `background_main.png`
- 형식: `PNG` 권장, `WEBP`도 가능
- 권장 해상도: `1440 x 3200`
- 여유 해상도 권장: `1600 x 3600` 또는 `1800 x 4000`
- 최소 허용 해상도: `1080 x 2400`
- 비율: 세로형 `9:20` 근처면 가장 좋음
- 색공간: `sRGB`
- 투명도: 없음 권장
- 권장 용량: `4MB` 이하
- 절대 상한 권장: `10MB` 이하

구성 가이드:

- 중앙 세로 구간은 UI 패널이 많이 덮으므로 너무 중요한 얼굴이나 텍스트를 두지 않는 편이 좋음
- 상단 좌측은 GIF 카드, 상단 우측은 선공/후공 카드가 올라감
- 중단 중앙은 가장 큰 숫자 카드가 올라가므로 이 구역은 너무 복잡하지 않게
- 하단 중앙도 큰 사용 애너지 카드가 올라감
- 배경 자체만으로도 테마 감정이 보이되, 위에 반투명 카드가 올라가도 지저분하지 않아야 함

안전영역 권장:

- 상단 12%
- 하단 12%
- 좌우 8%
- 중앙 40% 폭 구간은 저디테일 유지 권장

피해야 할 것:

- 화면 중앙에 잘리는 얼굴
- 배경 안에 이미 박혀 있는 큰 한글/영문 텍스트
- 지나치게 밝은 흰색 대면적
- 강한 노이즈나 복잡한 패턴

### `hero_loop.gif`

용도:

- 좌상단 루프 GIF 카드
- 각 테마의 대표 무드 이미지

권장 규격:

- 파일명: `hero_loop.gif`
- 형식: `GIF`
- 권장 캔버스: `1200 x 700`
- 여유 해상도 권장: `1440 x 840`
- 최소 허용 해상도: `960 x 560`
- 비율: 가로형 `1.7:1` 전후
- 권장 프레임: `12fps ~ 20fps`
- 권장 길이: `2초 ~ 6초`
- 재생 방식: 반드시 자연스러운 무한 루프
- 권장 용량: `8MB` 이하
- 가능하면 목표 용량: `3MB ~ 6MB`

구성 가이드:

- 캐릭터의 상반신, 팀 무드, 상징 연출처럼 한눈에 테마가 느껴지는 장면이 좋음
- 루프 시작과 끝이 자연스럽게 이어져야 함
- 빠른 섬광이나 눈부심은 피하는 편이 좋음
- 텍스트를 직접 넣지 않는 것이 좋음
- 좌우 끝부분이 살짝 잘려도 문제없는 구성이 좋음

안전영역 권장:

- 상하 12%
- 좌우 10%
- 중앙 60% 구간에 핵심 피사체 유지

피해야 할 것:

- 너무 많은 장면 전환
- 과도한 점멸
- 검정 화면과 밝은 화면이 번갈아 나오는 연출
- 화면 구석에만 중요한 피사체가 있는 구성

### `initiative_first.png`

용도:

- 우상단 선공 카드

권장 규격:

- 파일명: `initiative_first.png`
- 형식: `PNG` 권장, `WEBP` 가능
- 권장 해상도: `900 x 1400`
- 여유 해상도 권장: `1080 x 1680`
- 최소 허용 해상도: `720 x 1120`
- 비율: 세로형 `9:14` 전후
- 투명도: 불필요
- 권장 용량: `3MB` 이하

구성 가이드:

- 선공 카드용 전용 이미지
- 앱에서 `선공` 라벨을 따로 오버레이하므로 이미지 안에 별도 텍스트는 넣지 않는 편이 좋음
- 얼굴이나 핵심 오브젝트는 중앙보다 약간 위쪽에 두면 카드 비율에 잘 맞음
- 카드 자체가 짧고 세로로 길기 때문에 너무 넓은 구성보다 세로 중심 구성이 좋음

안전영역 권장:

- 상단 10%
- 하단 18%
- 좌우 10%

### `initiative_second.png`

용도:

- 우상단 후공 카드

권장 규격:

- 파일명: `initiative_second.png`
- 형식: `PNG` 권장, `WEBP` 가능
- 권장 해상도: `900 x 1400`
- 여유 해상도 권장: `1080 x 1680`
- 최소 허용 해상도: `720 x 1120`
- 비율: 세로형 `9:14` 전후
- 투명도: 불필요
- 권장 용량: `3MB` 이하

구성 가이드:

- 후공 카드용 전용 이미지
- 선공 카드와 같은 구도 시리즈여도 좋고, 완전히 다른 이미지여도 됨
- 선공/후공이 탭 전환될 때 확실히 다른 느낌이 나는 편이 직관적임
- 마찬가지로 이미지 안에 직접 텍스트는 넣지 않는 쪽 추천

안전영역 권장:

- 상단 10%
- 하단 18%
- 좌우 10%

## 4. 권장 추가 이미지

### `theme_thumb.png`

용도:

- 설정창 테마 선택 썸네일

권장 규격:

- 파일명: `theme_thumb.png`
- 형식: `PNG` 또는 `WEBP`
- 권장 해상도: `640 x 360`
- 여유 해상도 권장: `960 x 540`
- 최소 허용 해상도: `480 x 270`
- 비율: `16:9`
- 권장 용량: `500KB` 이하

구성 가이드:

- 배경 이미지를 간단히 크롭해서 써도 충분함
- 테마 전체 분위기를 짧게 보여주는 요약 컷이면 좋음

## 5. 테마별 비주얼 방향

### `cooking_oil`

핵심 톤:

- 크림
- 버터 옐로
- 살구
- 체리 레드
- 따뜻한 주방 조명

분위기 키워드:

- 따뜻함
- 조리 중 증기
- 홈 키친
- 버터/오일 반사광
- 부드러운 식탁 분위기

### `goddess_squad`

핵심 톤:

- 아이보리
- 애시 블랙
- 앤틱 골드
- 딥 레드

분위기 키워드:

- 전설
- 기념비
- 전장 후광
- 숭고함
- 오래된 성역 같은 무게감

### `infinity_rail`

핵심 톤:

- 네이비
- 스틸 그레이
- 시그널 레드
- 페탈 핑크 포인트

분위기 키워드:

- 객실
- 플랫폼
- 철도 조명
- 차가운 금속
- 이동 중인 여행 무드

### `arcana`

핵심 톤:

- 미드나이트 네이비
- 아메시스트
- 타로 골드
- 로즈 핑크

분위기 키워드:

- 타로
- 도서관
- 점성술
- 벨벳
- 신비롭고 정적인 밤

## 6. 품질 기준

모든 이미지 공통 권장:

- `sRGB` 색공간
- 너무 진한 압축 아티팩트 없는 파일
- 업스케일 티가 심한 인물 얼굴 지양
- 가장자리 깨짐 없는 선명한 결과물
- 앱 위에 글자와 카드가 올라오므로 명암이 적당히 정리된 이미지

권장 스타일:

- 이미지 자체에 텍스트 삽입하지 않기
- 로고 워터마크 넣지 않기
- 프레임 테두리 효과는 약하게
- 지나친 블룸, 렌즈플레어, 샤픈 과다 지양

## 7. 전달 방식

가장 좋은 전달 방식:

- 폴더 구조 유지한 `zip`
- 또는 테마별 폴더 4개를 그대로 전달

파일명 규칙:

- 반드시 현재 파일명 그대로
- 대소문자도 그대로 유지 권장
- 공백 대신 `_` 사용

## 8. 있으면 좋은 원본 자료

앱 반영에는 필수는 아니지만, 아래를 같이 주시면 후속 수정이 쉬워집니다.

- PSD
- CLIP
- Aseprite
- PNG 시퀀스 원본
- GIF 원본 mp4
- 테마별 대표 색상 3~5개 메모

## 9. 선택 확장 자산

지금 앱 구동에는 필요 없지만, 원하시면 다음도 받을 수 있습니다.

- 앱 아이콘용 정사각 이미지 `1024 x 1024`
- 스플래시용 세로 이미지 `1440 x 3200`
- 설정창 배경용 별도 이미지
- 테마별 로고 배지
- 선공/후공 카드의 테두리 없는 버전

## 10. 빠른 체크리스트

필수 체크:

- 각 테마 폴더가 있다
- `background_main.png`가 있다
- `hero_loop.gif`가 있다
- `initiative_first.png`가 있다
- `initiative_second.png`가 있다

권장 체크:

- `theme_thumb.png`가 있다
- 모든 파일이 `sRGB`다
- GIF가 매끄럽게 루프된다
- 이미지 안에 큰 텍스트가 없다
- 중요한 얼굴/오브젝트가 안전영역 안에 있다

## 11. 지금 바로 주시면 되는 최종 목록

필수 16개:

- `cooking_oil/background_main.png`
- `cooking_oil/hero_loop.gif`
- `cooking_oil/initiative_first.png`
- `cooking_oil/initiative_second.png`
- `goddess_squad/background_main.png`
- `goddess_squad/hero_loop.gif`
- `goddess_squad/initiative_first.png`
- `goddess_squad/initiative_second.png`
- `infinity_rail/background_main.png`
- `infinity_rail/hero_loop.gif`
- `infinity_rail/initiative_first.png`
- `infinity_rail/initiative_second.png`
- `arcana/background_main.png`
- `arcana/hero_loop.gif`
- `arcana/initiative_first.png`
- `arcana/initiative_second.png`

권장 추가 4개:

- `cooking_oil/theme_thumb.png`
- `goddess_squad/theme_thumb.png`
- `infinity_rail/theme_thumb.png`
- `arcana/theme_thumb.png`
