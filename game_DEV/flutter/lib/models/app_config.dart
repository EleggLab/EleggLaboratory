class AppConfigAds {
  const AppConfigAds({
    required this.admobAppIdAndroid,
    required this.rewardedAdUnitIdAndroid,
  });

  final String admobAppIdAndroid;
  final String rewardedAdUnitIdAndroid;

  static const AppConfigAds defaults = AppConfigAds(
    admobAppIdAndroid: '',
    rewardedAdUnitIdAndroid: '',
  );

  bool get hasProductionRewardedUnit =>
      rewardedAdUnitIdAndroid.trim().isNotEmpty;

  factory AppConfigAds.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return defaults;
    }
    return AppConfigAds(
      admobAppIdAndroid: (json['admobAppIdAndroid'] as String?) ?? '',
      rewardedAdUnitIdAndroid:
          (json['rewardedAdUnitIdAndroid'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'admobAppIdAndroid': admobAppIdAndroid,
      'rewardedAdUnitIdAndroid': rewardedAdUnitIdAndroid,
    };
  }
}

class AppConfigData {
  const AppConfigData({
    required this.sentryDsn,
    required this.privacyPolicyUrl,
    required this.supportEmail,
    required this.ads,
  });

  final String sentryDsn;
  final String privacyPolicyUrl;
  final String supportEmail;
  final AppConfigAds ads;

  static const AppConfigData defaults = AppConfigData(
    sentryDsn: '',
    privacyPolicyUrl: '',
    supportEmail: 'support@example.com',
    ads: AppConfigAds.defaults,
  );

  factory AppConfigData.fromJson(Map<String, dynamic> json) {
    return AppConfigData(
      sentryDsn: (json['sentryDsn'] as String?) ?? '',
      privacyPolicyUrl: (json['privacyPolicyUrl'] as String?) ?? '',
      supportEmail: (json['supportEmail'] as String?) ?? 'support@example.com',
      ads: AppConfigAds.fromJson(
        json['ads'] is Map<String, dynamic>
            ? json['ads'] as Map<String, dynamic>
            : json['ads'] is Map
            ? Map<String, dynamic>.from(json['ads'] as Map)
            : null,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'sentryDsn': sentryDsn,
      'privacyPolicyUrl': privacyPolicyUrl,
      'supportEmail': supportEmail,
      'ads': ads.toJson(),
    };
  }
}
