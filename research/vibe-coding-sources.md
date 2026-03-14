# Vibe Coding 자료/소스 수집

업데이트: 2026-03-14

## 1) 바로 써먹는 실전 소스코드 (로컬에 수집 완료)
- `research/src/openclaw`
  - 개인 AI 에이전트 프레임워크 구조/툴링/런타임 참고용
  - 원본: <https://github.com/openclaw/openclaw>

- `research/src/mcp-servers`
  - MCP 서버 구현 예제 모음 (파일시스템, Git, DB 등)
  - 원본: <https://github.com/modelcontextprotocol/servers>

- `research/src/awesome-mcp-servers`
  - MCP 생태계 도구 인덱스(레퍼런스 카탈로그)
  - 원본: <https://github.com/punkpeye/awesome-mcp-servers>

- `research/src/genai-for-beginners`
  - 생성형 AI 앱 패턴/샘플(튜토리얼형)
  - 원본: <https://github.com/microsoft/generative-ai-for-beginners>

- `research/src/spec-kit`
  - 스펙 주도 개발 템플릿(요구사항→구현 흐름)
  - 원본: <https://github.com/github/spec-kit>

## 2) 바이브 코딩할 때 특히 유용한 참고 링크
- 프롬프트/워크플로우 큐레이션: <https://github.com/f/prompts.chat>
- LLM 학습 로드맵/실습: <https://github.com/mlabonne/llm-course>
- 만들면서 배우는 구현 아이디어: <https://github.com/codecrafters-io/build-your-own-x>

## 3) 추천 사용 순서 (빠른 스타트)
1. `spec-kit`으로 기능 스펙 1페이지 작성
2. `mcp-servers`에서 필요한 툴 서버 구조 복붙/변형
3. `openclaw` 구조 참고해 에이전트 루프/툴 호출 패턴 정리
4. `genai-for-beginners`에서 UI/프롬프트 패턴 가져와 붙이기

## 4) 다음 액션 제안
- 원하면 다음 턴에 내가 바로:
  - 이 소스들 기반으로 **"바이브 코딩 스타터 템플릿"** 폴더를 만들고
  - `README`, 기본 에이전트 루프, 예시 프롬프트, 실행 스크립트까지 세팅해둘게.
