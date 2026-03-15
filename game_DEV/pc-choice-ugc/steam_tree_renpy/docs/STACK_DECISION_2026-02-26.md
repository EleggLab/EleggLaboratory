# Stack Decision (2026-02-26)

## Goal

Rebuild `pc-choice-ugc` into a PC Steam-ready UGC pipeline with:

- simpler authoring model
- fast content iteration
- stable desktop packaging

## Candidates

### 1) Flutter desktop

Pros:
- strong UI productivity
- one codebase with modern widgets

Cons for this project:
- visual-novel narrative runtime/editor workflow must be custom-built from scratch
- Steam packaging is possible but narrative toolchain overhead remains higher than dedicated VN frameworks

Source:
- https://docs.flutter.dev/platform-integration/desktop

### 2) Go desktop (Ebitengine)

Pros:
- high performance runtime
- explicit game loop control

Cons for this project:
- most narrative tooling, localization flow, save/rollback UX must be built from zero
- slower UGC authoring cycle for story-heavy content

Source:
- https://ebitengine.org/

### 3) Python + Ren'Py

Pros:
- purpose-built for branching narrative and VN UX
- built-in script/language/screen pipeline suitable for UGC packs
- proven desktop distribution flow and direct fit for Steam VN-style products

Cons:
- custom real-time systems are limited compared to full game engines

Sources:
- https://www.renpy.org/doc/html/quickstart.html
- https://www.renpy.org/doc/html/tutorial.html
- https://www.renpy.org/doc/html/distributions.html
- https://www.renpy.org/doc/html/screens.html

## Decision

**Choose Python + Ren'Py** for the UGC Steam track.

Reason:
- fastest delivery for choice-based narrative games
- lower operations cost for writers/designers
- easier to enforce a single-tree content contract and automate validation

## Architecture chosen

- Content model: `single-tree JSON`
- Tools: Python validators/converters/build scripts
- Runtime: Ren'Py screens + JSON-driven scene flow
- Assets: subculture UI from local packs with fallback-safe rendering
