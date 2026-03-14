#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=${1:-my-vibe-project}
TARGET_DIR=${2:-"$(pwd)/$PROJECT_NAME"}

mkdir -p "$TARGET_DIR"/{src,tests,docs,scripts,.github/workflows}

cat > "$TARGET_DIR/README.md" <<'EOF'
# Project

## Quick Start
1. Copy `.env.example` to `.env`
2. Run your install command
3. Use `./scripts/verify.sh` before commit
EOF

cat > "$TARGET_DIR/.env.example" <<'EOF'
# App
APP_NAME=my-vibe-project
APP_ENV=dev

# Optional API keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
EOF

cat > "$TARGET_DIR/.gitignore" <<'EOF'
.env
node_modules/
.dist/
coverage/
__pycache__/
EOF

cat > "$TARGET_DIR/docs/PRD.md" <<'EOF'
# PRD
- Problem:
- User:
- Success Metrics:
- Scope(In):
- Scope(Out):
EOF

cat > "$TARGET_DIR/docs/ADR-0001.md" <<'EOF'
# ADR-0001
- Context:
- Decision:
- Consequences:
EOF

cat > "$TARGET_DIR/scripts/verify.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "[verify] basic checks"
[ -f README.md ] || { echo "README.md missing"; exit 1; }
[ -f .env.example ] || { echo ".env.example missing"; exit 1; }
[ -d src ] || { echo "src/ missing"; exit 1; }
[ -d tests ] || { echo "tests/ missing"; exit 1; }

echo "[verify] done"
EOF
chmod +x "$TARGET_DIR/scripts/verify.sh"

cat > "$TARGET_DIR/scripts/report.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "# Change Report"
echo
echo "## Branch"
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(no git repo)"
echo
echo "## Changed Files"
git status --short 2>/dev/null || echo "(no git repo)"
echo
echo "## Last Commit"
git log -1 --pretty=format:'%h %s (%an, %ar)' 2>/dev/null || echo "(no commit yet)"
EOF
chmod +x "$TARGET_DIR/scripts/report.sh"

cat > "$TARGET_DIR/.github/workflows/verify.yml" <<'EOF'
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify structure
        run: bash scripts/verify.sh
EOF

echo "Bootstrapped at: $TARGET_DIR"
