# Python Steam UGC Launcher

Python wrapper for the **full original** UGC project (`pc-choice-ugc`).

This keeps:
- original template data
- original gameplay/editor features
- original import/export structure

and runs it through a Python entrypoint for Steam packaging.

## What changed

- Node editor UI is now skinned with assets from:
  - `Asset/DatingGameUI/Exports/*`
- Added `flag` node type support in editor/game flow.
- Added Python full launcher:
  - `launch_full_ugc.py`

## Run (recommended)

```powershell
cd ugc-python-steam
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python launch_full_ugc.py
```

Or:

```powershell
run_full_ugc.cmd
```

## Launcher behavior

- Uses `pc-choice-ugc` as source project.
- Builds web app if needed.
- Copies built dist to `ugc-python-steam/web_dist`.
- Starts local server and opens:
  - embedded `pywebview` window if installed
  - otherwise default browser

## Local Tool Policy

- This launcher is local-only and does not auto-publish user projects.
- Default bundled assets do not include explicit adult content.
- If a user uploads/distributes created content, legal and platform responsibility belongs to the publishing user.
- This app does not enforce built-in age-gate/label moderation checklists.

## Steam build

```powershell
cd ugc-python-steam
.\build_steam.ps1
```

Output:

- `dist/UGCStudio/UGCStudio.exe`

## Files

- `launch_full_ugc.py`: full-feature launcher
- `run_full_ugc.cmd`: one-click run
- `build_steam.ps1`: Steam exe build script
- `assets/ui/*`: reused VN style UI assets
