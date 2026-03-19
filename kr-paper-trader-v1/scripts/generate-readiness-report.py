#!/usr/bin/env python3
import os
from pathlib import Path
from datetime import datetime

os.environ.setdefault("DATABASE_URL", "sqlite:///./readiness.db")
os.environ.setdefault("TZ", "Asia/Seoul")
os.environ.setdefault("ALLOW_INTERNAL_AI_GENERATE", "false")

import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / "apps/backend"))


def _fallback_body():
    return {
        "checklist": {},
        "done": 0,
        "total": 0,
        "percent": 0,
        "production_ready": False,
        "note": "fastapi deps not installed in current environment"
    }


def main():
    try:
        from fastapi.testclient import TestClient
        from app.main import app
        c = TestClient(app)
        r = c.get('/api/readiness')
        body = r.json() if r.status_code == 200 else {"error": r.text}
    except Exception as e:
        body = _fallback_body()
        body["error"] = str(e)

    out = Path(__file__).resolve().parents[1] / 'docs' / 'readiness-report.md'
    lines = [
        '# Readiness Report',
        '',
        f'- generated_at: {datetime.now().isoformat()}',
        f'- done: {body.get("done")}/{body.get("total")}',
        f'- percent: {body.get("percent")}',
        f'- production_ready: {body.get("production_ready")}',
        '',
        '## Checklist',
    ]
    for k, v in (body.get('checklist') or {}).items():
        lines.append(f'- {k}: {v}')

    out.write_text('\n'.join(lines), encoding='utf-8')
    print(str(out))


if __name__ == '__main__':
    main()
