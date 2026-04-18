import 'package:flutter/material.dart';

import '../app/player_profile.dart';
import '../game/data/game_data.dart';
import '../game/models/unit_definition.dart';
import '../resources/resource_map.dart';

class CodexScreen extends StatelessWidget {
  const CodexScreen({super.key, required this.profile, required this.onBack});

  final PlayerProfile profile;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final List<UnitDefinition> units = allPlayableUnits;
    final bool allHumanCollected = units
        .where((UnitDefinition unit) => unit.race == UnitRace.human)
        .every(
          (UnitDefinition unit) => profile.unlockedUnitIds.contains(unit.id),
        );

    return Scaffold(
      appBar: AppBar(
        title: const Text('유닛 도감'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: onBack,
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: <Color>[
              const Color(0xFF111A28),
              const Color(0xFF111A28).withValues(alpha: 0.9),
            ],
          ),
        ),
        child: Column(
          children: <Widget>[
            Container(
              margin: const EdgeInsets.fromLTRB(10, 10, 10, 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.36),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(
                children: <Widget>[
                  const Expanded(
                    child: Text(
                      'Collection Bonus: Collect all Human units',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                  Text(
                    allHumanCollected ? 'ACTIVE +5% ATK' : 'LOCKED',
                    style: TextStyle(
                      color: allHumanCollected
                          ? const Color(0xFF86EFAC)
                          : Colors.white70,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.95,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: units.length,
                itemBuilder: (BuildContext context, int index) {
                  final UnitDefinition unit = units[index];
                  final bool unlocked = profile.unlockedUnitIds.contains(
                    unit.id,
                  );
                  return _CodexCard(unit: unit, unlocked: unlocked);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CodexCard extends StatelessWidget {
  const _CodexCard({required this.unit, required this.unlocked});

  final UnitDefinition unit;
  final bool unlocked;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        Positioned.fill(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.asset(ResourceMap.uiTextbox, fit: BoxFit.fill),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Center(
                  child: ColorFiltered(
                    colorFilter: unlocked
                        ? const ColorFilter.mode(
                            Colors.transparent,
                            BlendMode.dst,
                          )
                        : const ColorFilter.mode(
                            Colors.grey,
                            BlendMode.saturation,
                          ),
                    child: Opacity(
                      opacity: unlocked ? 1 : 0.45,
                      child: Image.asset(
                        unit.placeholderAsset,
                        width: 72,
                        height: 72,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
              Text(
                unlocked ? unit.name : '???',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                unlocked ? '${unit.race.label} / ${unit.job.label}' : 'Locked',
                style: const TextStyle(fontSize: 11, color: Colors.white70),
              ),
              const SizedBox(height: 3),
              Text(
                unlocked ? unit.skillDescription : '획득 후 상세 스토리/스탯 공개',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, color: Colors.white70),
              ),
            ],
          ),
        ),
        if (!unlocked)
          Positioned(
            top: 8,
            right: 8,
            child: Image.asset(ResourceMap.iconLocked, width: 18, height: 18),
          ),
      ],
    );
  }
}
