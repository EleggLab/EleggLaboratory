#!/usr/bin/env python3
import os
from pathlib import Path
from datetime import datetime

os.environ.setdefault("DATABASE_URL", "sqlite:///./readiness.db")
os.environ.setdefault("TZ", "Asia/Seoul")
os.environ.setdefault("ALLOW_INTERNAL_AI_GENERATE", "false")

import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / "apps/backend"))


def _fallback_body(base_dir: Path):
    # fallback: derive rough progress from docs/test-scenarios-checklist.md
    checklist_path = base_dir / 'docs' / 'test-scenarios-checklist.md'
    done = total = 0
    if checklist_path.exists():
        for ln in checklist_path.read_text(encoding='utf-8').splitlines():
            if ln[:2].strip().rstrip('.') in {str(i) for i in range(1, 21)} or (ln and ln[0].isdigit() and '. ' in ln):
                if '✅' in ln or '⚠️' in ln:
                    total += 1
                    if '✅' in ln:
                        done += 1
    percent = round(done / total * 100, 1) if total else 0
    return {
        "checklist": {},
        "done": done,
        "total": total,
        "percent": percent,
        "production_ready": False,
        "note": "fallback mode (fastapi deps missing); using docs checklist"
    }


def main():
    base_dir = Path(__file__).resolve().parents[1]
    try:
        from fastapi.testclient import TestClient
        from app.main import app
        c = TestClient(app)
        r = c.get('/api/readiness')
        body = r.json() if r.status_code == 200 else {"error": r.text}
    except Exception as e:
        body = _fallback_body(base_dir)
        body["error"] = str(e)

    out = base_dir / 'docs' / 'readiness-report.md'
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
