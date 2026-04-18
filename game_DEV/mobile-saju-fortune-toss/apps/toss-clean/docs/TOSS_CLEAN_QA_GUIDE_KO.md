# Toss Clean QA Guide

## 핵심 원칙

- 안드로이드에서 앱 선택창이 뜨면 `MiniApp`이 아니라 `토스`를 선택합니다.
- 로컬 dev 테스트 전에는 `adb reverse tcp:8081 tcp:8081` 과 `adb reverse tcp:5173 tcp:5173` 를 먼저 맞춥니다.
- 에뮬레이터 샌드박스는 비교 기준이 흔들릴 수 있으므로, 최종 판정은 가능하면 실기기 `토스 본앱`에서 확인합니다.
- private deployment 테스트 전에 로컬 dev 서버가 켜져 있으면 에뮬레이터 샌드박스가 dev 서버로 잘못 붙어 오버레이가 뜰 수 있습니다.

## 로컬 dev 테스트 순서

1. `corepack pnpm --filter @saju/toss-clean dev`
2. 기기 연결 확인
3. `powershell -ExecutionPolicy Bypass -File .\\scripts\\qa-local-android.ps1`
4. 기기에서 열릴 때 `토스`를 선택

## 업로드 테스트 순서

1. 로컬 dev 서버를 종료합니다.
2. 최신 `.ait`를 `upload-ready` 폴더에서 선택합니다.
3. 콘솔에서 새 버전을 등록합니다.
4. 생성된 `intoss-private://...` 링크를 `토스`로 엽니다.

## 참고 메모

- 토스 공식 문서상 로컬 실기기 테스트는 `adb reverse` 구성이 중요합니다.
- 토스 공식 문서상 탭바는 플로팅 형태를 따라야 합니다.
- 실제 작업 중에는 `MiniApp` 경로보다 `토스 본앱` 경로가 더 안정적으로 동작했습니다.
