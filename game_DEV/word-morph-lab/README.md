# Word Morph Lab

`Anomalous Coffee Machine`의 코어에서 "단어 입력으로 상태가 바뀌는 감각"만 추출해 만든 키워드 기반 프로토타입입니다.

- 플레이어는 단어를 입력합니다.
- 시스템은 100개 키워드 카탈로그에서 가장 가까운 안정 상태를 찾습니다.
- 상태가 맞으면 초상 이미지와 로그, 세부 정보가 바뀝니다.
- 초상 아래의 대사 프레임이 현재 이벤트에 맞춰 주체 음성과 연구 노트를 갱신합니다.
- 같은 카탈로그를 기준으로 100장 이미지를 생성하는 배치 스크립트가 함께 들어 있습니다.

## 포함 내용

- `data/word_catalog.json`
  10개 카테고리 x 10개 단어 = 100개 상태 카탈로그
- `app.js`, `index.html`, `styles.css`
  단어 입력형 플레이 UI, 대사 프레임, 도감형 세부 노트
- `docs/2026-03-30-overall-pass-01-30.md`
- `docs/2026-03-30-systems-content-pass-01-30.md`
- `docs/2026-03-30-ui-pass-01-30.md`
  strict sequential 30-pass handoff logs
- `scripts/generate_word_images.py`
  매니페스트 생성 + optional live batch
- `scripts/render_word_images.mjs`
  NovelAI 이미지 생성 러너
- `novelai.config.sample.json`
  샘플 렌더 설정

## 로컬 실행

```bash
cd game_DEV/word-morph-lab
python -m http.server 4173
```

브라우저에서 `http://localhost:4173`로 접속합니다.

## 배치 생성 순서

1. 샘플 설정을 복사해 `novelai.config.json`으로 만듭니다.
2. `NOVELAI_TOKEN` 같은 실제 인증 정보를 환경 변수로 주입합니다.
3. 먼저 매니페스트만 생성합니다.

```bash
cd game_DEV/word-morph-lab
python scripts/generate_word_images.py --config novelai.config.json
```

4. 설정 확인 후 live batch를 돌립니다.

```bash
node scripts/render_word_images.mjs --config novelai.config.json --skip-existing
```

## 현재 상태

- 100개 키워드 카탈로그와 플레이형 UI가 준비되어 있습니다.
- `assets/generated`에는 생성된 결과 이미지가 들어 있습니다.
- 입력, 힌트, 해금 기록, 대사 프레임, 아카이브 탐색 루프가 연결되어 있습니다.

## 메모

- NovelAI 이미지 엔드포인트는 `https://image.novelai.net/ai/generate-image`를 사용합니다.
- Python `urllib` 경로는 Cloudflare 차단 이슈가 있어 실제 live 요청은 Node `fetch` 기반으로 분리했습니다.
- 완전 자유 입력보다 카탈로그 기반 상태 머신 + 캐시 방식이 게임용으로 더 안정적입니다.
