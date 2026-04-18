# Shared Resources

워크스페이스에서 여러 프로젝트가 함께 쓰는 자원은 아래 허브에 모은다.

## Shared Assets

- `shared-assets/characters/`: 캐릭터 원본, 캐릭터별 공용 아트 자산
- `shared-assets/project-docs/`: 특정 프로젝트에 종속되지만 코드 루트 밖에서 보관할 문서
- `shared-assets/nibel/`: 니벨 공용 참고 자료
- `shared-assets/risu/`: Risu 계열 공용 소스/가공본/읽기본

## Shared Code And Config

- `packages/`: 프로젝트 간 재사용 가능한 코드 패키지
- `data/workspace/`: 워크스페이스 메타데이터와 카탈로그
- `scripts/`: 정리, 점검, 변환, 자동화 스크립트

## Research And Reference

- `research/reference-library/`: 장르 참고자료, 바이브 코딩 자료, 외부 레퍼런스 묶음
- `research/nibel/`: 니벨 규칙 추출/규정 문서
- `research/openclaw/`: OpenClaw 관련 조사 문서

## Operating Rule

- 공용으로 다시 쓸 가능성이 있으면 먼저 `shared-assets/`, `packages/`, `research/` 중 어디가 맞는지 판단한다.
- 특정 앱 실행에 직접 필요한 코드가 아니면 프로젝트 루트보다 공용 허브를 우선 고려한다.
- 실험성 자료를 루트에 새로 만들지 말고, 해당 허브 안에서 하위 폴더를 추가하는 방식으로 확장한다.
