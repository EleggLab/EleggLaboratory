# steam_tree_renpy

Steam-focused UGC rebuild track for the PC choice game.

## Decision summary

- Selected stack: **Python + Ren'Py**
- Reason: fastest path for visual-novel style UGC, stable desktop distribution, low authoring overhead

See `docs/STACK_DECISION_2026-02-26.md` for source-backed comparison.

## Target workflow

1. Author story in `content/story_tree.json` (single-tree model)
2. Validate and package content:

```powershell
python tools/validate_tree.py content/story_tree.json
python tools/build_renpy_story.py --source content/story_tree.json --target project/game/ugc/story_tree.json
```

3. (Optional) Convert old ReactFlow JSON export to tree JSON:

```powershell
python tools/convert_reactflow_to_tree.py --input ..\src\sample_export.json --output content\story_tree.json
```

4. Open Ren'Py SDK and point project path to `steam_tree_renpy/project`

## Why single-tree model?

The old node graph is powerful but hard to maintain at scale. The new model enforces:

- one start node
- one parent per node (except root)
- explicit choice-based branches
- no hidden cycles by default

This reduces editor complexity and helps narrative QA.

## UI assets (subculture-focused)

The project currently uses imported assets from `Asset/DatingGameUI/Exports`:

- `project/game/gui/ugc/dialogue_container.png`
- `project/game/gui/ugc/choice_button.png`
- `project/game/gui/ugc/choice_button_pressed.png`
- `project/game/gui/ugc/primary_button.png`
- `project/game/gui/ugc/primary_button_pressed.png`
- `project/game/gui/ugc/menu_background.png`

If assets are missing, UI falls back to Ren'Py native colors/styles (no crash).
