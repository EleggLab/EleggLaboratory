# Narrative Release Gate

- pass: false
- healthScore: 1
- backlogCount: 1
- mode: mock
- config: config/narrative-release-gate.json (default)

## Checks
- opsPass: PASS (actual=true, expected=true)
- healthScore: PASS (actual=1, expected=>= 0.92)
- backlogCount: FAIL (actual=1, expected=<= 0)
- trendPass: PASS (actual=true, expected=true)

## Trend
- executed: true
- pass: true
- sampleCount: 8

## Ops Report
- source: C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory\pojet\reports\ai\narrative-ops-suite-20260312-203345-331.json

