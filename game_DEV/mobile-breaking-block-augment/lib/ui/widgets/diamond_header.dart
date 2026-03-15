import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';

class DiamondHeader extends StatelessWidget {
  const DiamondHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final diamonds = context.select<AppState, int>((state) => state.diamonds);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blueGrey.shade900,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        children: <Widget>[
          const Icon(Icons.diamond_rounded, color: Colors.cyanAccent, size: 18),
          const SizedBox(width: 6),
          Text(
            '$diamonds',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}


