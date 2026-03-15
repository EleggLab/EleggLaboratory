import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../models/replay_data.dart';

class ReplayStorageService {
  ReplayStorageService._();

  static final ReplayStorageService instance = ReplayStorageService._();

  Future<String> saveReplay(RunReplay replay) async {
    final root = await getApplicationDocumentsDirectory();
    final replayDir = Directory('${root.path}${Platform.pathSeparator}replays');
    if (!await replayDir.exists()) {
      await replayDir.create(recursive: true);
    }
    final file = File(
      '${replayDir.path}${Platform.pathSeparator}${replay.runId}.json',
    );
    await file.writeAsString(jsonEncode(replay.toJson()), flush: true);
    return file.path;
  }

  Future<RunReplay?> loadReplay(String path) async {
    try {
      final file = File(path);
      if (!await file.exists()) {
        return null;
      }
      final raw = await file.readAsString();
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return null;
      }
      return RunReplay.fromJson(Map<String, dynamic>.from(decoded));
    } catch (_) {
      return null;
    }
  }
}
