#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f infra/docker-compose.yml run --rm backend python -m pytest -q /app/tests/backend
