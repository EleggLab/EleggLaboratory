# Narrative Trend Monitor

- executed: true
- pass: true
- records: 8

## Checks
- passRate: PASS (actual=0.75, expected=>= 0.75)
- latestHealth: PASS (actual=1, expected=>= 0.8)
- healthDrop: PASS (actual=0, expected=<= 0.15)
- healthSlope: PASS (actual=0.004363, expected=>= -0.03)
- canaryFailRate: PASS (actual=0, expected=<= 0.4)
- avgBacklog: PASS (actual=0.625, expected=<= 4)
- avgP0Backlog: PASS (actual=0.625, expected=<= 1)

## Metrics
- sampleCount: 8
- passRate: 0.75
- latestHealth: 1
- firstHealth: 1
- healthDelta: 0
- healthSlope: 0.004363
- healthVolatility: 0.0355
- avgBacklog: 0.625
- avgP0Backlog: 0.625
- canarySamples: 8
- canaryFailRate: 0

