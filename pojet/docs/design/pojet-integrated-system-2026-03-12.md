# Pojet Integrated System (1-Log 1-Choice)

Author: Manus AI draft (user-provided), integrated by workspace automation  
Date: 2026-03-12

## 1. Core Direction

- Genre: dark fantasy text RPG
- Core loop: `1 log -> 1 choice -> immediate consequence`
- Interface: chat-like storytelling with persistent status panel
- Target feel: long-form narrative, meaningful branching, replayable routes

## 2. Runtime Rules (Applied)

- A decision event is opened every progression beat (`1-log 1-choice` rhythm).
- T2 is handled as manual choice first (`ask` policy).
- T3 remains a heavy branch and appears less frequently.
- Choice resolution immediately updates:
  - character/resources
  - relation/faction vectors
  - chronicle/history entries

## 3. Character Framework

- Character setup dimensions:
  - difficulty
  - lineage/race
  - class
  - background
  - starting line
- Stat groups:
  - core stats (STR/DEX/CON/INT/WIS/CHA)
  - special progression stats (experience/lust/arousal/aura-style extensions)

## 4. Branching Model

- Tier structure:
  - `T1`: ambient progression beats
  - `T2`: medium branch, manual decision-centric
  - `T3`: major branch, run-shaping impact
- Consequences are layered:
  - immediate reward/cost
  - medium relation/faction shifts
  - long-term route and ending pressure

## 5. Narrative Output Contract

- Each log should include:
  - scene context
  - actor tension
  - consequence pressure
  - follow-up hook
- Choice card should expose:
  - clear intent
  - risk/reward identity
  - direct stat/system effects

## 6. UI/UX Notes

- Story panel is primary.
- Choice panel appears after each log.
- Status panel is always visible:
  - core/special stats
  - location/time
  - active route pressure
- History panel stores opened/resolved events for post-run traceability.

## 7. Content Production Guidance

- Keep writing style consistent per arc and faction.
- Maintain choice readability and effect clarity.
- Prefer branch diversity over option count inflation.
- Ensure every major route has:
  - unique midpoint pressure
  - distinct climax decision
  - differentiated ending outcome

## 8. Implementation Mapping

Current code mapping (as of 2026-03-12):

- Event dispatch and branching: `src/events/eventDispatcher.js`
- Progression loop and choice application: `runtime/loop/autoProgressionController.js`
- Narrative log synthesis: `src/narrative/narrativeEngine.js`
- Narrative context/causality packet:
  - `src/narrative/contextPacketBuilder.js`
  - `src/narrative/causalNotesGenerator.js`

This file is the condensed execution spec used to align the runtime with the user-provided integrated design.

