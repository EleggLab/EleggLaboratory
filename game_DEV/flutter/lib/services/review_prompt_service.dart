import 'package:in_app_review/in_app_review.dart';

import 'debug_logger_service.dart';

class ReviewPromptService {
  ReviewPromptService._({InAppReview? inAppReview})
    : _inAppReview = inAppReview ?? InAppReview.instance;

  static final ReviewPromptService instance = ReviewPromptService._();

  final InAppReview _inAppReview;

  Future<bool> requestReviewIfAvailable() async {
    try {
      final available = await _inAppReview.isAvailable();
      if (!available) {
        DebugLoggerService.instance.info('In-app review unavailable.');
        return false;
      }
      await _inAppReview.requestReview();
      DebugLoggerService.instance.info('In-app review requested.');
      return true;
    } catch (error) {
      DebugLoggerService.instance.warn('In-app review failed: $error');
      return false;
    }
  }
}
