import 'package:flutter/foundation.dart';

class PlayerProfile extends ChangeNotifier {
  int gold = 50;
  int gems = 200;

  int accountLevel = 1;
  int accountExp = 0;
  bool pvpUnlocked = false;

  int battlePassExp = 0;
  bool premiumBattlePass = false;
  final Set<int> claimedFreeRewards = <int>{};
  final Set<int> claimedPremiumRewards = <int>{};

  final Set<String> unlockedUnitIds = <String>{
    'human_swordsman_t1',
    'elf_archer_t1',
    'orc_warrior_t1',
  };

  final List<String> friends = <String>['Ari', 'Bram', 'Doro'];

  int get battlePassLevel => 1 + (battlePassExp ~/ 100);
  int get battlePassProgressWithinLevel => battlePassExp % 100;

  bool spendGold(int amount) {
    if (gold < amount) {
      return false;
    }
    gold -= amount;
    notifyListeners();
    return true;
  }

  bool spendGems(int amount) {
    if (gems < amount) {
      return false;
    }
    gems -= amount;
    notifyListeners();
    return true;
  }

  void addGold(int amount, {bool notify = true}) {
    gold += amount;
    if (notify) {
      notifyListeners();
    }
  }

  void addGems(int amount, {bool notify = true}) {
    gems += amount;
    if (notify) {
      notifyListeners();
    }
  }

  bool unlockUnit(String unitId) {
    final bool didAdd = unlockedUnitIds.add(unitId);
    if (didAdd) {
      notifyListeners();
    }
    return didAdd;
  }

  void grantAccountExp(int amount) {
    accountExp += amount;
    bool leveled = false;

    while (accountExp >= expToNextLevel) {
      accountExp -= expToNextLevel;
      accountLevel += 1;
      addGold(40 + (accountLevel * 4), notify: false);
      addGems(8 + (accountLevel ~/ 2), notify: false);
      leveled = true;
    }

    if (accountLevel >= 3 && !pvpUnlocked) {
      pvpUnlocked = true;
      leveled = true;
    }

    if (leveled || amount > 0) {
      notifyListeners();
    }
  }

  int get expToNextLevel => 100 + ((accountLevel - 1) * 25);

  void grantBattlePassExp(int amount) {
    battlePassExp += amount;
    notifyListeners();
  }

  bool canClaimFreeReward(int tier) {
    return battlePassLevel >= tier && !claimedFreeRewards.contains(tier);
  }

  bool canClaimPremiumReward(int tier) {
    return premiumBattlePass &&
        battlePassLevel >= tier &&
        !claimedPremiumRewards.contains(tier);
  }

  bool claimFreeReward(int tier) {
    if (!canClaimFreeReward(tier)) {
      return false;
    }
    claimedFreeRewards.add(tier);
    addGold(15 + (tier * 3), notify: false);
    notifyListeners();
    return true;
  }

  bool claimPremiumReward(int tier) {
    if (!canClaimPremiumReward(tier)) {
      return false;
    }
    claimedPremiumRewards.add(tier);
    addGems(8 + tier, notify: false);
    notifyListeners();
    return true;
  }

  void addFriend(String name) {
    if (name.trim().isEmpty) {
      return;
    }
    friends.add(name.trim());
    notifyListeners();
  }

  void removeFriend(String name) {
    friends.remove(name);
    notifyListeners();
  }
}
