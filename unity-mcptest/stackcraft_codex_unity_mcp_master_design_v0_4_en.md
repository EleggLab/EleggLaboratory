# Small-Scale Species Mutation / Affinity / Reproduction / Genealogy Game Built on StackCraft
## Codex + Unity MCP Implementation-Oriented Master Design Document v0.4 (English Edition)

Document status:
- Version: v0.4-en
- Intended users: GPT Codex / Unity MCP / human director
- Target scope: Prototype -> Vertical Slice -> Early Content Pack 01
- Document type: implementation-oriented structured specification, not a pitch deck
- Reading mode: written for AI-assisted production first, human review second
- Content boundary: explicit sexual scene writing is intentionally excluded. This document defines `relationship`, `affinity`, `mating eligibility`, `lineage`, `mutation`, `genealogy`, and `adult-tone presentation layer separation` at the systems level.

---

## 0. Problem This Document Solves

If this project is treated as a generic `Stacklands-style card stacking game`, its real appeal becomes diluted.
The actual core of the project is the following six-part structure:

1. A small-scale lineage simulation that starts from one human male protagonist card and one human female protagonist card
2. Species mutation acquisition through fixed top-bar location cards
3. Conversion of hostile red cards into recruitable units through purification after combat
4. Affinity unlocking through species-specific preferred gifts
5. A reproduction loop built around requirements, time locks, and recovery windows
6. Long-term collection through genealogy records that preserve name, lineage, generation, and mutation history for every entity

In practical terms, the game is a combination of:

- a card-based management game
- a relationship / affinity strategy game
- a species and bloodline collection game
- a living-board observation game
- a fantasy world simulation with adult tone and tension, while keeping explicit content decoupled from core logic

This document restructures those layers into a form that Codex can implement step by step.

---

## 1. External Assumptions and Implementation Context

### 1-1. Assumptions Based on Public StackCraft Information
Based on the public store description, StackCraft either already provides or strongly implies the following:

- a Stacking Rules Matrix controlling card-to-card interactions
- a Day Cycle with Feeding / Selling / Encounters / New Day phases
- time-based crafting and discovery systems
- rock-paper-scissors combat
- quest groups
- encounter spawning
- ScriptableObject-driven content addition
- a save system

Therefore this project follows these principles:

- Do not discard the existing StackCraft structure.
- Preserve the original design philosophy around cards, timers, encounters, and ScriptableObject-driven content.
- Replace the purchasable booster-pack top bar with a fixed location-slot UI.
- Treat `Species`, `Affinity`, `Purification`, `Reproduction`, `Genealogy`, and `AutoBehavior` as the six new core system layers that must be added.
- Prefer additive integration over destructive rewrites.

### 1-2. Codex + Unity MCP Assumptions
Assume Codex is used in an environment where it can inspect, edit, run, and test code, and where `AGENTS.md` is available to inject project-specific instructions.
Assume the Unity MCP implementation in use supports most or all of the following:

- project / asset / hierarchy search
- GameObject selection, creation, and mutation
- scene load / save
- entering and exiting play mode
- console log inspection
- compilation state inspection
- screenshot capture
- custom MCP tool extension

The full document is written under these tool assumptions.

### 1-3. Areas That Cannot Be Confirmed Yet
The actual internal code structure of the purchased asset cannot be confirmed from the public page alone.
The following must therefore remain assumptions until the real project is inspected:

- exact base class name for runtime card entities
- exact event hook points for day cycle phases
- exact field names for encounter definitions
- exact save serialization approach
- final UI framework choice (UGUI vs UI Toolkit)

All designs in this document prioritize meaning and structure first.
At implementation time, only project-specific names need to be mapped.

---

## 2. Product Definition

### 2-1. One-Line Product Definition
`A Stacklands-flavored card-board fantasy relationship simulator focused on species mutation, affinity, reproduction, and genealogy collection.`

### 2-2. Intended Emotional Experience
- The game should begin small and fragile, then gradually make the board feel like a living ecosystem.
- Sending cards to locations should create anticipation: `What species, gift, or event will come back this time?`
- Winning against a hostile red card and purifying it into a recruitable ally should feel like a major collection reward.
- Discovering which gifts open which species should create strategy and courtship puzzle gameplay.
- Offspring should feel like named beings with ancestry, not disposable production outputs.
- In the long term, rare lineages and beautiful genealogy structures should become major retention drivers.

### 2-3. Explicitly Excluded From This Stage
The following are intentionally out of scope for the current design stage:

- a large building tech tree
- city management
- deep equipment and loot systems
- dozens of species and a huge encyclopedia from day one
- advanced tactical combat meta
- explicit adult scene scripts

---

## 3. Core Design Principles

### 3-1. One Creature Card Equals One Tracked Being
Each living card has a name, species, sex, lineage, and state.
A creature card is not a generic resource card. It is a traceable entity.

### 3-2. Player-Controlled Entities and Ecosystem Entities Are Not the Same
The human male and human female protagonist cards are central to player decision-making.
Non-protagonist entities exist to keep the board alive and semi-autonomous.

### 3-3. Reproduction Is a Path, Not a Button
Reproduction is not an instant production action.
It is a chain:

- acquire a target
- purify hostile states when needed
- discover gifts
- unlock affinity
- satisfy rules
- spend time under lock
- resolve birth or hatch outcome
- evaluate offspring value
- add the result to genealogy

### 3-4. Adult Tone Exists Behind the System Layer
Long-term engagement should come from state changes, relationships, and lineage collection.
Adult presentation is a reward / presentation layer attached to those systems, not the mechanical core.

### 3-5. Systems Must Be Decomposed So AI Can Implement Them Reliably
Every major feature is separated into three layers:

- Data Layer: ScriptableObjects, enums, rule tables
- Runtime Layer: state machines, timers, validators, save state
- Presentation Layer: card visuals, panels, animations, SFX, tooltips

---

## 4. Player Experience Overview

### 4-1. First 5 Minutes
- Start with one human male card and one human female card
- The top bar contains four fixed location cards: Forest / RockyMountain / Swamp / Sea
- Sending a human-origin character to a location resolves after a short duration
- Locations can return gifts, combat encounters, events, or mutation outcomes
- The player begins learning which locations connect to which species and gift categories

### 4-2. First 15 Minutes
- Gain the first non-human species
- Encounter the first hostile red card
- Learn the difference between hostile units that can be purified and those that cannot
- Learn the relationship between gift categories and species preferences

### 4-3. First 30 Minutes
- Purify at least one hostile unit
- Open affinity tiers 1-2 for at least one target through gifts
- Unlock the first mating-eligible pair
- See the first offspring / egg / cocoon result
- Open the card detail panel and confirm parent / child links

### 4-4. After 1 Hour
- Species variety on the board increases
- Auto-ecology begins to become visible
- Long-term play centers around rare traits and lineage combinations
- The genealogy screen becomes a real collection goal, not a novelty

---

## 5. Core Loops

### 5-1. Micro Loop
1. Check available location cards
2. Drag an eligible entity card onto a location
3. Wait for the timer to resolve
4. Receive a result
5. Manage the returned gifts and resources
6. Give gifts to a target entity
7. Raise affinity
8. If requirements are met, start pairing / reproduction
9. Spend locked time
10. Confirm birth / hatch result
11. Accumulate the offspring into genealogy

### 5-2. Meso Loop
Each day rotates through Feeding -> Encounter -> Progression -> Reset.
Insert the following additional processing into the existing StackCraft day cycle:

- affinity decay or maintenance
- pregnancy progress
- growth progress
- auto-behavior ticks
- purification cooldown reduction
- location refresh

### 5-3. Long-Term Loop
- widen species and gift access through locations
- purify hostile species to expand bloodline branches
- optimize gift preferences to speed up relationship opening
- collect rare lineage tags and generation records
- complete both encyclopedia and genealogy goals

---

## 6. System Scope Definition

### 6-1. Mandatory Systems for This Phase
- two protagonist cards
- four fixed location cards
- species mutation
- hostile red state
- purification
- affinity
- gifts
- mating eligibility validation
- pairing lock
- pregnancy / egg / cocoon / birth / growth
- auto behavior
- name generation
- parent / child / generation records
- card detail view
- genealogy view
- save / load integration

### 6-2. Deferred Systems for Later
- building expansion
- town / brothel district / hub economy
- equipment tables
- deeper quest narrative
- faction conflict / map exploration expansion
- CG gallery
- multi-language localization

---

## 7. Board Structure

### 7-1. Top Area
`Location Bar`
This is the main UI that replaces the original booster-pack purchase bar.

Initial slots:
- Forest
- RockyMountain
- Swamp
- Sea

Each slot contains:
- icon
- name
- main tags
- input eligibility requirements
- current occupancy state
- progress timer
- category hints for likely outcomes

### 7-2. Main Board
- entity cards
- resource cards
- purification waiting cards / states
- reproduction / birth progress cards or states
- hostile red cards
- event cards

### 7-3. Right Detail Panel
Selected card details should show:
- name
- current species
- origin species
- sex
- adult status
- affinity tier
- hostile / purification state
- reproduction availability
- parents / children
- trait tags
- liked gifts / disliked gifts
- recent history

### 7-4. Bottom Overlay
- day counter
- time until feeding phase
- current total population
- pregnancy / growth queue summary
- genealogy shortcut
- encyclopedia progress
- warning log (starvation, overpopulation, hostile arrival, birth completion, etc.)

---

## 8. Entity Model Definition

### 8-1. Every Entity Card Must Have a Stable Unique ID
Every living creature card must receive a persistent global ID.
This is mandatory for genealogy and save/load integrity.

### 8-2. Common Entity Fields
```yaml
EntityId: string
DisplayName: string
Sex: Male | Female
AgeStage: Infant | Juvenile | Adult | Elder
OriginSpeciesId: string
CurrentSpeciesId: string
CardColorState: Default | HostileRed | Purifying | LockedBreeding | Pregnant | Incubating
IsProtagonist: bool
IsPurified: bool
IsAlive: bool
CanMoveAutonomously: bool
CanBreedAutonomously: bool
AffinityGroupIds: [string]
TraitTags: [string]
StatBlock:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
Reproduction:
  CanInitiate: bool
  CanReceivePregnancy: bool
  PregnancyProgressDays: int
  PregnancyDaysRequired: int
  LastMateEntityId: string|null
  CurrentMateEntityId: string|null
Genealogy:
  FatherEntityId: string|null
  MotherEntityId: string|null
  GenerationIndex: int
  LineageRootId: string
  BirthOrder: int
History:
  DiscoveryLocationId: string|null
  MutationHistory: [string]
  PurificationHistory: [string]
  GiftHistory: [string]
```

### 8-3. Extra Fields for Protagonist Cards
```yaml
PlayerRootFlags:
  IsMainProtagonist: true
  AutoBreedDisabledByDefault: true
  CannotBeAutoSacrificed: true
  AlwaysShowInGenealogyRoot: true
```

### 8-4. State Separation Rule
Do not merge the following into one monolithic runtime blob:

- species identity
- card color state
- temporary reproduction or lock state
- bloodline record
- combat stats
- UI display state

Keep them separate so save, debugging, and future extension remain manageable.

---

## 9. Species Structure Design

### 9-1. Initial Species Scope
Prototype wave 1 species:

Base / neutral or recruitable species:
- Human
- Elf
- Beastfolk
- Merfolk
- Slimeborn

Hostile-first species that become recruitable after purification:
- Orc
- Ogre
- Centaur

Reason for this set:
- immediately readable fantasy identities
- clear gift preference contrast
- easy visual differentiation for card art
- easy to define hybrid results and bloodline tags

### 9-2. Species Data Schema
```yaml
SpeciesId: string
DisplayName: string
BaseCardFrameColor: string
FactionType: Civil | Hostile | NeutralWild
BiomeAffinity:
  Forest: int
  RockyMountain: int
  Swamp: int
  Sea: int
GiftTasteProfileId: string
CombatProfile:
  Rock: int
  Paper: int
  Scissors: int
BaseStats:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
ReproductionProfile:
  MinimumAffinityTier: int
  GestationType: LiveBirth | Egg | Cocoon
  GestationDays: int
  RecoveryDays: int
  AdultAgeDays: int
MutationInputs:
  EligibleOriginSpeciesIds: [string]
  EligibleLocationIds: [string]
TraitPoolIds: [string]
NamingPoolId: string
LoreTags: [string]
```

### 9-3. Species Design Rules
- Keep the total number of species small, but make each one mechanically distinct.
- Every species must have at least one strong location connection.
- Every species must have at least one strongly preferred gift type.
- Every species must have at least one meaningful strength in combat, survival, fertility, or rare bloodline output.
- Species differences should be felt as play-style differences, not only stat differences.

### 9-4. Initial Species Concepts

#### Human
- origin species
- main mutation starting point
- broad gift tolerance
- neutral reproduction conditions
- baseline lineage anchor

#### Elf
- forest-linked
- prefers flowers, herbs, and luminous fruit
- high Charm
- medium-high Fertility
- low-to-medium Combat
- higher chance to produce elegant / spirit-touched bloodline tags

#### Beastfolk
- forest / swamp border species
- prefers meat, mushrooms, and warm cloth
- high Appetite
- medium Combat and Fertility
- high chance for wild / agile tag outcomes

#### Merfolk
- sea-linked
- prefers pearls, seaweed, and seafood
- exploration bonus in Sea
- may have land penalties or reduced efficiency outside aquatic context
- chance to pass on aquatic traits to offspring

#### Slimeborn
- swamp-linked
- prefers gel, mushrooms, and mineral fluids
- Cocoon-style gestation
- higher mutation tag chance
- intentionally designed as a rare-combination axis rather than a conventional beauty archetype

#### Orc
- starts hostile red
- recruitable after combat purification
- prefers meat
- high Combat
- low Charm
- can optionally begin with an affinity-cap penalty after purification

#### Ogre
- starts hostile red
- very high Vitality, low agility feel
- high Appetite
- longer pregnancy and recovery windows
- higher chance for giant-type lineage traits

#### Centaur
- starts hostile red
- can appear through RockyMountain or Forest-related encounters even without a dedicated plains biome
- prefers carrots, grains, and apples
- strong movement / expedition utility
- stronger in survival / transport identity than in pure damage output

---

## 10. Location System Design

### 10-1. Locations Replace Card Packs
Locations are not just expedition nodes.
They are the entry points for `species unlock`, `gift supply`, `hostile spawns`, `events`, and `mutation`.

### 10-2. Initial Four Locations
- Forest
- RockyMountain
- Swamp
- Sea

### 10-3. Location Data Schema
```yaml
LocationId: string
DisplayName: string
FrameStyle: string
AllowsSpeciesMutation: bool
AllowedInputSpeciesIds: [string]
BaseDurationSeconds: float
PrimaryDrops: [DropEntry]
SecondaryDrops: [DropEntry]
MutationRules: [MutationRuleRef]
HostileEncounterRules: [EncounterRef]
AffinityHintTags: [string]
RiskProfile:
  InjuryChance: float
  DelayChance: float
  HostileSpawnChance: float
RefreshPolicy:
  CooldownDays: int
  AlwaysAvailable: bool
```

### 10-4. Per-Location Design Intent

#### Forest
- entry point for Elf and Beastfolk routes
- supplies flowers, herbs, berries, and soft meat
- soft onboarding area
- route for charm-oriented and nature-aligned species

#### RockyMountain
- source of centaur-related events, minerals, stone, mushrooms, horn / hide materials
- route for combat and durability themes
- medium risk
- medium hostile appearance rate

#### Swamp
- source of Slimeborn, poison mushrooms, marsh meat, slime-like resources
- route for mutation and cocoon-based lineages
- high risk
- widest rare-trait tag pool

#### Sea
- source of Merfolk, seaweed, shells, pearls, fish
- route for food plus rare gift items
- longest average expedition time
- route for water-aligned mutation and rare lineage tags

### 10-5. Meaning of Sending a Human to a Location
When a human-origin character explores a location, the result should branch into one of four broad categories:

1. return with resources only
2. remain human and receive a bonus outcome
3. mutate into a location-aligned species
4. trigger a risk event

Even if the presentation says `the human disappeared and a different card returned`, the internal data should preserve the same `EntityId` and only change `CurrentSpeciesId` whenever possible.
That approach keeps genealogy and narrative continuity intact.

### 10-6. Rules for Non-Human Location Use
Non-human entities generally do one of the following:

- gather resources only in locations aligned with their species
- trigger species-specific rare events
- re-mutate at a low probability under special conditions

Re-mutation should not unlock too quickly.
For the first playable version, it is acceptable to restrict full mutation routing mainly to human-origin characters.

---

## 11. Hostile Red State and Purification System

### 11-1. Meaning of the Red Card State
Red is not just a frame color.
It is a gameplay state.

Effects of the hostile red state:
- not treated as a player-owned ally
- cannot gain affinity
- cannot receive gifts
- cannot participate in reproduction
- may perform hostile autonomous behavior
- is handled through combat and purification loops

### 11-2. Spawn Paths for Hostile Red Cards
- encounter phase spawns
- failed location outcomes
- corruption events
- milestone day spawns

### 11-3. Purification Flow
```text
HostileRedSpawn
-> EngageCombat
-> WinConditionMet
-> PurifyingState
-> ConversionCountdown
-> DefaultCardColor + Recruitable
```

### 11-4. Purification Data Schema
```yaml
PurificationProfileId: string
HostileSpeciesId: string
RequiredWinCount: int
PurificationDays: int
PostPurificationAffinityFloor: int
PostPurificationTraitTags: [string]
FailurePenalty:
  InjuryChance: float
  EscapeChance: float
  DeathChance: float
```

### 11-5. Post-Purification Restrictions
To avoid immediate deep relationship access after purification, use some of the following restrictions:

- starting affinity fixed at 0
- one-day recovery debuff
- first mating requires one extra affinity tier beyond the normal minimum
- narrow early gift compatibility
- auto-behavior remains locked until the player interacts a certain number of times

### 11-6. Functional Purpose of the Purification System
- combat feeds into collection instead of only removal
- hostile species feel rewarding to obtain
- the original enemy-encounter loop of the reference structure is preserved naturally
- bloodline branches expand over time

---

## 12. Gift System

### 12-1. Gifts Are the Core Currency of Affinity
Affinity growth should be solved through drag-and-drop card interaction, not conversation UI.
This is a natural fit for Stacklands-style UX.

### 12-2. Gift Categories
- Flora: flowers, herbs, berries
- Food: meat, fish, carrots, mushrooms
- Mineral: pebbles, ore fragments, pearls
- Exotic: slime, sea glass, glowing seeds
- Comfort: cloth scraps, dried leaves, scented pouches

### 12-3. Gift Data Schema
```yaml
GiftItemId: string
DisplayName: string
Category: Flora | Food | Mineral | Exotic | Comfort
Rarity: Common | Uncommon | Rare
SourceLocationIds: [string]
BaseAffinityDelta: int
StackSize: int
Tags: [string]
```

### 12-4. Species Preference Profile
```yaml
GiftTasteProfileId: string
LovedTags: [string]
LikedTags: [string]
NeutralTags: [string]
DislikedTags: [string]
HatedTags: [string]
Modifiers:
  SameGiftRepeatPenalty: float
  DailyCap: int
  SpecialBonusConditionTags: [string]
```

### 12-5. Initial Preference Examples
- Elf: flowers, herbs, glowing seeds, fragrant items
- Beastfolk: meat, mushrooms, warm cloth
- Merfolk: seaweed, shells, pearls, fish
- Slimeborn: slime-like items, mushrooms, mineral fluids
- Orc: meat, smoked meat
- Ogre: large food items, meat, root vegetables
- Centaur: carrots, apples, grains, meadow flowers

### 12-6. Gift Application Rules
- cannot be given to hostile red targets
- repeated use of the same gift on the same day has reduced efficiency
- food gifts can gain a bonus when the target is hungry
- some gifts may lose effectiveness during post-reproduction recovery windows
- the same rules apply between protagonists and non-protagonists

### 12-7. Gift UX
When dragging a gift over a target card, show one of the following target hints:

- Loves this
- Likes this
- Neutral
- Dislikes this
- Refuses

Text tooltip plus icon is recommended for the first version because it accelerates player learning.

---

## 13. Affinity System

### 13-1. Affinity Has Both Tier and Score
Affinity is not a flat number only.
It should have both tier and score.

```yaml
AffinityTier:
  0 = Stranger
  1 = Open
  2 = Warm
  3 = Bonded
  4 = MateEligible
  5 = Devoted
```

### 13-2. Affinity Runtime Fields
```yaml
OwnerEntityId: string
TargetEntityId: string
AffinityScore: int
AffinityTier: int
DailyInteractionsUsed: int
GiftCountToday: int
LastMeaningfulInteractionDay: int
BlockedReason: None | Hostile | Recovery | SpeciesRule | AgeRule
```

### 13-3. Affinity Growth Sources
- gifts
- location companion events
- combat support
- birth / care bonuses
- rare successful events

For the first version, gifts alone are sufficient as the core path.
However, the interaction-type enum should be prepared in advance for expansion.

### 13-4. Affinity Decay / Stagnation Sources
- starvation
- negative gifts
- long neglect
- friendly-fire or allied harm during combat
- repeated reproduction attempts that ignore recovery windows

### 13-5. Conditions to Unlock Reproduction
Affinity alone is not enough.
All of the following must be true:

- opposite sex
- both are adults
- both are alive
- neither is in hostile red state
- neither is currently locked
- minimum affinity tier reached
- species pairing rule allows the combination
- no recovery cooldown remains
- no active pregnancy is already in progress
- either the player explicitly initiates it or auto-behavior is allowed to do so

### 13-6. Design Rule
Affinity should not rise so quickly that reproduction becomes a one-click button.
The player should usually need at least 2-3 rounds of location and gift interaction before the first meaningful pairing.

---

## 14. Reproduction / Pregnancy / Birth System

### 14-1. Basic Reproduction Rules
- male-male pair: not allowed
- female-female pair: not allowed
- minors / non-adults: not allowed
- hostile red state: not allowed
- below affinity threshold: not allowed
- recovery or lock state: not allowed

### 14-2. Reproduction Resolution Outcomes
Starting reproduction should result in one of the following:

1. PairingLock begins
2. Pregnancy state is applied
3. Egg or Cocoon card is created
4. Failure occurs at low probability, resulting in a debuff or null result

### 14-3. Pairing Lock
Cards involved in reproduction receive a temporary locked state:

- cannot be dragged
- cannot join combat
- cannot be sent to locations
- gift intake may be limited
- must show a timer
- must change frame and icon state

### 14-4. Gestation Types
- LiveBirth: pregnancy state followed by birth
- Egg: separate egg card followed by hatching
- Cocoon: separate cocoon card followed by emergence

### 14-5. Reproduction Data Schema
```yaml
ReproductionRuleSetId: string
SpeciesPairKey: string
Allowed: bool
RequiredAffinityTier: int
PregnancyCarrierSex: Female
GestationType: LiveBirth | Egg | Cocoon
GestationDays: int
RecoveryDaysInitiator: int
RecoveryDaysReceiver: int
OffspringRollTableId: string
SpecialTraitBonusIds: [string]
```

### 14-6. Representation of Pregnancy / Egg / Cocoon
For the first implementation, all of these can be card-based or card-adjacent states.

- pregnancy: status icon on the parent card plus detail panel information
- egg: separate board card
- cocoon: separate board card

To reduce AI implementation difficulty, even `LiveBirth` can initially be represented through a helper state card, for example:
- `Pregnancy_EntityRefCard`

### 14-7. Birth Output Fields
When offspring is generated, it must receive:
- a new `EntityId`
- an auto-generated name
- parent references
- `GenerationIndex = max(parents) + 1`
- `OriginSpeciesId = offspring result`
- `CurrentSpeciesId = offspring result`
- initial `AgeStage = Infant`
- initial `TraitTags`
- `LineageRootId` inherited according to protagonist-root lineage rules

### 14-8. Growth Stages
- Infant
- Juvenile
- Adult

`Elder` can be omitted in the first version.
Infants and juveniles cannot reproduce, fight, or perform dangerous tasks.

---

## 15. Offspring Resolution Rules

### 15-1. Offspring Is Not Fully Random
Offspring outcome should be determined by a combination of:

- the two parent species
- parent trait tags
- optional location modifiers
- rare event modifiers
- generation modifiers
- purified lineage modifiers

### 15-2. Result Types
- pure result matching one parent
- dominant inheritance from one parent side
- hybrid-tag result
- rare mutation type
- special egg / cocoon variant

### 15-3. Offspring Roll Table Schema
```yaml
OffspringRollTableId: string
ParentSpeciesA: string
ParentSpeciesB: string
Entries:
  - ResultSpeciesId: string
    Weight: int
    AddedTraitTags: [string]
    ForbiddenIfMissingParentTags: [string]
```

### 15-4. Recommended Simplification for the First Version
Do not start with gene-stat simulation.
Use rule tables.

Examples:
- Human + Elf = Human 30 / Elf 30 / HalfElf 40
- Human + Orc = Human 20 / Orc 20 / HalfOrc 60
- Elf + Orc = Elf 15 / Orc 15 / WildHybrid 70

### 15-5. Example Trait Tag Pool
- Graceful
- Fierce
- Swift
- Hardy
- Fertile
- SeaTouched
- ForestBlessed
- SwampMarked
- GiantBlood
- PurifiedLine
- Gentle
- Wild

### 15-6. Rare Lineage Design Rule
Rare bloodlines should not be simple rare cards.
They should become genealogy goals.

Examples:
- second generation or later of a PurifiedLine branch
- simultaneous possession of `ForestBlessed` and `SeaTouched`
- simultaneous possession of `GiantBlood` and `Graceful`
- bonus outcomes when both parents reach `Devoted`

---

## 16. Auto-Behavior AI

### 16-1. Goal of Auto Behavior
The board should feel alive without the system playing the game in place of the player.

### 16-2. Who Uses Auto Behavior
- enabled by default only for non-protagonist adult entities
- disabled by default for protagonists
- optional protagonist auto mode can exist later as a settings feature

### 16-3. Auto Behavior States
```yaml
Idle
SeekFood
SeekGiftCandidate
Wander
EvaluateMate
MoveToMate
BreedingLocked
Recover
AvoidThreat
```

### 16-4. Auto Behavior Conditions
- severe hunger prioritizes food
- nearby hostile red threats cause avoidance or combat participation
- same-species / opposite-sex / adult / affinity-qualified targets can trigger `EvaluateMate`
- autonomous gift-giving AI may be omitted in the initial version
- autonomous reproduction should only happen when internal affinity reaches a threshold

### 16-5. Restrictions on Autonomous Reproduction
- no more than once per day per entity
- lower chance above board population soft cap
- disabled on cards explicitly locked by the player
- disabled with protagonists by default

### 16-6. Implementation Principle
No advanced pathfinding is necessary.
A simple slot, proximity, or board-distance heuristic is enough for a card-board game.

---

## 17. Name and Genealogy System

### 17-1. Names Are Part of Card Value
Without names, offspring and lineage accumulation lose emotional value.

### 17-2. Name Data
```yaml
NamePoolId: string
CultureTag: Human | Elf | Orc | Sea | Swamp | Mixed
MaleNames: [string]
FemaleNames: [string]
SurnameRules: Patrilineal | Matrilineal | Hybrid | None
```

### 17-3. Name Generation Rules
- pure species uses its own name pool
- hybrids use parent-dominance rules or a mixed pool
- duplicate names receive numeric suffixes or an epithet rule
- player-side manual rename can be deferred

### 17-4. Genealogy Data Model
```yaml
GenealogyNode:
  EntityId: string
  DisplayName: string
  SpeciesId: string
  Sex: string
  GenerationIndex: int
  FatherEntityId: string|null
  MotherEntityId: string|null
  ChildEntityIds: [string]
  TraitTags: [string]
  BirthDayIndex: int
  DeathDayIndex: int|null
  IsProtagonistLine: bool
```

### 17-5. Genealogy View Modes
Provide at least two modes:
- local genealogy centered on the selected card
- full root lineage tree

### 17-6. Genealogy UX Priorities
1. when a card is selected, show direct parents and direct children first
2. support generation-based expansion in the full screen
3. filters:
   - by species
   - by root line
   - purified bloodlines only
   - only nodes containing rare tags
   - living entities only

### 17-7. Difference Between Encyclopedia and Genealogy
- Encyclopedia: records unlocked species and hybrids
- Genealogy: records the real history of specific individuals

These must remain separate systems.

---

## 18. Combat System Integration

### 18-1. Purpose of Combat
Combat is not primarily for deletion.
It is the gate to purification and acquisition.

### 18-2. Policy for Reusing Existing RPS Combat
Use StackCraft's public RPS combat concept as-is where possible.
Only change the outcome handling to match this design.

Post-combat handling:
- victory: purification counter increases or purification begins immediately
- defeat: injury, escape, or death may occur
- draw: time is wasted or delayed

### 18-3. Combat Identity by Species
- Orc: aggressive, high combat strength
- Ogre: slow but durable
- Centaur: mobility and evasion emphasis

### 18-4. Optional Future Link Between Combat and Affinity
Potential extensions:
- rescued entities gain affinity toward the rescuer
- some species form affinity more easily toward strong fighters
- first interaction bonus after purification

---

## 19. Balance Design

### 19-1. Global Balance Targets
- first mutation appears within 5-10 minutes
- first purification becomes possible within 15-25 minutes
- first affinity unlock becomes possible within 20-30 minutes
- first reproduction becomes possible within 30-45 minutes
- seeds of a third generation should begin to appear within roughly 1 hour
- auto-ecology should become noticeable after about 45 minutes

### 19-2. Initial Numeric Guidelines

#### Location Assignment Time
- Forest: 20 sec
- RockyMountain: 25 sec
- Swamp: 28 sec
- Sea: 32 sec

#### Example Affinity Gain
- Loved gift: +20
- Liked gift: +12
- Neutral: +4
- Disliked: -6
- Hated: -12

#### Tier Thresholds
- Stranger -> Open: 20
- Open -> Warm: 50
- Warm -> Bonded: 90
- Bonded -> MateEligible: 140
- MateEligible -> Devoted: 220

#### Repetition Penalty
- same gift, second time: x0.75
- same gift, third time onward: x0.5

#### Reproduction Timing
- Pairing Lock: 15 sec
- LiveBirth Gestation: 2 days
- Egg Hatch: 2 days
- Cocoon Hatch: 3 days
- post-birth recovery: 1 day

### 19-3. Population Soft Cap
Initial board soft cap:
- free growth until 10 entities
- auto-reproduction chance reduced between 11-15 entities
- feeding pressure increases beyond 16 entities

### 19-4. Rare Outcome Control
Build rare hybrids through three axes:
- rarity of species combination
- rarity of trait-tag combination
- whether a purified bloodline is involved

---

## 20. Detailed UI/UX Design

### 20-1. Card Frame Rules
- default ally: standard frame
- hostile: red frame
- purifying: red afterglow plus purification icon
- breeding lock: lock icon
- pregnancy / egg / cocoon: state badge
- rare bloodline: corner ornament or glow effect

### 20-2. Expanded Card View
On zoom / inspect, show:
- art
- name
- species
- sex
- generation
- affinity summary
- preferred gifts
- parent / child summary
- mutation history
- trait tags
- state timer

### 20-3. Genealogy Screen Layout
Recommended layout: left filter panel, center tree, right node details.

Left filter panel:
- root lineage
- species
- generation range
- tags
- include purified bloodline or not
- alive only / all

Center area:
- generation-based columns
- parent-to-child connection lines
- card thumbnail display

Right panel:
- selected node detail
- highlight related entities
- `Select On Board` button

### 20-4. Location Card UX
Do not reveal full outcome tables on the card.
Only reveal:

- primary tags
- risk level
- likely gift categories
- likely species category
- occupancy state

### 20-5. High-Priority Feedback Events
The following must have immediate feedback:

- mutation occurred
- hostile appeared
- purification completed
- affinity tier increased
- birth or hatch completed

---

## 21. Art / Presentation Guide

### 21-1. Art Direction
- readability as a card game comes first
- species difference should be communicated first through silhouette and frame language
- finer visual detail belongs in zoom / inspect mode
- adult tone should be communicated through expression, pose, lighting, state icons, and relational context rather than explicit exposure in core card readability

### 21-2. Species Color Mood
- Human: neutral / beige / brown
- Elf: green / gold / silver
- Beastfolk: brown / ochre / forest tones
- Merfolk: teal / sky / pearl tones
- Slimeborn: purple / cyan / glossy slime highlights
- Orc: reddish brown / battle-worn markings
- Ogre: dark red-gray
- Centaur: red-brown / golden grassland mood

### 21-3. Adult Presentation Separation Principle
All adult-tone visuals should be separated into layers such as:

- BaseCardArt
- AffectionStateFX
- IntimacyPresentationLayer

Core gameplay only knows about `reproduction started`, `reproduction in progress`, `recovery`, and `relationship tier`.
Presentation responds to those events through a separate layer.

---

## 22. Sound / Emotional Presentation Guide

### 22-1. Location Assignment Sound Identity
- Forest: leaves and birds
- RockyMountain: wind and rolling stone
- Swamp: droplets and viscous texture sounds
- Sea: waves, shells, water rhythm

### 22-2. Relationship Progression Audio
- Loved gift: soft positive rise SFX
- affinity tier up: short harp or bell flourish
- purification complete: transition from dark resonance to brighter resolve tone

### 22-3. Birth / Hatch Audio
- live birth, egg hatch, and cocoon burst should each have distinct audio families
- emphasize the feeling of a new life / new lineage being added rather than excessive intensity

---

## 23. Save / Load Design

### 23-1. Mandatory Saved Data
- day index
- every living entity's `EntityId` and state
- board positions / stack states
- location occupancy states
- active timers
- affinity table
- full genealogy nodes
- name generation usage history
- encyclopedia unlock state
- settings values

### 23-2. Recommended Save Structure
```yaml
SaveGame:
  Meta:
    Version: string
    DayIndex: int
    Seed: int
  Entities: [...]
  Affinities: [...]
  GenealogyNodes: [...]
  ActiveProcesses: [...]
  Encyclopedia: [...]
  Settings: [...]
```

### 23-3. Migration Readiness Rules
As species and tags grow over time:
- prefer string ids over enum-only persistence
- use fallback profiles when ScriptableObjects are missing
- include version numbers in save data
- provide migration step tables

---

## 24. Recommended Technical Structure

### 24-1. Proposed Folder Structure
```text
Assets/
  Game/
    Core/
      Cards/
      DayCycle/
      Encounters/
      Saving/
    SpeciesSystem/
      Data/
      Runtime/
      UI/
      Tests/
    AffectionSystem/
      Data/
      Runtime/
      UI/
      Tests/
    ReproductionSystem/
      Data/
      Runtime/
      UI/
      Tests/
    PurificationSystem/
      Data/
      Runtime/
      UI/
      Tests/
    GenealogySystem/
      Data/
      Runtime/
      UI/
      Tests/
    LocationSystem/
      Data/
      Runtime/
      UI/
      Tests/
    Common/
      ScriptableObjects/
      Utilities/
      Debug/
```

### 24-2. Recommended Runtime Components
- CardEntityRuntime
- SpeciesRuntimeState
- GiftReceiverRuntime
- AffinityRuntimeState
- ReproductionRuntimeState
- PurificationRuntimeState
- AutoBehaviorRuntimeState
- GenealogyRuntimeState
- NameRuntimeState
- LocationVisitRuntimeState

### 24-3. Recommended Services
- SpeciesResolverService
- LocationMutationResolver
- AffinityService
- GiftEvaluationService
- ReproductionEligibilityService
- OffspringGeneratorService
- PurificationService
- GenealogyService
- NameGenerationService
- EncyclopediaService

### 24-4. Recommended Event Bus Events
```yaml
EntityMutated
HostileSpawned
HostilePurified
GiftGiven
AffinityTierChanged
BreedingStarted
BreedingCompleted
PregnancyStarted
EggCreated
CocoonCreated
OffspringBorn
GrowthStageChanged
EntityDied
GenealogyUpdated
```

---

## 25. Detailed ScriptableObject Schemas

### 25-1. SpeciesDataSO
```yaml
SpeciesId: string
DisplayName: string
FrameThemeId: string
BiomeAffinityMap:
  Forest: int
  RockyMountain: int
  Swamp: int
  Sea: int
GiftTasteProfileId: string
CombatArchetypeId: string
BaseStats:
  Vitality: int
  Appetite: int
  Combat: int
  Fertility: int
  Charm: int
ReproductionProfileId: string
TraitPoolIds: [string]
IsHostileDefault: bool
CanBePurified: bool
NamePoolId: string
EncyclopediaSortOrder: int
ArtKey: string
```

### 25-2. LocationDataSO
```yaml
LocationId: string
DisplayName: string
DurationSeconds: float
PrimaryDropTableId: string
SecondaryDropTableId: string
MutationRuleIds: [string]
EncounterRuleIds: [string]
AllowedInputSpeciesIds: [string]
RiskLevel: int
HintTextKey: string
ArtKey: string
```

### 25-3. GiftPreferenceProfileSO
```yaml
ProfileId: string
LovedTags: [string]
LikedTags: [string]
NeutralTags: [string]
DislikedTags: [string]
HatedTags: [string]
SameGiftRepeatPenaltyCurveId: string
DailyGiftCap: int
ContextualBonusRules: [string]
```

### 25-4. ReproductionRuleSetSO
```yaml
RuleSetId: string
SpeciesA: string
SpeciesB: string
Allowed: bool
RequiredAffinityTier: int
GestationType: string
GestationDays: int
RecoveryDaysA: int
RecoveryDaysB: int
OffspringRollTableId: string
SpecialTraitBonusIds: [string]
```

### 25-5. OffspringRollTableSO
```yaml
TableId: string
Entries:
  - ResultSpeciesId: string
    Weight: int
    AddedTraits: [string]
    RequiredParentTraits: [string]
    ForbiddenParentTraits: [string]
```

### 25-6. TraitTagDataSO
```yaml
TraitId: string
DisplayName: string
Rarity: Common | Rare | Epic
DescriptionKey: string
PassiveModifiers:
  Fertility: int
  Charm: int
  Combat: int
  Appetite: int
ArtBadgeKey: string
```

### 25-7. NamePoolSO
```yaml
NamePoolId: string
CultureTag: string
MaleNames: [string]
FemaleNames: [string]
FamilyNames: [string]
HybridPatterns: [string]
```

### 25-8. AffinityThresholdSO
```yaml
Thresholds:
  StrangerToOpen: int
  OpenToWarm: int
  WarmToBonded: int
  BondedToMateEligible: int
  MateEligibleToDevoted: int
```

---

## 26. Runtime State Machine Details

### 26-1. Location Visit State
```text
Idle
-> AssignedToLocation
-> TravelOrProcessing
-> ResolveOutcome
-> ReturnOrTransform
-> Cooldown(optional)
-> Idle
```

### 26-2. Purification State
```text
Hostile
-> CapturedOrDefeated
-> Purifying
-> PurifiedRecovery
-> Recruitable
```

### 26-3. Affection State
```text
NoRelation
-> Known
-> Open
-> Warm
-> Bonded
-> MateEligible
-> Devoted
```

### 26-4. Reproduction State
```text
Unavailable
-> Eligible
-> PairingLock
-> Gestation
-> BirthPending
-> Recovery
-> Eligible
```

### 26-5. Growth State
```text
Infant
-> Juvenile
-> Adult
-> Elder(optional)
```

### 26-6. Auto Behavior State
```text
Idle
-> SeekNeed
-> Move
-> Interact
-> Resolve
-> Cooldown
-> Idle
```

---

## 27. Initial Content Pack Design

### 27-1. Location Result Overview

#### Forest
Resources:
- Flower
- Herb
- Berry
- SoftMeat
- TwigCharm

Mutation:
- Human -> Elf
- Human -> Beastfolk

Hostile events:
- Hostile Orc Scout
- Forest Spirit Misfire (future)

#### RockyMountain
Resources:
- Stone
- Mushroom
- Carrot
- OreShard
- Apple

Mutation / events:
- Human -> Centaur (rare)
- Beastfolk -> Hardy variant

Hostile events:
- Hostile Centaur Raider
- Hostile Ogre Wanderer

#### Swamp
Resources:
- SlimeGel
- BogMushroom
- MarshMeat
- DarkHerb

Mutation:
- Human -> Slimeborn
- Beastfolk -> SwampMarked variant

Hostile events:
- Hostile Orc
- Toxin delay event

#### Sea
Resources:
- Fish
- Seaweed
- Shell
- Pearl
- SeaGlass

Mutation:
- Human -> Merfolk
- Elf -> SeaTouched variant (rare)

Hostile events:
- Tidal hazard
- Wild aquatic hostile (future)

### 27-2. Initial Gift Items
- Wild Flower
- Fragrant Herb
- Carrot
- Red Apple
- Smoked Meat
- Fresh Fish
- Seaweed Bundle
- Pearl Fragment
- Slime Gel
- Bog Mushroom
- Shiny Ore
- Soft Cloth

### 27-3. Initial Hybrid Set
- HalfElf
- HalfOrc
- TidebornHuman
- WildHybrid
- BogTouched
- PurifiedScion

### 27-4. Initial Rare Trait Set
- Graceful
- Fierce
- SeaTouched
- ForestBlessed
- PurifiedLine
- GiantBlood
- Swift
- Fertile
- Gentle
- Wild

---

## 28. Example Rule Tables

### 28-1. Example Gift Preference Table

| Gift Tag | Elf | Orc | Ogre | Centaur | Merfolk | Slimeborn |
|---|---:|---:|---:|---:|---:|---:|
| flower | +20 | -4 | -6 | +6 | +4 | 0 |
| herb | +16 | 0 | 0 | +4 | +6 | +2 |
| meat | 0 | +20 | +18 | +2 | +4 | +6 |
| carrot | +2 | 0 | +4 | +18 | 0 | 0 |
| fish | 0 | +4 | +2 | 0 | +18 | +4 |
| pearl | +4 | -2 | -2 | 0 | +20 | +2 |
| slime | -4 | +2 | +2 | -2 | +2 | +18 |
| mushroom | +4 | +8 | +6 | +2 | 0 | +14 |

### 28-2. Example Offspring Table

| Parent A | Parent B | Candidate Result | Weight |
|---|---|---|---:|
| Human | Elf | Human | 30 |
| Human | Elf | Elf | 30 |
| Human | Elf | HalfElf | 40 |
| Human | Orc | Human | 20 |
| Human | Orc | Orc | 20 |
| Human | Orc | HalfOrc | 60 |
| Elf | Merfolk | Elf | 25 |
| Elf | Merfolk | Merfolk | 25 |
| Elf | Merfolk | TidebornHuman | 50 |
| Orc | Ogre | Orc | 35 |
| Orc | Ogre | Ogre | 25 |
| Orc | Ogre | WildHybrid | 40 |

---

## 29. Balance Test Scenarios

### 29-1. Testing Goals
- verify that first species unlock is not too slow
- verify that first purification is not blocked
- verify that the affinity loop is not tedious
- verify that offspring value is noticeable
- verify that auto-ecology does not flood the board uncontrollably

### 29-2. Test Case List

#### Case_A_FirstMutation
- Can the player secure one non-human species within 10 minutes from start?

#### Case_B_FirstPurification
- Can the player purify one hostile species within 25 minutes from start?

#### Case_C_FirstMateEligible
- With the correct gift loop, can a target pair reach MateEligible within 30 minutes?

#### Case_D_FirstBirth
- Does the first offspring appear within 45 minutes?

#### Case_E_AutoEcologyNoise
- At the 60-minute mark, is board population still controllable?

#### Case_F_GenealogyPersistence
- After save and load, are lineage links preserved correctly?

---

## 30. Codex Implementation Strategy

### 30-1. Do Not Give Codex the Whole Game at Once
Bad prompts:
- `Implement the whole game.`
- `Build the full species system.`
- `Do the entire UI and gameplay.`

Good prompts:
- generate data structures
- implement one service
- implement one panel
- add one test case
- connect one event chain

### 30-2. Task Granularity Rules
One task should ideally stay within:

- 8 modified files or fewer
- 5 new classes or fewer
- at most one UI feature + one gameplay feature combined
- explicit acceptance criteria
- at least one test or debug verification path

### 30-3. Information Codex Needs Before Acting
- current project structure
- current naming conventions used by the asset
- where ScriptableObjects should be created
- how testing is run
- how play mode is entered
- which StackCraft systems are being extended or replaced
- which original areas must not be touched

### 30-4. Output Review Rules for Codex Deliverables
- 0 compile errors
- Unity enters play mode
- 0 new console errors, or only explicitly accepted ones
- no regression in previously working features
- at least one test or debug verification route exists

---

## 31. Unity MCP Usage Strategy

### 31-1. Minimum Useful Tool Set in Unity MCP
- search assets / search hierarchy
- open / select GameObject
- create / update script or asset
- run compilation check
- read console
- enter / exit play mode
- capture screenshot

### 31-2. Recommended Workflow
1. inspect project structure
2. find existing card / DayCycle-related classes
3. add data ScriptableObjects
4. add runtime services
5. add UI panels
6. run play mode
7. inspect console
8. verify through screenshots
9. patch issues revealed by logs or screenshots

### 31-3. Things MCP Is Good At
- understanding scene and hierarchy state
- wiring card prefabs
- arranging panels
- repeated play mode verification
- console-driven regression checks

### 31-4. Things That May Be Unstable Through MCP
- large-scale art production
- complex Animator setup
- project-specific custom editor logic
- wide refactors before the asset structure is fully understood

---

## 32. Draft `AGENTS.md`

The following is a recommended starter draft for the project root `AGENTS.md`.

```md
# AGENTS.md

## Mission
Implement the game as a small-scale card-based fantasy lineage simulation built on top of the existing StackCraft project structure.

## Priorities
1. Preserve existing StackCraft flow unless a task explicitly asks to replace it.
2. Prefer additive architecture over destructive rewrites.
3. Keep all gameplay logic data-driven.
4. Separate gameplay logic from presentation logic.
5. Keep adult presentation abstract and isolated from core systems.

## Mandatory architecture rules
- Species, affinity, purification, reproduction, genealogy, and location mutation must be separate systems.
- Every living entity card must have a stable persistent EntityId.
- All cross-system references should prefer string ids or serializable references.
- Avoid hardcoding per-species logic in monolithic switch statements when a data-driven table is viable.
- New features must be save/load safe.

## Working style
- For any task, first inspect the current project structure and identify the correct integration points.
- Make the smallest safe change that satisfies the task.
- After code changes, run a compile check and read Unity console logs.
- If the task affects gameplay state, provide either a unit test, editor test, or a debug verification path.
- If unsure about a project-specific type or method, inspect the repository first instead of inventing names.

## System boundaries
- Core logic must not depend on explicit adult scene assets.
- Presentation-specific visuals should be behind interfaces or clearly isolated layers.
- Genealogy data must persist across saves and scene reloads.
- Protagonist cards are special entities and should not be auto-bred by default.

## Preferred deliverables per task
- Summary of modified files
- What was implemented
- What assumptions were made
- How to test in Unity
- Any unresolved risks
```

---

## 33. Codex Task Backlog

### 33-1. Epic Structure
- Epic_A_LocationMutation
- Epic_B_HostilePurification
- Epic_C_GiftAffinity
- Epic_D_Reproduction
- Epic_E_Genealogy
- Epic_F_AutoEcology
- Epic_G_UXPanels
- Epic_H_SaveLoadIntegration

### 33-2. Detailed Tasks

#### Task_001_Audit_StackCraft_IntegrationPoints
Goal:
- locate and document card entity runtime, day cycle, encounter, save/load, and top-bar UI integration points in the current StackCraft project

Acceptance target:
- one markdown file listing integration points
- clear separation between safe extension classes and dangerous rewrite classes

#### Task_002_Create_Core_ID_And_Runtime_State
Goal:
- add the foundation that gives every living card a stable EntityId

Acceptance target:
- EntityId generation and persistence logic
- save integration point identified
- debug logging path available

#### Task_003_Create_SpeciesData_Assets_And_Enums
Goal:
- create SpeciesDataSO, NamePoolSO, and TraitTagDataSO

Acceptance target:
- initial data for 8 species can be authored in the editor
- ScriptableObject asset creation pipeline works

#### Task_004_Replace_TopBar_Boosters_With_LocationBar
Goal:
- replace or coexist with the original booster-pack top bar using a 4-slot Location Bar

Acceptance target:
- Forest / RockyMountain / Swamp / Sea appear in the top UI
- occupancy state and timer are visible

#### Task_005_Implement_Location_Assignment_And_Result_Resolution
Goal:
- drag an entity to a location, resolve its timer, then generate a result

Acceptance target:
- at least one location produces resource drops
- at least one location can trigger mutation
- no console errors

#### Task_006_Implement_Hostile_State_And_Purification_Flow
Goal:
- implement hostile red state and post-combat purification flow

Acceptance target:
- HostileRed -> Purifying -> Recruitable transitions work
- UI badge changes correctly

#### Task_007_Implement_Gift_Item_And_Preference_Evaluation
Goal:
- implement gift cards and species preference evaluation

Acceptance target:
- Loved / Liked / Neutral / Disliked / Hated classification works
- affinity delta is returned correctly

#### Task_008_Implement_Affinity_Runtime_And_Tiering
Goal:
- store pairwise affinity and compute tiers

Acceptance target:
- relation score persists between two EntityIds
- tier-change event fires correctly

#### Task_009_Implement_Card_Detail_Panel
Goal:
- show name, species, preferred gifts, affinity summary, and bloodline summary when selecting a card

Acceptance target:
- card detail panel works safely with selection and null cases

#### Task_010_Implement_Breeding_Eligibility_Validator
Goal:
- centralize mating eligibility checks in one service

Acceptance target:
- validates sex, adulthood, affinity, hostile state, recovery, and lock conditions
- returns failure-reason enum

#### Task_011_Implement_Breeding_Lock_And_Gestation
Goal:
- implement pairing lock, pregnancy, egg, and cocoon handling

Acceptance target:
- timers progress correctly
- completion links into offspring generation

#### Task_012_Implement_Offspring_Generator
Goal:
- implement offspring species and trait generation

Acceptance target:
- parent pairing tables are applied
- parent / child links are saved

#### Task_013_Implement_Name_Generation
Goal:
- generate names from name pools

Acceptance target:
- names follow pure / hybrid rules
- duplicate collisions are handled

#### Task_014_Implement_Genealogy_Database
Goal:
- implement genealogy node storage, update, and query system

Acceptance target:
- parent, child, and generation data can be tracked
- save/load persistence works

#### Task_015_Implement_Genealogy_Tree_Screen
Goal:
- implement the full genealogy screen

Acceptance target:
- root selection works
- generation view works
- selected node detail works

#### Task_016_Implement_NonProtagonist_AutoBehavior
Goal:
- implement baseline auto behavior for non-protagonists

Acceptance target:
- Idle / SeekFood / EvaluateMate / BreedingLock are minimally functional
- protagonist auto behavior remains disabled by default

#### Task_017_Implement_SaveLoad_Migration_Safety
Goal:
- integrate all new systems with save/load

Acceptance target:
- EntityId / genealogy / affinity survive save and reload
- version field exists

#### Task_018_Create_Balance_Debug_Panel
Goal:
- provide a debug panel for balance tuning

Acceptance target:
- location duration
- affinity deltas
- pregnancy length
- auto-breeding probability
can all be adjusted in editor or debug mode

---

## 34. Acceptance Criteria Template Per Task

Use this template for each Codex task.

```md
## Acceptance Criteria
- No compile errors.
- Unity enters play mode successfully.
- No new console errors after the feature is exercised once.
- The feature can be triggered through one explicit in-editor or in-game path.
- Data is serialized safely if the task affects persistent state.
- The task includes a short verification note.

## Verification
1. Open scene: ...
2. Press play.
3. Create/select ...
4. Perform action ...
5. Confirm expected UI/log/state ...

## Output format
- Modified files
- Summary
- Assumptions
- Verification steps
- Known limitations
```

---

## 35. Draft Codex Prompts

### 35-1. Integration Point Audit Prompt
```text
Inspect the current Unity project and identify the integration points for:
1) card entity runtime,
2) day cycle phases,
3) encounter spawning,
4) save/load,
5) top bar UI.

Do not modify code yet.
Return:
- the relevant files,
- why each file matters,
- the safest extension points,
- any risky areas that should not be rewritten.
```

### 35-2. Location Bar Prompt
```text
Implement a first-pass Location Bar that replaces or coexists with the existing booster-pack top bar.
Requirements:
- Show four fixed locations: Forest, RockyMountain, Swamp, Sea
- Each slot must display occupancy and a progress timer if active
- Integrate with existing card drag/drop flow if available
- Avoid breaking existing UI panels
- Provide a short verification guide after implementation
```

### 35-3. Affinity System Prompt
```text
Implement a data-driven affinity system between entity cards.
Requirements:
- stable relation record between two EntityIds
- score + tier
- configurable thresholds from data
- one public method to apply gift-based affinity delta
- return reason if relation update is blocked
- include at least one test or debug entry point
```

### 35-4. Genealogy System Prompt
```text
Implement a genealogy database that stores parent-child relationships for every offspring entity.
Requirements:
- persistent EntityId references
- generation index
- father/mother references
- child list
- save/load compatibility
- query methods for direct parents, direct children, and full lineage root
Do not build the full screen yet unless needed for verification.
```

---

## 36. Debug / Test Tool Design

### 36-1. Required Debug Buttons
- Spawn Human Male
- Spawn Human Female
- Force Location Result: Forest
- Force Hostile Orc
- Force Purify Selected
- Give Selected Gift: Flower
- Set Affinity Tier
- Force Breed Selected Pair
- Force Birth Complete
- Open Genealogy Window

### 36-2. Test Scene Composition
`Prototype_SpeciesLoop.unity`

Contains:
- 4-slot location bar
- minimal card board
- right detail panel
- debug panel
- optional console clear button

### 36-3. Play Mode Smoke Test
1. load scene
2. spawn human male and female
3. send one to Forest
4. obtain Elf or flower result
5. give flower as gift
6. confirm affinity increase
7. force or satisfy reproduction requirements
8. generate offspring
9. confirm genealogy entry
10. save and load, then verify persistence

---

## 37. Risks and Responses

### 37-1. Risk: Excessive Modification of Existing Asset Structure Causes Regressions
Response:
- run integration-point audit first
- minimize direct changes to original files
- prefer adapter / facade patterns

### 37-2. Risk: Species Exceptions Grow Into Hardcoded Chaos
Response:
- prioritize ScriptableObject-driven rule tables
- query data from service layers
- keep per-species custom classes extremely limited

### 37-3. Risk: Auto Behavior Makes the Board Messy and Noisy
Response:
- limit it to non-protagonists
- limit it to adults
- start with low probabilities
- enforce population soft caps and cooldowns

### 37-4. Risk: Genealogy Persistence Breaks
Response:
- EntityId must remain immutable
- create dedicated save/load tests
- separate responsibility of node creation from entity creation

### 37-5. Risk: Adult Presentation Becomes Coupled to Core Logic
Response:
- isolate it behind `IntimacyPresentationLayer`
- core systems know only states and events
- presentation subscribes to events

---

## 38. Follow-Up Expansion Roadmap

### 38-1. After Vertical Slice
- add Desert / Ruins / Volcano
- add more hostile species
- expand hybrid species catalog
- add encyclopedia rewards
- add event choices

### 38-2. Relationship Expansion
- non-gift interactions
- companion exploration
- jealousy and preference competition
- offspring growth influence from parents

### 38-3. Base Expansion
Out of current scope, but recommended later order:
- shelter
- nursery / egg storage
- genealogy exhibition space
- species-specific facilities

---

## 39. Priority Summary for Codex Reading This Document

1. Inspect the current StackCraft project structure first.
2. Implement EntityId and save-friendly entity state.
3. Create Species / Location / Gift / Affinity data assets.
4. Replace the top bar with the Location Bar.
5. Implement location result resolution and species mutation.
6. Implement hostile red purification flow.
7. Implement gifts and affinity.
8. Implement mating eligibility and pairing lock.
9. Implement offspring generation and genealogy.
10. Add auto-ecology and debug tools.
11. Add presentation layer work last.

---

## 40. Final Design Conclusion

The strongest direction for this project is clear.

- This is not a game about endlessly increasing card type count.
- It should focus on a small number of species and strong relationship loops.
- The human male and female protagonist cards create the emotional anchor.
- Location cards replace card packs and function as species-unlock devices.
- Hostile red species are not disposable enemies; they are future bloodline branches after purification.
- Gifts are not just resources spent; they are the core affinity puzzle.
- Reproduction is not immediate production; it is a system of requirements, time, locks, recovery, and lineage value.
- Genealogy is not a minor UI feature; it is one of the long-term goals of play.
- Adult tone should strengthen the loop from behind, without dominating the core implementation.
- When working with Codex and Unity MCP, small tasks, explicit acceptance criteria, and repeated verification loops matter more than large narrative descriptions.

From this document, the next two direct production outputs are:

A. `real AGENTS.md + task file set`
- task documents that can be dropped into the repository immediately

B. `balance sheets / drop tables / detailed species numbers`
- designer-facing numerical tuning documents

This English edition is intended to serve as the common parent document for both A and B.
