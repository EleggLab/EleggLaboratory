# 광고 슬롯 시트

현재 기본 방침은 `무료 앱 + 배너 광고 없음` 입니다. 다만 추후 토스 광고를 켜고 싶을 때를 대비해 슬롯 설계는 유지합니다.

## 현재 기본값
- `TOSS_ENABLE_BANNER_ADS=false`
- `TOSS_ENABLE_FULLSCREEN_ADS=false`

## 준비된 배너 슬롯
| 슬롯 | Env 키 | 테스트 ID 타입 | 권장 위치 | 현재 상태 |
| --- | --- | --- | --- | --- |
| `home_banner_list` | `TOSS_AD_HOME_BANNER_ID` | `ait-ad-test-banner-id` | 홈 하단 고정 배너 | 비활성 |
| `today_banner_inline` | `TOSS_AD_TODAY_BANNER_ID` | `ait-ad-test-native-image-id` | 오늘 운세 첫 상세 블록 아래 | 비활성 |
| `tarot_result_banner_list` | `TOSS_AD_TAROT_RESULT_BANNER_ID` | `ait-ad-test-banner-id` | 타로 결과 카드 아래 | 비활성 |

## 금지 위치
- 앱 첫 진입 직후
- 사주 입력 폼 내부
- 계산 버튼 직전 또는 직후
- 핵심 해석 문단 중간
- 로딩, 에러, 권한, 시스템 모달 내부

## 운영 메모
- 광고를 실제로 켤 때만 운영 광고 그룹 ID를 넣습니다.
- 새 광고 그룹 ID는 콘솔 생성 후 최대 2시간까지 반영 지연이 있을 수 있습니다.
- 샌드박스에서는 광고가 동작하지 않으므로 최종 광고 QA는 콘솔 QR 또는 토스 앱에서 진행해야 합니다.
