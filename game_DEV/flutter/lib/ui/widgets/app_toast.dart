import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';

class AppToast {
  static OverlayEntry? _entry;

  static void show(
    BuildContext context, {
    required String message,
    IconData icon = Icons.info_rounded,
    Duration duration = AppTokens.toastShowDuration,
  }) {
    _entry?.remove();
    _entry = null;

    final overlay = Overlay.of(context, rootOverlay: true);

    late OverlayEntry nextEntry;
    nextEntry = OverlayEntry(
      builder: (overlayContext) {
        return _ToastHost(
          message: message,
          icon: icon,
          duration: duration,
          onDone: () {
            if (_entry == nextEntry) {
              _entry?.remove();
              _entry = null;
            } else {
              nextEntry.remove();
            }
          },
        );
      },
    );

    _entry = nextEntry;
    overlay.insert(nextEntry);
  }
}

class ToastPill extends StatelessWidget {
  const ToastPill({
    super.key,
    required this.message,
    required this.icon,
    this.borderColor,
  });

  final String message;
  final IconData icon;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveBorder =
        borderColor ?? theme.colorScheme.primary.withValues(alpha: 0.7);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
        border: Border.all(color: effectiveBorder),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: 16, color: theme.colorScheme.onSurface),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                message,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToastHost extends StatefulWidget {
  const _ToastHost({
    required this.message,
    required this.icon,
    required this.duration,
    required this.onDone,
  });

  final String message;
  final IconData icon;
  final Duration duration;
  final VoidCallback onDone;

  @override
  State<_ToastHost> createState() => _ToastHostState();
}

class _ToastHostState extends State<_ToastHost> {
  bool _visible = false;
  Timer? _hideTimer;
  Timer? _removeTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _visible = true;
      });
      _hideTimer = Timer(widget.duration, _beginHide);
    });
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _removeTimer?.cancel();
    super.dispose();
  }

  void _beginHide() {
    if (!mounted) {
      return;
    }
    setState(() {
      _visible = false;
    });
    _removeTimer = Timer(const Duration(milliseconds: 220), widget.onDone);
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top + AppTokens.space12;
    return Positioned(
      top: topPadding,
      left: 16,
      right: 16,
      child: IgnorePointer(
        child: Center(
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 180),
            opacity: _visible ? 1 : 0,
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 180),
              offset: _visible ? Offset.zero : const Offset(0, -0.08),
              child: ToastPill(message: widget.message, icon: widget.icon),
            ),
          ),
        ),
      ),
    );
  }
}
