# Security Checklist (Starter)

## Secrets
- [ ] API 키/토큰이 코드에 하드코딩되지 않았는가
- [ ] `.env`/비밀 파일이 `.gitignore`에 포함됐는가
- [ ] 샘플 파일은 `.env.example`만 제공하는가

## Input/Output Validation
- [ ] 사용자 입력 검증/정규화가 있는가
- [ ] 파일 업로드/다운로드 경로 검증이 있는가
- [ ] 에러 메시지가 민감 정보를 노출하지 않는가

## Dependency & Supply Chain
- [ ] 의존성 취약점 점검을 수행했는가
- [ ] 사용 라이선스를 확인했는가
- [ ] 서드파티 스크립트 출처를 검증했는가

## Auth & Access
- [ ] 최소 권한 원칙 적용
- [ ] 관리자 기능 접근 제어 확인
- [ ] 세션/토큰 만료 정책 확인

## Logging & Monitoring
- [ ] 민감정보 마스킹 로깅
- [ ] 핵심 실패 이벤트 모니터링
- [ ] 이상 징후 알림 정책 확인

## Release Gate
- [ ] 보안 체크리스트 미충족 시 릴리즈 보류
