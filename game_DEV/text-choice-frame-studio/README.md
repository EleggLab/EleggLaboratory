# Text Choice Studio

This folder contains a small authoring frame for choice-based text episodes.

The tool keeps the shape intentionally small:

- `Project`
- `Node List`
- `Story Map`
- `Scene Editor`
- `Route Console`
- `Playtest`
- `Import JSON`
- `Export JSON`

`New Project` always loads the same seven-beat template:

1. Intro
2. Incident
3. Clue
4. Pressure
5. Decision
6. Ending A
7. Ending B

## Minimal JSON Shape

```json
{
  "version": 1,
  "meta": {
    "title": "Project Title",
    "author": "Writer Name",
    "premise": "One-line setup",
    "start_node_id": "intro"
  },
  "nodes": [
    {
      "id": "intro",
      "kind": "scene",
      "title": "Intro",
      "speaker": "",
      "text": "",
      "writer_note": "",
      "next": "incident",
      "choices": []
    }
  ]
}
```

Each choice uses only:

```json
{
  "id": "choice-1",
  "text": "Choice text",
  "writer_note": "Writer note",
  "next": "target-node-id"
}
```

Extra legacy fields are ignored on import and dropped again on export.

## Run

```powershell
cd game_DEV/text-choice-frame-studio
python -m http.server 8014
```

Open `http://127.0.0.1:8014`.

## 30-Pass Logs

- `docs/2026-03-30-sequential-research-protocol.md`
- `docs/2026-03-30-game-30pass.md`
- `docs/2026-03-30-features-content-30pass.md`
- `docs/2026-03-30-ui-30pass.md`
