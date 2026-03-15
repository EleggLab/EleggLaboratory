import 'package:flutter/material.dart';

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(title, style: theme.textTheme.titleLarge),
        if (subtitle != null) ...<Widget>[
          const SizedBox(height: 4),
          Text(subtitle!, style: theme.textTheme.bodySmall),
        ],
      ],
    );
  }
}
