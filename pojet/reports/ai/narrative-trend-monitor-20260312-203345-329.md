# Narrative Trend Monitor

- executed: true
- pass: true
- records: 8

## Checks
- passRate: PASS (actual=1, expected=>= 0.75)
- latestHealth: PASS (actual=1, expected=>= 0.8)
- healthDrop: PASS (actual=-0.0733, expected=<= 0.15)
- healthSlope: PASS (actual=0.013089, expected=>= -0.03)
- canaryFailRate: PASS (actual=0, expected=<= 0.4)
- avgBacklog: PASS (actual=0.375, expected=<= 4)
- avgP0Backlog: PASS (actual=0.375, expected=<= 1)

## Metrics
- sampleCount: 8
- passRate: 1
- latestHealth: 1
- firstHealth: 0.9267
- healthDelta: 0.0733
- healthSlope: 0.013089
- healthVolatility: 0.0355
- avgBacklog: 0.375
- avgP0Backlog: 0.375
- canarySamples: 8
- canaryFailRate: 0

