class DailyRewardsData {
  DailyRewardsData({
    required this.lastResetDate,
    required List<bool> claimedFlags,
  }) : claimedFlags = List<bool>.generate(5, (index) {
          if (index < claimedFlags.length) {
            return claimedFlags[index];
          }
          return false;
        });

  final String lastResetDate;
  final List<bool> claimedFlags;

  int get claimedCount => claimedFlags.where((claimed) => claimed).length;

  bool canClaimStep(int stepIndex) {
    if (stepIndex < 0 || stepIndex >= claimedFlags.length) {
      return false;
    }
    if (claimedFlags[stepIndex]) {
      return false;
    }
    if (stepIndex == 0) {
      return true;
    }
    return claimedFlags[stepIndex - 1];
  }

  DailyRewardsData claimStep(int stepIndex) {
    if (!canClaimStep(stepIndex)) {
      return this;
    }
    final nextFlags = List<bool>.from(claimedFlags);
    nextFlags[stepIndex] = true;
    return DailyRewardsData(lastResetDate: lastResetDate, claimedFlags: nextFlags);
  }

  DailyRewardsData resetForDate(String dateKey) {
    return DailyRewardsData(lastResetDate: dateKey, claimedFlags: List<bool>.filled(5, false));
  }

  Map<String, dynamic> toJson() {
    return {
      'lastResetDate': lastResetDate,
      'claimedFlags': claimedFlags,
    };
  }

  factory DailyRewardsData.fromJson(Map<String, dynamic> json) {
    final flags = (json['claimedFlags'] as List<dynamic>? ?? const <dynamic>[])
        .map((value) => value == true)
        .toList();
    return DailyRewardsData(
      lastResetDate: (json['lastResetDate'] as String?) ?? '',
      claimedFlags: flags,
    );
  }

  factory DailyRewardsData.initial(String todayKey) {
    return DailyRewardsData(lastResetDate: todayKey, claimedFlags: List<bool>.filled(5, false));
  }
}


