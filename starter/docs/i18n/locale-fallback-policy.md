# Locale Fallback Policy

## Resolution Order
1. Exact locale file (e.g., `ko`)
2. English default (`en`)
3. Base template (`prompts/system.base.md`)

## Rules
- Missing localized content must not block execution.
- Fallback path must be logged in report output.
- If fallback happens 3+ times for same file, create localization task.

## Example
Requested: `ja` prompt pack
- If `prompts/lang/ja/system.md` exists -> use it
- Else use `prompts/lang/en/system.md`
- Else use `prompts/system.base.md`
