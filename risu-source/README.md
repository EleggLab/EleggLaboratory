# Risu Workspace

- `original/`: 현재 사용하는 원본 `.risum`, `.risup`, `type=risu` JSON 보관 위치
- `archive/`: 구버전, 임시 드롭, 오래된 묶음 보관 위치
- `../risu-readable/`: 사람이 읽고 스크립트가 쓰기 쉬운 디코드 결과
- `../risu-prepared/`: 프롬프트 추출/준비용 중간 산출물

운영 원칙:
- 새 원본을 루트에 떨어뜨려도 `node pojet/scripts/ai/organizeRisuWorkspace.js`로 다시 정리
- 내러티브 가이드/스캔/임포트는 `risu-readable`를 우선 사용하고, 없으면 `original/`을 fallback으로 사용
- 아카이브 버전 목록은 `node pojet/scripts/ai/indexRisuArchive.js`로 다시 생성
