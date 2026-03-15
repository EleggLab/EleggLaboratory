bool parseDebugBool(String raw) {
  final normalized = raw.trim().toLowerCase();
  return normalized == '1' ||
      normalized == 'true' ||
      normalized == 'yes' ||
      normalized == 'on';
}

class DebugFlags {
  static final bool selfTest = parseDebugBool(
    const String.fromEnvironment('SELFTEST', defaultValue: '0'),
  );

  static final bool ballDebug = parseDebugBool(
    const String.fromEnvironment('BALL_DEBUG', defaultValue: '0'),
  );

  static final bool layoutDebug = parseDebugBool(
    const String.fromEnvironment('LAYOUT_DEBUG', defaultValue: '0'),
  );

  static final bool shopSelfTest = parseDebugBool(
    const String.fromEnvironment('SHOP_SELFTEST', defaultValue: '0'),
  );

  static final bool shopUiSelfTest = parseDebugBool(
    const String.fromEnvironment('SHOP_UI_SELFTEST', defaultValue: '0'),
  );

  static final bool aimSelfTest = parseDebugBool(
    const String.fromEnvironment('AIM_SELFTEST', defaultValue: '0'),
  );

  static final bool boardFitSelfTest = parseDebugBool(
    const String.fromEnvironment('BOARD_FIT_SELFTEST', defaultValue: '0'),
  );

  static final bool aimVisibilitySelfTest = parseDebugBool(
    const String.fromEnvironment('AIM_VISIBILITY_SELFTEST', defaultValue: '0'),
  );

  static final bool perfDebug = parseDebugBool(
    const String.fromEnvironment('PERF_DEBUG', defaultValue: '0'),
  );

  static final bool perfSelfTest = parseDebugBool(
    const String.fromEnvironment('PERF_SELFTEST', defaultValue: '0'),
  );

  static final bool bossSelfTest = parseDebugBool(
    const String.fromEnvironment('BOSS_SELFTEST', defaultValue: '0'),
  );

  static final bool vfxSelfTest = parseDebugBool(
    const String.fromEnvironment('VFX_SELFTEST', defaultValue: '0'),
  );

  static final bool achSelfTest = parseDebugBool(
    const String.fromEnvironment('ACH_SELFTEST', defaultValue: '0'),
  );

  static final bool tutorialSelfTest = parseDebugBool(
    const String.fromEnvironment('TUTORIAL_SELFTEST', defaultValue: '0'),
  );

  static final bool dailyMissionSelfTest = parseDebugBool(
    const String.fromEnvironment('DAILY_MISSION_SELFTEST', defaultValue: '0'),
  );

  static final bool shareSelfTest = parseDebugBool(
    const String.fromEnvironment('SHARE_SELFTEST', defaultValue: '0'),
  );

  static final bool bossContentSelfTest = parseDebugBool(
    const String.fromEnvironment('BOSS_CONTENT_SELFTEST', defaultValue: '0'),
  );
}
