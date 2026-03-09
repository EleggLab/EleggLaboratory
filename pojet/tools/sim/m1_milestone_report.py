#!/usr/bin/env python3
import json, sys
from datetime import datetime, timezone


def s(v):
    return f"{v:.2f}" if isinstance(v, (int, float)) else str(v)


def status(actual, lo, hi):
    if actual < lo:
        return "fail", f"below min ({actual:.2f} < {lo})"
    if actual > hi:
        return "fail", f"above max ({actual:.2f} > {hi})"
    return "pass", "within range"


def main(path, out):
    data = json.load(open(path, encoding="utf-8"))
    m = data.get("metrics", {})
    pacing = m.get("pacing", {})
    totals = m.get("totals", {})

    checks = []
    checks.append(("Run duration (min)", pacing.get("avgRunDurationMinutes", 0), 18, 55))
    checks.append(("Early death rate", totals.get("earlyDeathRate", 0), 0.05, 0.30))
    checks.append(("T2 per run", pacing.get("avgT2PerRun", 0), 2.5, 6.5))
    checks.append(("T3 per run", pacing.get("avgT3PerRun", 0), 0.8, 3.0))
    checks.append(("First level-up (min)", pacing.get("avgFirstLevelupTicks", 0) * 0.5, 4, 16))

    lines = [
        "# M1 Milestone Dashboard",
        "",
        f"- Generated: {datetime.now(timezone.utc).isoformat()}",
        f"- Runs: {totals.get('runs', 0)}",
        f"- Survival rate: {totals.get('survivalRate', 0):.2%}",
        f"- Avg run duration: {pacing.get('avgRunDurationMinutes', 0):.2f} min",
        f"- Avg T2/T3 per run: {pacing.get('avgT2PerRun', 0):.2f} / {pacing.get('avgT3PerRun', 0):.2f}",
        "",
        "## Gate checks",
        "",
    ]

    pass_count = 0
    for name, actual, lo, hi in checks:
        st, reason = status(float(actual), lo, hi)
        if st == "pass":
            pass_count += 1
        lines.append(f"- [{st.upper()}] {name}: {actual:.2f} (target {lo}~{hi}) — {reason}")

    lines += [
        "",
        "## Interpretation",
        "",
    ]

    if pass_count == len(checks):
        lines.append("- M1 pacing gate passed. Proceed to M2 narrative density work.")
    else:
        lines.append("- M1 pacing gate not fully passed. Tune survivability and event cadence first.")
        if pacing.get("avgRunDurationMinutes", 0) < 18:
            lines.append("- Priority: increase survivability or reduce burst damage to extend run length.")
        if totals.get("earlyDeathRate", 0) > 0.30:
            lines.append("- Priority: lower early spike damage and ensure first meaningful choice appears before death.")

    open(out, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(out)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: m1_milestone_report.py <simulation.json> <out.md>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
