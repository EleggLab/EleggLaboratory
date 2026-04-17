# Magic Toss QR 실기기 테스트 런북

## 준비물
- Toss 콘솔 접근 권한
- 최신 `magic-toss.ait`
- 실기기 Toss 앱(최신 버전)

## 절차
1. Toss 콘솔에서 최신 `magic-toss.ait` 업로드
2. QR 테스트 링크 생성
3. 실기기 Toss 앱으로 QR 진입
4. 아래 체크 수행

## 필수 체크
- [ ] 첫 화면 10초 내 진입
- [ ] 게임 네비게이션 영역과 UI 겹침 없음
- [ ] 전투 시작/종료 정상
- [ ] 백그라운드 전환 후 복귀 정상
- [ ] 소리 on/off 토글 정상
- [ ] 앱 재실행 시 저장 데이터 복원
- [ ] 무료/무서버 정책 위반 요소(광고/결제/서버 호출) 없음

## 실패 시 즉시 확인
- 콘솔 앱 카테고리가 게임인지
- `.env` 앱명/브랜드/CS 값 불일치 없는지
- 빌드 전 `pnpm validate:release-env && pnpm policy:check && pnpm build` 재실행
