# 60sec Choice Game UGC (PC)

This folder contains two tracks:

1) Legacy web editor (React/Vite + ReactFlow)
2) New Steam-focused rebuild pipeline (Python + Ren'Py) at `steam_tree_renpy/`

## Why a rebuild track?

The legacy graph editor is flexible but too complex for fast UGC operations.
The new track uses a single-tree content model:

- one trunk (`root`)
- branch by choices
- no arbitrary graph loops by default

This is easier to author, validate, localize, and ship on Steam.

## Legacy web editor run

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5200` (when launched via workspace controller).

## Local Tool Policy

- This tool runs locally and does not publish user-created content from our server.
- We do not ship adult/default explicit asset packs.
- If a user distributes content made with this tool, legal and platform responsibility belongs to the publishing user.
- Therefore, built-in age-gate/label/moderation checklists are not enforced by this app.

## New Steam rebuild track

Read:

- `steam_tree_renpy/README.md`
- `steam_tree_renpy/docs/STACK_DECISION_2026-02-26.md`
