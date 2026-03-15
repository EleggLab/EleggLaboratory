import 'package:flutter/material.dart';

abstract class IAdService {
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  });
}

class FakeAdService implements IAdService {
  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('광고 보상'),
          content: Text('광고를 보고 보상을 받겠습니까?\n\n보상: $rewardText'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('아니오'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('예'),
            ),
          ],
        );
      },
    );
    return accepted == true;
  }
}

class RealAdService implements IAdService {
  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    // TODO: Integrate google_mobile_ads RewardedAd flow.
    // Return true only when reward callback succeeds.
    return false;
  }
}


