# Nibel Arena Counter

안드로이드 APK 출력을 목표로 만든 독립 Flutter 프로젝트입니다.

## 포함된 기능

- 1화면 포트레이트 레이아웃
- 선공 / 후공 이미지 토글
- 최대 애너지 계산
- 사용 애너지 오버플로 경고
- 테마 4종 전환
- 현재 테마 유지 초기화

## 테마 자산

필수 자산 규칙은 [assets/ASSET_GUIDE.md](assets/ASSET_GUIDE.md)에 정리되어 있습니다.

현재 `assets/themes/*` 아래에는 플레이스홀더 이미지가 들어 있습니다.
같은 파일명으로 교체하면 코드 수정 없이 바로 사용할 수 있습니다.

## 로컬 빌드

이 워크스페이스 기준 SDK 경로:

- Flutter: `C:\Users\rndhr\flutter`
- Android SDK: `C:\Users\rndhr\AppData\Local\Android\sdk`
- Java: `C:\Program Files\Android\Android Studio\jbr`

예시 명령:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
& 'C:\Users\rndhr\flutter\bin\flutter.bat' pub get
& 'C:\Users\rndhr\flutter\bin\flutter.bat' test
& 'C:\Users\rndhr\flutter\bin\flutter.bat' build apk --debug
```
