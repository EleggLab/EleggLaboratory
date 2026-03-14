#!/usr/bin/env python3
import pathlib, re

ROOT = pathlib.Path('/home/sml/.openclaw/workspace')
CARDS = ROOT / 'research/github-wide/cards'
OUT = ROOT / 'research/github-wide/reports/starter-adoption-candidates.md'

rules = {
  'prompts': [r'prompt', r'system-prompts', r'prompt-engineering'],
  'scripts': [r'workflow', r'agent', r'cli', r'automation', r'mcp'],
  'checklists': [r'security', r'review', r'best-practice', r'testing'],
  'docs': [r'guide', r'course', r'for-beginners', r'roadmap', r'awesome'],
}

rows = []
for p in sorted(CARDS.glob('*.md')):
  txt = p.read_text(encoding='utf-8', errors='ignore').lower()
  score = {k:0 for k in rules}
  for k, pats in rules.items():
    score[k] = sum(1 for pt in pats if re.search(pt, txt))
  total = sum(score.values())
  if total < 2:
    continue
  title = p.stem.replace('__','/')
  dominant = max(score, key=lambda k: score[k])
  rows.append((total, dominant, title, p.name, score))

rows.sort(key=lambda x:(x[0], x[2]), reverse=True)

lines = ['# Starter Adoption Candidates', '', f'total: {len(rows)}', '']
for i,(total,dom,title,fn,score) in enumerate(rows[:120],1):
  lines.append(f"{i}. {title} · area={dom} · score={total}")
  lines.append(f"   - breakdown: prompts={score['prompts']} scripts={score['scripts']} checklists={score['checklists']} docs={score['docs']}")
  lines.append(f"   - card: `research/github-wide/cards/{fn}`")

OUT.write_text('\n'.join(lines), encoding='utf-8')
print(str(OUT))
