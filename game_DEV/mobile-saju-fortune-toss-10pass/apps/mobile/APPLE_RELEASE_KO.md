# 애플 업로드 가이드

## 대상

- 애플 업로드 대상은 `apps/toss` 가 아니라 `apps/mobile` 입니다.
- `apps/mobile` 은 Expo 기반 iOS/Android 앱이고, App Store 배포는 EAS Build/EAS Submit 기준으로 진행합니다.

## 현재 반영된 준비

- `expo.ios.bundleIdentifier`: `com.rndhr.sajucompanion`
- `expo.ios.buildNumber`: `1`
- `expo.ios.config.usesNonExemptEncryption`: `false`
- `apps/mobile/eas.json` 에 `production` iOS 빌드 프로필 추가
- `apps/mobile/package.json` 에 App Store 검증/빌드/제출 스크립트 추가
- 앱은 광고 / 인앱결제 없이 무료 앱으로 제출하는 방향

## 실행 명령

앱 디렉터리 기준:

```bash
pnpm run validate:app-store
pnpm run build:ios:store
pnpm run submit:ios:store
```

루트 기준:

```bash
pnpm build:ios
pnpm submit:ios
```

## 필수 전제

- Apple Developer 계정
- Expo 계정 로그인
- EAS CLI 설치
- App Store Connect 앱 생성
- 실제 `ascAppId` 입력 시 자동 제출 가능

## 무료 앱 기준 운영 방침

- 가격: 무료
- 광고: 없음
- 인앱결제: 없음
- 외부 결제 유도: 없음
- 로그인 강제: 없음
- 핵심 기능: 사주 / 타로 / 주역 / 오늘 운세

## 이 환경의 현재 한계

- 현재 머신은 Windows 환경이라 로컬 Xcode 아카이브 빌드는 불가합니다.
- Expo 공식 문서 기준, iOS 프로덕션 빌드는 EAS 클라우드 빌드로 진행할 수 있습니다.
- 지금 이 환경은 `expo` / `eas` CLI 가 설치되어 있지 않고, registry 접근 문제로 `pnpm install` 도 막혀 있어 실제 `.ipa` 생성까지는 완료하지 못했습니다.
- `pnpm run build:ios:store` 는 이제 EAS CLI가 없을 때 바로 이유와 다음 조치를 출력합니다.

## 제출 전 꼭 확인할 것

- `expo.extra.eas.projectId` 연결 여부
- `eas.json` 의 `submit.production.ios.ascAppId` 입력 여부
- App Store 스크린샷 / 설명 / 개인정보처리방침 URL / 지원 URL
- 실기기에서 폰트/이미지/운세 계산 흐름 최종 QA

## 같이 준비된 문서 / 페이지

- App Store 메타 초안: `apps/mobile/APP_STORE_METADATA_FREE_KO.md`
- 심사용 노트 초안: `apps/mobile/APP_REVIEW_NOTES_FREE_KO.md`
- 웹 정책 페이지 초안:
  - `apps/web/app/privacy/page.tsx`
  - `apps/web/app/support/page.tsx`
