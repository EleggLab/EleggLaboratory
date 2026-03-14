# Agent Run Checklist

## Before Run
- [ ] 목표가 한 문장으로 정의됐는가
- [ ] 이번 턴 Done Definition이 있는가
- [ ] 수정 범위(In/Out)가 명확한가
- [ ] 위험 작업(권한/삭제/외부 전송) 사전 통제했는가

## During Run
- [ ] 작업 단위가 커밋 가능한 크기로 쪼개졌는가
- [ ] 실패 시 재현 절차를 남기고 있는가
- [ ] 로그/근거 없는 단정 응답을 피하고 있는가

## Before Report
- [ ] 변경 파일 목록
- [ ] 실행/검증 명령
- [ ] 남은 리스크와 다음 액션

## Release Gate (Agent)
- [ ] security-checklist 통과
- [ ] release-checklist 통과
- [ ] 롤백 방법 문서화
