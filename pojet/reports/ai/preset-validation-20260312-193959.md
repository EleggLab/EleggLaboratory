# Preset Validation Report

- total: 3
- valid: 2
- invalid: 1
- warned: 2

## preset-registry.json
- ok: false
- errors: missing id; missing name; missing systemPrompt; missing userPrompt
- warnings: prompt too short (<120 chars)
- metrics: system=0, user=0, tags=0

## risu-극작가-하이파-v1-0.json
- ok: true
- warnings: contains hard output schema directive
- metrics: system=116, user=494, tags=2

## story-core-balanced.json
- ok: true
- metrics: system=186, user=150, tags=4

