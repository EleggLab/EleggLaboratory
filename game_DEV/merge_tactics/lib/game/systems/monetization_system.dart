import 'dart:async';

import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

enum RewardType { revive, doubleGold }

class InAppProduct {
  const InAppProduct({
    required this.id,
    required this.name,
    required this.price,
    this.gems = 0,
    this.gold = 0,
    this.specialCard,
    this.duration,
    this.dailyGems = 0,
    this.exclusiveCard,
  });

  final String id;
  final String name;
  final double price;
  final int gems;
  final int gold;
  final String? specialCard;
  final int? duration;
  final int dailyGems;
  final String? exclusiveCard;
}

class MonetizationSystem {
  MonetizationSystem({
    this.rewardedAdUnitId = 'ca-app-pub-XXXXXXXX/YYYYYYYY',
    InAppPurchase? inAppPurchase,
  }) : _inAppPurchase = inAppPurchase ?? InAppPurchase.instance;

  final String rewardedAdUnitId;
  final InAppPurchase _inAppPurchase;

  final List<InAppProduct> products = const <InAppProduct>[
    InAppProduct(id: 'gems_80', name: '보석 80개', price: 1.09, gems: 80),
    InAppProduct(id: 'gems_500', name: '보석 500개', price: 5.49, gems: 500),
    InAppProduct(id: 'gems_1200', name: '보석 1200개', price: 10.99, gems: 1200),
    InAppProduct(
      id: 'starter_pack',
      name: '스타터 팩',
      price: 2.19,
      gems: 300,
      gold: 5000,
      specialCard: 'warrior_3',
    ),
    InAppProduct(
      id: 'battle_pass',
      name: '배틀 패스',
      price: 5.49,
      duration: 30,
      dailyGems: 50,
      exclusiveCard: 'legend_knight',
    ),
  ];

  final Map<RewardType, int> _dailyLimit = const <RewardType, int>{
    RewardType.revive: 1,
    RewardType.doubleGold: 3,
  };
  final Map<RewardType, int> _dailyUsage = <RewardType, int>{
    RewardType.revive: 0,
    RewardType.doubleGold: 0,
  };
  DateTime _lastResetDate = DateTime.now();

  Stream<List<PurchaseDetails>> get purchaseStream {
    return _inAppPurchase.purchaseStream;
  }

  Future<InitializationStatus> initializeAds() async {
    return MobileAds.instance.initialize();
  }

  int remainingRewardUses(RewardType type) {
    _resetDailyCounterIfNeeded();
    final int limit = _dailyLimit[type] ?? 0;
    final int used = _dailyUsage[type] ?? 0;
    return (limit - used).clamp(0, limit);
  }

  bool canUseRewardAd(RewardType type) {
    return remainingRewardUses(type) > 0;
  }

  Future<bool> showRewardedAd({
    required RewardType type,
    required FutureOr<void> Function(RewardType type, int amount) onRewarded,
  }) async {
    _resetDailyCounterIfNeeded();
    if (!canUseRewardAd(type)) {
      return false;
    }

    final Completer<bool> completer = Completer<bool>();
    RewardedAd.load(
      adUnitId: rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (RewardedAd ad) {
          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (RewardedAd ad) {
              ad.dispose();
              if (!completer.isCompleted) {
                completer.complete(false);
              }
            },
            onAdFailedToShowFullScreenContent: (RewardedAd ad, AdError error) {
              ad.dispose();
              if (!completer.isCompleted) {
                completer.complete(false);
              }
            },
          );
          ad.show(
            onUserEarnedReward:
                (AdWithoutView adWithoutView, RewardItem reward) async {
                  _dailyUsage[type] = (_dailyUsage[type] ?? 0) + 1;
                  await onRewarded(type, reward.amount.toInt());
                  if (!completer.isCompleted) {
                    completer.complete(true);
                  }
                },
          );
        },
        onAdFailedToLoad: (LoadAdError error) {
          if (!completer.isCompleted) {
            completer.complete(false);
          }
        },
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 30),
      onTimeout: () => false,
    );
  }

  Future<List<ProductDetails>> queryProducts() async {
    final bool available = await _inAppPurchase.isAvailable();
    if (!available) {
      return const <ProductDetails>[];
    }

    final Set<String> ids = products
        .map((InAppProduct product) => product.id)
        .toSet();
    final ProductDetailsResponse response = await _inAppPurchase
        .queryProductDetails(ids);
    return response.productDetails;
  }

  Future<bool> buyProduct(ProductDetails productDetails) async {
    final PurchaseParam purchaseParam = PurchaseParam(
      productDetails: productDetails,
    );
    return _inAppPurchase.buyConsumable(purchaseParam: purchaseParam);
  }

  void _resetDailyCounterIfNeeded() {
    final DateTime now = DateTime.now();
    final bool sameDay =
        now.year == _lastResetDate.year &&
        now.month == _lastResetDate.month &&
        now.day == _lastResetDate.day;
    if (sameDay) {
      return;
    }

    _lastResetDate = now;
    _dailyUsage.updateAll((RewardType key, int value) => 0);
  }
}
