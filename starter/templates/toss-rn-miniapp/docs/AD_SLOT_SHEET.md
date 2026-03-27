# Ad Slot Sheet

## Banner Slots
| Slot | Env Key | Test ID Type | Recommended Placement |
| --- | --- | --- | --- |
| `home_banner_list` | `TOSS_AD_HOME_BANNER_ID` | `ait-ad-test-banner-id` | Home footer fixed banner |
| `home_feed_native` | `TOSS_AD_HOME_FEED_ID` | `ait-ad-test-native-image-id` | Home scroll content inline feed banner |
| `support_banner_list` | `TOSS_AD_SUPPORT_BANNER_ID` | `ait-ad-test-banner-id` | Support page footer banner |

## Fullscreen Slots
| Slot | Status | Notes |
| --- | --- | --- |
| `interstitial` | Disabled by default | Keep `TOSS_ENABLE_FULLSCREEN_ADS=false` in the shared starter |
| `rewarded` | Disabled by default | Implement later with reward and abuse-prevention policies |

## Console Notes
- Use only test IDs during development.
- Expect new production ad group IDs to take up to 2 hours to propagate.
- Sandbox does not support in-app ads. Use QR/Toss-app testing for final ad QA.
