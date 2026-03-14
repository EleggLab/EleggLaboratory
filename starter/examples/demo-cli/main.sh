#!/usr/bin/env bash
set -euo pipefail
cmd=${1:-help}
shift || true
case "$cmd" in
  hello) echo "hello $*" ;;
  version) echo "0.1.0" ;;
  *) echo "usage: $0 {hello|version}" ;;
esac
