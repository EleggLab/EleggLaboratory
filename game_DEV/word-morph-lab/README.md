# Word Morph Lab

`Anomalous Coffee Machine`식 코어를 더 단순화한 프로토타입입니다.

- 플레이어는 단어를 입력합니다.
- 앱은 100개 키워드 카탈로그에서 가장 가까운 상태를 찾습니다.
- 선택된 상태에 맞춰 프롬프트, 시드, 출력 경로, 이미지 여부가 바뀝니다.
- 실제 100장 생성은 같은 카탈로그를 읽는 Python 배치 스크립트로 이어집니다.

## 포함 내용

- `data/word_catalog.json`
  10개 카테고리 x 10개 단어 = 100개 상태
- `app.js`, `index.html`, `styles.css`
  단어 입력형 미리보기 UI
- `scripts/generate_word_images.py`
  매니페스트 생성 + optional live batch
- `novelai.config.sample.json`
  샘플 렌더 설정

## 로컬 미리보기

프로젝트 루트:

```bash
cd game_DEV/word-morph-lab
python -m http.server 4173
```

브라우저에서 `http://localhost:4173` 접속.

## 배치 생성 순서

1. 샘플 설정을 복사해 `novelai.config.json`으로 만듭니다.
2. `NOVELAI_TOKEN` 같은 실제 환경변수를 세션에 노출합니다.
3. 먼저 매니페스트만 생성합니다.

```bash
cd game_DEV/word-morph-lab
python scripts/generate_word_images.py --config novelai.config.json
```

4. 문제가 없으면 live batch를 돌립니다.

```bash
node scripts/render_word_images.mjs --config novelai.config.json --skip-existing
```

## 지금 상태

- 카탈로그, UI, 매니페스트 경로는 준비됨
- 실제 이미지 100장은 아직 생성 전
- 현재 세션에서는 NovelAI 토큰이 감지되지 않아 live batch는 보류됨

## 메모

- 공식 서버 응답 기준으로 이미지 엔드포인트는 `https://image.novelai.net/ai/generate-image`입니다.
- Python `urllib`는 Cloudflare에 막힐 수 있어 실제 live 요청은 Node `fetch` 기반으로 분리했습니다.
- 사용자가 제공한 래퍼나 프록시가 다르면 `render_word_images.mjs`의 payload와 응답 처리만 맞추면 됩니다.
- 처음부터 완전 자유 입력으로 가기보다, 이 100개 카탈로그를 캐시 가능한 상태군으로 쓰는 편이 훨씬 안정적입니다.
