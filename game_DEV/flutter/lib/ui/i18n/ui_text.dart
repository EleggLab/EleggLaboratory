import 'package:flutter/widgets.dart';

import '../../models/game_options.dart';

String trByLanguage(
  GameOptionsData options, {
  required String ko,
  required String en,
}) {
  return options.uiLanguage == UiLanguage.ko ? ko : en;
}

Locale localeFromLanguage(UiLanguage language) {
  switch (language) {
    case UiLanguage.ko:
      return const Locale('ko');
    case UiLanguage.en:
      return const Locale('en');
  }
}

String languageLabel(UiLanguage language) {
  switch (language) {
    case UiLanguage.ko:
      return '한국어';
    case UiLanguage.en:
      return 'English';
  }
}
