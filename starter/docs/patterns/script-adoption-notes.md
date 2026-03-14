# Script Adoption Notes

## 채택 원칙
- 실행 실패 시 원인 파악이 쉬운 단순 스크립트 우선
- 입력 인자 기본값 제공
- stdout 기준 결과 확인 가능

## 반영 패턴
- init/bootstrap: 초기 구조 생성
- verify/report: 검증+증적 생성
- refresh/triage: 리서치 파이프라인 자동화

## 다음 강화 포인트
- dry-run 모드
- 실패 시 재시도 전략
- 로그 레벨 옵션
