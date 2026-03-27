# 토스 규격 감사 메모

## 현재 충족된 항목

- Granite/App-in-Toss 기반 RN 구조 분리 완료
- `scheme: 'intoss'` 적용
- `@apps-in-toss/framework` 2.0.5, `@toss/tds-react-native` 2.0.2 고정
- `/`, `/saju`, `/today`, `/iching`, `/tarot`, `/tarot/reading`, `/tarot/result` 라우트 구성 완료
- 원본 모바일 자산 84개, 총 41,608,173 bytes 가 토스 이식본과 일치
- `apps/mobile/lib` 대비 `apps/toss/src/legacy/lib` 누락 파일 없음
- 같은 탭 재선택 초기화, 방문 토큰 기반 리셋, 뒤로가기 fallback 동작 복원 완료
- `pnpm --filter @saju/mobile typecheck` 통과
- `pnpm --filter @saju/web typecheck` 통과
- `pnpm --filter @saju/toss typecheck` 통과
- `pnpm --filter @saju/toss build` 통과
- `.ait` 생성 확인 완료
- 콘솔 준비 문서, 자산 매니페스트, QA 스크립트, 패리티 감사 스크립트 추가 완료

## 이번 라운드 보강 항목

- `assets/console/asset-manifest.json` 추가
- 콘솔 업로드용 준비 자산 생성 스크립트 추가
- 앱 등록, 기능 등록, 광고 슬롯, 정산 운영, UX 패리티 문서 추가
- `validate-release-env` 에 콘솔 앱명, 고객지원 정보, 콘솔 자산 규격 검증 추가
- `audit:parity`, `qa:sandbox`, `qa:toss` 스크립트 추가

## 남은 외부 작업

- `TOSS_APP_NAME` 을 실제 토스 콘솔 앱명으로 확정
- `TOSS_CONSOLE_APP_NAME` 을 같은 값으로 입력
- `TOSS_BRAND_ICON_URL` 을 실제 콘솔 아이콘 URL로 교체
- 고객지원 이메일, 전화번호, 채팅 URL 실값 입력
- 토스 콘솔 QR 기반 실기기 QA
- 광고를 다시 켤 때만 운영 광고 ID와 정산 정보 입력

## 차이 해석

- 원본과 토스 화면 파일은 완전 동일하지 않습니다.
- 차이 대부분은 TDS 버튼과 입력, Granite 라우팅, 토스용 상하단 셸에서 발생합니다.
- 계산 로직, 리소스, 핵심 운세 흐름은 원본 기준을 유지하도록 맞췄습니다.

## 리스크 메모

- 비게임 v1 기준으로는 기능 소개를 3개 안쪽으로 묶는 쪽이 검수 친화적입니다.
- 현재 콘솔 자산은 준비용 초안이므로 출시 전 최종 비주얼 교체를 권장합니다.

## 추가 개발 우선순위

1. 사주, 타로, 주역, 오늘 운세 결과 히스토리
2. 결과 카드 공유 이미지 내보내기
3. 첫 진입 온보딩과 기능 소개 페이지
4. 광고 on/off 및 위치 실험용 remote config
5. 운영 analytics 대시보드
