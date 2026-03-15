class SkillData {
  const SkillData({
    required this.name,
    required this.cooldown,
    required this.type,
    this.damage,
    this.healAmount,
    this.duration,
    this.radius,
  });

  final String name;
  final double cooldown;
  final String type;
  final double? damage;
  final double? healAmount;
  final double? duration;
  final double? radius;
}

const Map<String, SkillData> skills = <String, SkillData>{
  'slash': SkillData(
    name: '베기',
    damage: 1.5,
    cooldown: 5,
    type: 'single_target',
  ),
  'power_slash': SkillData(
    name: '강타 베기',
    damage: 2.2,
    cooldown: 6,
    type: 'single_target',
  ),
  'shield_bash': SkillData(
    name: '방패 강타',
    damage: 1.8,
    duration: 1.0,
    cooldown: 7,
    type: 'single_target_stun',
  ),
  'holy_strike': SkillData(
    name: '성스러운 일격',
    damage: 2.6,
    healAmount: 0.1,
    cooldown: 8,
    type: 'single_target_lifesteal',
  ),
  'divine_judgment': SkillData(
    name: '신성 심판',
    damage: 3.5,
    radius: 1.8,
    cooldown: 10,
    type: 'aoe',
  ),
  'arrow_shot': SkillData(
    name: '화살 사격',
    damage: 1.4,
    cooldown: 4,
    type: 'single_target',
  ),
  'double_shot': SkillData(
    name: '연속 사격',
    damage: 1.1,
    cooldown: 5,
    type: 'multi_shot',
  ),
  'piercing_arrow': SkillData(
    name: '관통 화살',
    damage: 2.4,
    cooldown: 6,
    type: 'line_pierce',
  ),
  'fireball': SkillData(
    name: '파이어볼',
    damage: 2.0,
    cooldown: 6,
    type: 'aoe',
    radius: 1.5,
  ),
  'ice_bolt': SkillData(
    name: '아이스 볼트',
    damage: 1.8,
    duration: 1.2,
    cooldown: 5.5,
    type: 'single_target_slow',
  ),
  'meteor': SkillData(
    name: '메테오',
    damage: 3.0,
    radius: 2.0,
    cooldown: 9,
    type: 'aoe',
  ),
  'heal': SkillData(
    name: '치유',
    healAmount: 0.3,
    cooldown: 4,
    type: 'ally_single',
  ),
  'mass_heal': SkillData(
    name: '대규모 치유',
    healAmount: 0.22,
    radius: 2.4,
    cooldown: 7,
    type: 'ally_aoe',
  ),
  'taunt': SkillData(name: '도발', duration: 3, cooldown: 8, type: 'debuff'),
  'fortress': SkillData(
    name: '요새화',
    duration: 4,
    cooldown: 10,
    type: 'self_buff',
  ),
};
