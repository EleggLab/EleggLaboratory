#!/usr/bin/env python3
import json, os, time, requests, pathlib

ROOT = pathlib.Path('/home/sml/.openclaw/workspace')
OUT_RAW = ROOT / 'research/github-wide/raw'
OUT_REPORTS = ROOT / 'research/github-wide/reports'
OUT_CARDS = ROOT / 'research/github-wide/cards'
for p in [OUT_RAW, OUT_REPORTS, OUT_CARDS]:
    p.mkdir(parents=True, exist_ok=True)

queries = [
    ('agent workflow', 'ai coding agent workflow in:name,description,readme stars:>30'),
    ('prompt engineering', 'prompt engineering code generation in:name,description,readme stars:>50'),
    ('context engineering', 'context engineering ai coding in:name,description,readme stars:>20'),
    ('mcp', 'mcp server ai in:name,description,readme stars:>20'),
    ('vibe coding', 'vibe coding in:name,description,readme stars:>20'),
    ('autonomous coding', 'autonomous coding assistant in:name,description,readme stars:>20'),
    ('code review ai', 'ai code review in:name,description,readme stars:>20'),
    ('testing ai', 'ai testing automation in:name,description,readme stars:>20'),
    ('dev productivity', 'developer productivity ai in:name,description,readme stars:>20'),
    ('multilingual docs', 'multilingual developer docs in:name,description,readme stars:>20'),
    ('한국어', '바이브 코딩 in:name,description,readme stars:>5'),
    ('日本語', 'バイブコーディング in:name,description,readme stars:>5'),
    ('中文', 'vibe coding 中文 in:name,description,readme stars:>5'),
    ('Español', 'programación con IA in:name,description,readme stars:>5'),
    ('Português', 'programação com IA in:name,description,readme stars:>5'),
    ('العربية', 'البرمجة بالذكاء الاصطناعي in:name,description,readme stars:>5'),
]

headers = {'Accept':'application/vnd.github+json','User-Agent':'openclaw-vibe-research'}
base='https://api.github.com/search/repositories'

all_items = {}
report_lines = ['# GitHub 광범위 리서치 리포트', '', f'generated: {time.strftime("%Y-%m-%d %H:%M:%S %Z")}', '']

for label, q in queries:
    report_lines += [f'## {label}', f'- query: `{q}`']
    kept = 0
    for page in [1,2]:
        r = requests.get(base, params={'q':q,'sort':'stars','order':'desc','per_page':50,'page':page}, headers=headers, timeout=30)
        if r.status_code != 200:
            report_lines.append(f'- page {page}: HTTP {r.status_code}')
            break
        data = r.json()
        items = data.get('items',[])
        report_lines.append(f'- page {page}: {len(items)} items')
        for it in items:
            full = it.get('full_name')
            if not full:
                continue
            prev = all_items.get(full)
            entry = {
                'full_name': full,
                'url': it.get('html_url'),
                'description': (it.get('description') or '').strip(),
                'stars': int(it.get('stargazers_count',0)),
                'language': it.get('language') or '-',
                'topics': it.get('topics') or [],
                'labels': sorted(set((prev.get('labels',[]) if prev else []) + [label]))
            }
            if (not prev) or entry['stars'] > prev.get('stars',0):
                all_items[full] = entry
            kept += 1
        time.sleep(1.1)
    report_lines.append(f'- collected so far: {len(all_items)} unique repos')
    report_lines.append('')

# save raw
raw_path = OUT_RAW / 'github-repos-wide.json'
with raw_path.open('w', encoding='utf-8') as f:
    json.dump(sorted(all_items.values(), key=lambda x: x['stars'], reverse=True), f, ensure_ascii=False, indent=2)

# write top report
top = sorted(all_items.values(), key=lambda x: x['stars'], reverse=True)
report_lines += ['## Top 100 (by stars)', '']
for i, it in enumerate(top[:100],1):
    report_lines.append(f"{i}. [{it['full_name']}]({it['url']}) ⭐ {it['stars']} · {it['language']} · tags: {', '.join(it['labels'][:4])}")

report_path = OUT_REPORTS / 'github-wide-report.md'
report_path.write_text('\n'.join(report_lines), encoding='utf-8')

# card extraction (high relevance heuristic)
keywords = ['agent','prompt','mcp','coding','code','dev','automation','context','review','test','openclaw','claude','cursor']
high = []
for it in top:
    txt = (it['full_name'] + ' ' + it['description']).lower()
    score = sum(1 for k in keywords if k in txt) + min(5, it['stars']//5000)
    if score >= 3:
        high.append((score,it))

high = sorted(high, key=lambda x:(x[0], x[1]['stars']), reverse=True)[:250]
index_lines = ['# Research Cards Index', '', f'total cards: {len(high)}', '']
for n, (score, it) in enumerate(high,1):
    slug = it['full_name'].replace('/','__')
    card = OUT_CARDS / f'{slug}.md'
    card.write_text('\n'.join([
        f"# {it['full_name']}",
        '',
        f"- URL: {it['url']}",
        f"- Stars: {it['stars']}",
        f"- Main language: {it['language']}",
        f"- Labels: {', '.join(it['labels'])}",
        f"- Relevance score: {score}",
        '',
        '## Summary',
        it['description'] or '(no description)',
        '',
        '## Starter Mapping',
        '- prompts/: 활용 가능한 프롬프트/룰 여부 확인',
        '- scripts/: 자동화/실행 흐름 참고',
        '- checklists/: 품질/보안 체크 항목 추출',
        '- docs/: 온보딩/운영 문서 패턴 추출',
    ]), encoding='utf-8')
    index_lines.append(f"{n}. [{it['full_name']}]({it['url']}) · score {score} · card: `research/github-wide/cards/{card.name}`")

(OUT_REPORTS / 'cards-index.md').write_text('\n'.join(index_lines), encoding='utf-8')
print('done')
