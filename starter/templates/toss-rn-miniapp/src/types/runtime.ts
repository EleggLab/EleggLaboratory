export type TossFeatureFlags = {
  analytics: boolean;
  bannerAds: boolean;
  fullscreenAds: boolean;
  iap: boolean;
  login: boolean;
  marketing: boolean;
  share: boolean;
};

export type TossRouteMeta = {
  screen: string;
  subtitle?: string;
  title: string;
};

export type TossRuntimeEnv = {
  ads: {
    homeBannerId: string;
    homeFeedId: string;
    supportBannerId: string;
  };
  appName: string;
  brandDisplayName: string;
  brandIconUrl: string;
  brandPrimaryColor: string;
  consoleAppName: string;
  customerService: {
    chatUrl: string;
    email: string;
    phone: string;
  };
  features: TossFeatureFlags;
  operationalEnvironment: 'sandbox' | 'toss' | 'unknown';
};
