import 'package:flutter/material.dart';

class AvatarPlaceholder extends StatelessWidget {
  const AvatarPlaceholder({
    super.key,
    required this.label,
    this.size = 72,
    this.locked = false,
    this.circular = false,
  });

  final String label;
  final double size;
  final bool locked;
  final bool circular;

  static String initialsFrom(String value) {
    final tokens = value
        .split(RegExp(r'[\s_-]+'))
        .where((token) => token.trim().isNotEmpty)
        .toList();
    if (tokens.isEmpty) {
      return '?';
    }
    if (tokens.length == 1) {
      final token = tokens.first.trim();
      return token.length <= 2
          ? token.toUpperCase()
          : token.substring(0, 2).toUpperCase();
    }
    return '${tokens.first[0]}${tokens.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final text = label.trim().isEmpty ? '?' : label;

    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: circular ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circular ? null : BorderRadius.circular(14),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[
            colorScheme.primaryContainer,
            colorScheme.secondaryContainer,
          ],
        ),
      ),
      child: Opacity(
        opacity: locked ? 0.48 : 1,
        child: Text(
          text,
          style: theme.textTheme.titleMedium?.copyWith(
            color: colorScheme.onPrimaryContainer,
            fontWeight: FontWeight.w800,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class CharacterAvatar extends StatelessWidget {
  const CharacterAvatar({
    super.key,
    required this.characterId,
    required this.fallbackLabel,
    this.size = 72,
    this.locked = false,
    this.circular = false,
  });

  final String characterId;
  final String fallbackLabel;
  final double size;
  final bool locked;
  final bool circular;

  static const List<double> _greyscaleMatrix = <double>[
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  @override
  Widget build(BuildContext context) {
    final imageWidget = Image.asset(
      'assets/images/characters/$characterId.png',
      width: size,
      height: size,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => AvatarPlaceholder(
        label: fallbackLabel,
        size: size,
        locked: locked,
        circular: circular,
      ),
    );

    final avatar = circular
        ? ClipOval(
            child: SizedBox(width: size, height: size, child: imageWidget),
          )
        : ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(width: size, height: size, child: imageWidget),
          );

    if (!locked) {
      return avatar;
    }

    return ColorFiltered(
      colorFilter: const ColorFilter.matrix(_greyscaleMatrix),
      child: Opacity(opacity: 0.65, child: avatar),
    );
  }
}
