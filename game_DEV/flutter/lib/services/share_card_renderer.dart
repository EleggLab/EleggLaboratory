import 'dart:typed_data';
import 'dart:ui' as ui;

class RunShareCardPayload {
  const RunShareCardPayload({
    required this.gameTitle,
    required this.versionText,
    required this.mode,
    required this.seed,
    required this.score,
    required this.loop,
    required this.maxCombo,
    required this.bosses,
    required this.character,
    required this.augmentNames,
  });

  final String gameTitle;
  final String versionText;
  final String mode;
  final int seed;
  final int score;
  final int loop;
  final int maxCombo;
  final int bosses;
  final String character;
  final List<String> augmentNames;
}

class ShareCardService {
  ShareCardService._();

  static final ShareCardService instance = ShareCardService._();

  Future<Uint8List> renderRunSummaryCard({
    required RunShareCardPayload payload,
    int width = 1080,
    int height = 1350,
  }) async {
    final recorder = ui.PictureRecorder();
    final canvas = ui.Canvas(recorder);
    final rect = ui.Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble());
    canvas.drawRect(rect, ui.Paint()..color = const ui.Color(0xFF253A70));

    final paragraphBuilder =
        ui.ParagraphBuilder(ui.ParagraphStyle(fontSize: 42, maxLines: 20))
          ..pushStyle(
            ui.TextStyle(
              color: const ui.Color(0xFFFFFFFF),
              fontWeight: ui.FontWeight.w700,
            ),
          )
          ..addText(
            '${payload.gameTitle}\n${payload.versionText}\nMode: ${payload.mode}\nSeed: ${payload.seed}\nScore: ${payload.score}\nLoop: ${payload.loop}\nCombo: ${payload.maxCombo}\nBosses: ${payload.bosses}\nCharacter: ${payload.character}',
          );

    final paragraph = paragraphBuilder.build()
      ..layout(ui.ParagraphConstraints(width: width - 120));
    canvas.drawParagraph(paragraph, const ui.Offset(60, 80));

    final image = await recorder.endRecording().toImage(width, height);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) {
      throw StateError('share_card_encode_failed');
    }
    return byteData.buffer.asUint8List();
  }
}
