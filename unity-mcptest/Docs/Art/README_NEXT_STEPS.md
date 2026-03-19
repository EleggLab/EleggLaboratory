# Art Next Steps

The previous generated art experiments were cleared from the working folder.

If needed later, they were moved out of the active path to:

- `C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory\unity-mcptest\.trash\art_cleanup_20260317_1545`

## What to do now

1. Put the images you personally like into:
   - `Docs/Art/SelectedForExpansion`
2. Keep the image filename as the prompt title you want to reuse.
3. When ready, build a new manifest from those filenames with:

```powershell
python C:\Users\rndhr\mcptest\Tools\build_selected_prompt_manifest.py `
  --input-dir C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory\unity-mcptest\Docs\Art\SelectedForExpansion `
  --output C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory\unity-mcptest\Docs\Art\selected_prompt_manifest.json
```

## Notes

- By default, the script uses the filename stem as the prompt exactly as-is.
- If you rename files with underscores and want them converted to spaces, add:

```powershell
--replace-underscores
```

- I will use the resulting manifest and the chosen files as the base for the next generation pass.
