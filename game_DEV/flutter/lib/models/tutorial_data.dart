import 'package:flutter/foundation.dart';

@immutable
class TutorialData {
  const TutorialData({required this.hasSeenTutorial});

  final bool hasSeenTutorial;

  static const TutorialData defaults = TutorialData(hasSeenTutorial: false);

  TutorialData copyWith({bool? hasSeenTutorial}) {
    return TutorialData(
      hasSeenTutorial: hasSeenTutorial ?? this.hasSeenTutorial,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{'hasSeenTutorial': hasSeenTutorial};
  }

  factory TutorialData.fromJson(Map<String, dynamic> json) {
    return TutorialData(
      hasSeenTutorial: (json['hasSeenTutorial'] as bool?) ?? false,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is TutorialData && other.hasSeenTutorial == hasSeenTutorial;
  }

  @override
  int get hashCode => hasSeenTutorial.hashCode;
}
