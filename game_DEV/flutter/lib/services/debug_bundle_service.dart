import 'dart:convert';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/replay_data.dart';
import '../state/app_state.dart';
import '../ui/widgets/app_toast.dart';
import '../ui/widgets/ui_feedback.dart';
import 'debug_logger_service.dart';
import 'replay_storage_service.dart';

class DebugBundleService {
  DebugBundleService._();

  static final DebugBundleService instance = DebugBundleService._();
  String? _lastBundlePath;
  DateTime? _lastBundleAt;

  String? get lastBundlePath => _lastBundlePath;
  DateTime? get lastBundleAt => _lastBundleAt;

  Future<void> exportFromContext(
    BuildContext context, {
    required String source,
    RunReplay? replay,
    String? replayPath,
    String? lastError,
  }) async {
    try {
      final appState = context.read<AppState>();
      final bundleDir = await _buildBundle(
        appState: appState,
        source: source,
        replay: replay,
        replayPath: replayPath,
        lastError: lastError,
      );
      final files = <XFile>[];
      await for (final entry in bundleDir.list()) {
        if (entry is File) {
          files.add(XFile(entry.path));
        }
      }
      _lastBundlePath = bundleDir.path;
      _lastBundleAt = DateTime.now();
      await SharePlus.instance.share(
        ShareParams(
          files: files,
          text: 'AugmentBrick Debug Bundle (${bundleDir.path})',
        ),
      );
      UiFeedback.tap();
    } catch (error) {
      final report = 'Debug bundle export failed: $error';
      try {
        await Clipboard.setData(ClipboardData(text: report));
      } catch (_) {}
      if (context.mounted) {
        AppToast.show(
          context,
          message: 'Debug export failed. Copied error to clipboard.',
          icon: Icons.bug_report_rounded,
        );
      }
    }
  }

  Future<Directory> buildBundleForTest({
    required Map<String, dynamic> saveJson,
    required String source,
    Map<String, dynamic>? runSnapshot,
    RunReplay? replay,
    Directory? rootDirectory,
  }) {
    return _buildBundleForTestImpl(
      saveJson: saveJson,
      source: source,
      runSnapshot: runSnapshot,
      replay: replay,
      rootDirectory: rootDirectory,
    );
  }

  Future<Directory> _buildBundleForTestImpl({
    required Map<String, dynamic> saveJson,
    required String source,
    Map<String, dynamic>? runSnapshot,
    RunReplay? replay,
    Directory? rootDirectory,
  }) async {
    final dir = await _buildBundleRaw(
      saveJson: saveJson,
      source: source,
      rootDirectory: rootDirectory,
    );
    await File(
      '${dir.path}${Platform.pathSeparator}report.txt',
    ).writeAsString('test-report source=$source');
    if (runSnapshot != null) {
      await File(
        '${dir.path}${Platform.pathSeparator}run_snapshot.json',
      ).writeAsString(const JsonEncoder.withIndent('  ').convert(runSnapshot));
    }
    if (replay != null) {
      await File(
        '${dir.path}${Platform.pathSeparator}replay.json',
      ).writeAsString(
        const JsonEncoder.withIndent('  ').convert(replay.toJson()),
      );
    }
    return dir;
  }

  Future<Directory> _buildBundle({
    required AppState appState,
    required String source,
    RunReplay? replay,
    String? replayPath,
    String? lastError,
  }) async {
    final saveJson = appState.saveData.toJson();
    final dir = await _buildBundleRaw(saveJson: saveJson, source: source);

    final runSnapshot = appState.activeRunSnapshot;
    if (runSnapshot != null) {
      await File(
        '${dir.path}${Platform.pathSeparator}run_snapshot.json',
      ).writeAsString(const JsonEncoder.withIndent('  ').convert(runSnapshot));
    }

    RunReplay? targetReplay = replay;
    if (targetReplay == null && replayPath != null && replayPath.isNotEmpty) {
      targetReplay = await ReplayStorageService.instance.loadReplay(replayPath);
    }
    if (targetReplay != null) {
      await File(
        '${dir.path}${Platform.pathSeparator}replay.json',
      ).writeAsString(
        const JsonEncoder.withIndent('  ').convert(targetReplay.toJson()),
      );
    }

    final logs = DebugLoggerService.instance.dump(max: 300).join('\n');
    await File(
      '${dir.path}${Platform.pathSeparator}last_logs.txt',
    ).writeAsString(logs);

    final report = await _composeReport(
      appState: appState,
      source: source,
      lastError: lastError,
    );
    await File(
      '${dir.path}${Platform.pathSeparator}report.txt',
    ).writeAsString(report);
    return dir;
  }

  Future<Directory> _buildBundleRaw({
    required Map<String, dynamic> saveJson,
    required String source,
    Directory? rootDirectory,
  }) async {
    final root = rootDirectory ?? await getTemporaryDirectory();
    final ts = DateTime.now().millisecondsSinceEpoch;
    final dir = Directory(
      '${root.path}${Platform.pathSeparator}AugmentBrick_DebugBundle_$ts',
    );
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    _lastBundlePath = dir.path;
    _lastBundleAt = DateTime.now();
    await File(
      '${dir.path}${Platform.pathSeparator}save.json',
    ).writeAsString(const JsonEncoder.withIndent('  ').convert(saveJson));
    await File('${dir.path}${Platform.pathSeparator}meta.txt').writeAsString(
      'source=$source\ncreatedAt=${DateTime.now().toIso8601String()}',
    );
    return dir;
  }

  Future<void> clearTemporaryBundles() async {
    try {
      final root = await getTemporaryDirectory();
      await for (final entry in root.list()) {
        if (entry is! Directory) {
          continue;
        }
        final name = entry.path.split(Platform.pathSeparator).last;
        if (!name.startsWith('AugmentBrick_DebugBundle_')) {
          continue;
        }
        await entry.delete(recursive: true);
      }
      _lastBundlePath = null;
      _lastBundleAt = null;
    } catch (_) {
      // Best-effort cleanup only.
    }
  }

  Future<String> _composeReport({
    required AppState appState,
    required String source,
    String? lastError,
  }) async {
    final packageInfo = await _safePackageInfo();
    final deviceInfo = await _safeDeviceInfo();
    final now = DateTime.now();
    final options = appState.gameOptions;
    return <String>[
      'Augment Brick Debug Report',
      'source: $source',
      'time: ${now.toIso8601String()}',
      'timezone: ${now.timeZoneName} (${now.timeZoneOffset.inMinutes}m)',
      'app: ${packageInfo['appName']} ${packageInfo['version']} (${packageInfo['buildNumber']})',
      'device: $deviceInfo',
      'mode: activeRun=${appState.hasActiveRun}',
      'settings: sfx=${options.sfxEnabled}, vibration=${options.vibrationEnabled}, vfx=${options.vfxIntensity.name}, speed=${options.defaultSimulationSpeed}x, ads=${options.adMode.name}, personalizedAds=${options.personalizedAdsEnabled}, crash=${options.crashReportingEnabled}',
      'seedHint: daily=${appState.dailySeedForDate(DateTime.now())}, weekly=${appState.weeklySeedForDate(DateTime.now())}',
      if (lastError != null && lastError.isNotEmpty) 'lastError: $lastError',
    ].join('\n');
  }

  Future<Map<String, String>> _safePackageInfo() async {
    try {
      final info = await PackageInfo.fromPlatform();
      return <String, String>{
        'appName': info.appName,
        'version': info.version,
        'buildNumber': info.buildNumber,
      };
    } catch (_) {
      return <String, String>{
        'appName': 'unknown',
        'version': 'unknown',
        'buildNumber': 'unknown',
      };
    }
  }

  Future<String> _safeDeviceInfo() async {
    try {
      final plugin = DeviceInfoPlugin();
      if (defaultTargetPlatform == TargetPlatform.android) {
        final android = await plugin.androidInfo;
        return '${android.manufacturer} ${android.model} sdk${android.version.sdkInt}';
      }
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        final ios = await plugin.iosInfo;
        return '${ios.name} ${ios.model} ${ios.systemVersion}';
      }
      return defaultTargetPlatform.name;
    } catch (_) {
      return 'unknown';
    }
  }
}
