#!/usr/bin/env python3
import pathlib, re

ROOT = pathlib.Path('/home/sml/.openclaw/workspace')
CAND = ROOT / 'research/github-wide/reports/starter-adoption-candidates.md'
OUT = ROOT / 'starter/backlog.md'

if not CAND.exists():
    raise SystemExit(f'missing: {CAND}')

lines = CAND.read_text(encoding='utf-8').splitlines()
rows = []
for ln in lines:
    m = re.match(r'^\d+\.\s+(.+?)\s+·\s+area=(\w+)\s+·\s+score=(\d+)', ln.strip())
    if m:
        rows.append({'repo': m.group(1), 'area': m.group(2), 'score': int(m.group(3))})

# pick top N per area
N = 10
picked = []
for area in ['prompts','scripts','checklists','docs']:
    part = [r for r in rows if r['area']==area]
    picked.extend(part[:N])

out = ['# Starter Adoption Backlog', '', '기반: research/github-wide/reports/starter-adoption-candidates.md', '', '## 원칙', '- 점수 높은 카드부터, 작은 변경으로 빠르게 흡수', '- 각 항목은 1커밋 단위로 반영', '- 반영 후 verify/report 실행 필수', '']
for area in ['prompts','scripts','checklists','docs']:
    out.append(f'## {area.upper()}')
    i = 1
    for r in picked:
        if r['area'] != area: continue
        target = {
            'prompts':'starter/prompts/reference/',
            'scripts':'starter/scripts/',
            'checklists':'starter/checklists/',
            'docs':'starter/docs/'
        }[area]
        out.append(f'- [ ] ({r["score"]}) {r["repo"]}')
        out.append(f'  - target: `{target}`')
        out.append(f'  - action: 패턴 추출 → 템플릿화 → 검증')
        i += 1
    out.append('')

OUT.write_text('\n'.join(out), encoding='utf-8')
print(OUT)
