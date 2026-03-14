#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
npm link

echo "Installed globally: vibe-starter"
echo "Try: vibe-starter init webapp my-app"
