#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/sml/.openclaw/workspace"
DRY_RUN=0
RETRY=1
LOG_LEVEL="info"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --retry) RETRY="${2:-1}"; shift 2 ;;
    --log-level) LOG_LEVEL="${2:-info}"; shift 2 ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

log(){
  local level="$1"; shift
  if [[ "$LOG_LEVEL" == "debug" || "$level" != "debug" ]]; then
    echo "[$level] $*"
  fi
}

run_step(){
  local cmd="$1"
  local n=0
  while true; do
    n=$((n+1))
    if [[ "$DRY_RUN" -eq 1 ]]; then
      log info "DRY-RUN: $cmd"
      return 0
    fi
    if eval "$cmd"; then
      log info "ok: $cmd"
      return 0
    fi
    if [[ "$n" -gt "$RETRY" ]]; then
      log info "failed after $RETRY retries: $cmd"
      return 1
    fi
    log info "retry($n/$RETRY): $cmd"
    sleep 1
  done
}

cd "$ROOT"
run_step "python3 starter/scripts/research-github.py"
run_step "python3 starter/scripts/research-github-deep.py"
run_step "python3 starter/scripts/triage-research-cards.py"
run_step "python3 starter/scripts/apply-adoption-batch.py"
run_step "bash starter/scripts/report.sh starter/starter-report.md"

log info "research refresh complete"
