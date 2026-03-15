import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/release/release_guard.dart';

void main() {
  test('release preflight fails when test ad ids are present', () {
    final result = runReleasePreflight(
      const ReleasePreflightInput(
        version: '1.2.3+45',
        privacyPolicyUrl: 'https://example.com/privacy',
        supportEmail: 'support@example.com',
        admobAppId: admobTestAppIdAndroid,
        rewardedAdUnitId: admobTestRewardedAdUnitAndroid,
        allowTestAdsOverride: false,
        compileSdk: 35,
        targetSdk: 35,
      ),
    );

    expect(result.hasFatal, isTrue);
    expect(
      result.fatalIssues.any((issue) => issue.code == 'TEST_AD_ID_IN_RELEASE'),
      isTrue,
    );
  });

  test('release preflight allows test ad ids with override', () {
    final result = runReleasePreflight(
      const ReleasePreflightInput(
        version: '1.2.3+45',
        privacyPolicyUrl: 'https://example.com/privacy',
        supportEmail: 'support@example.com',
        admobAppId: admobTestAppIdAndroid,
        rewardedAdUnitId: admobTestRewardedAdUnitAndroid,
        allowTestAdsOverride: true,
        compileSdk: 35,
        targetSdk: 35,
      ),
    );

    expect(
      result.fatalIssues.any((issue) => issue.code == 'TEST_AD_ID_IN_RELEASE'),
      isFalse,
    );
  });
}
