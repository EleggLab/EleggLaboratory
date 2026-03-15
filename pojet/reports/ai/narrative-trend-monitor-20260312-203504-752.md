# Narrative Trend Monitor

- executed: true
- pass: true
- records: 8

## Checks
- passRate: PASS (actual=1, expected=>= 0.75)
- latestHealth: PASS (actual=1, expected=>= 0.8)
- healthDrop: PASS (actual=-0.0733, expected=<= 0.15)
- healthSlope: PASS (actual=0.006108, expected=>= -0.03)
- canaryFailRate: PASS (actual=0, expected=<= 0.4)
- avgBacklog: PASS (actual=0.25, expected=<= 4)
- avgP0Backlog: PASS (actual=0.125, expected=<= 1)

## Metrics
- sampleCount: 8
- passRate: 1
- latestHealth: 1
- firstHealth: 0.9267
- healthDelta: 0.0733
- healthSlope: 0.006108
- healthVolatility: 0.0242
- avgBacklog: 0.25
- avgP0Backlog: 0.125
- canarySamples: 7
- canaryFailRate: 0

