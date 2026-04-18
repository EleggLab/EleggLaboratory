/**
 * 토스 인앱 광고 설정
 * @see https://developers-apps-in-toss.toss.im/ads/develop.html
 *
 * 개발 중에는 반드시 테스트 ID를 사용해야 합니다.
 * 운영 ID로 테스트하면 정책 위반으로 광고 노출이 제한됩니다.
 */

/** true이면 테스트 ID 사용, 출시 시 false로 전환 */
const USE_TEST_IDS = true;

const TEST_IDS = {
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
  bannerList: 'ait-ad-test-banner-id',
  bannerFeed: 'ait-ad-test-native-image-id',
} as const;

/**
 * 운영 광고 그룹 ID — 콘솔에서 발급받은 뒤 채워넣으세요.
 * @see https://developers-apps-in-toss.toss.im/ads/console.html
 */
const PROD_IDS = {
  interstitial: '',
  rewarded: '',
  bannerList: '',
  bannerFeed: '',
} as const;

function resolve(key: keyof typeof TEST_IDS): string {
  if (USE_TEST_IDS) return TEST_IDS[key];
  const id = PROD_IDS[key];
  if (!id) {
    console.warn(`[ads] 운영 광고 ID가 설정되지 않았습니다: ${key}, 테스트 ID로 대체합니다.`);
    return TEST_IDS[key];
  }
  return id;
}

export const AD_IDS = {
  get interstitial() { return resolve('interstitial'); },
  get rewarded() { return resolve('rewarded'); },
  get bannerList() { return resolve('bannerList'); },
  get bannerFeed() { return resolve('bannerFeed'); },
} as const;
