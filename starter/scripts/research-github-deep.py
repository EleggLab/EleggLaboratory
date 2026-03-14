#!/usr/bin/env python3
import os, json, time, pathlib, requests

ROOT = pathlib.Path('/home/sml/.openclaw/workspace')
BASE_DIR = ROOT / 'research/github-wide'
RAW = BASE_DIR / 'raw'
REPORTS = BASE_DIR / 'reports'
STATE = BASE_DIR / 'state.json'
for p in [RAW, REPORTS]: p.mkdir(parents=True, exist_ok=True)

TOKEN = os.getenv('GITHUB_TOKEN','').strip()
headers = {'Accept':'application/vnd.github+json','User-Agent':'openclaw-github-deep-research'}
if TOKEN:
    headers['Authorization'] = f'Bearer {TOKEN}'

keywords = [
 'ai coding agent','vibe coding','prompt engineering','context engineering','mcp server','code review ai',
 'ai testing automation','developer productivity ai','autonomous software engineer','agentic coding',
 'claude code','codex cli','cursor rules','openclaw skills','multilingual docs developer',
 '바이브 코딩','バイブコーディング','程序员 AI 编程','programación con IA','programação com IA','البرمجة بالذكاء الاصطناعي'
]
stars_bins = ['>30000','10000..30000','3000..10000','1000..3000','300..1000','50..300','10..50']
sorts = ['stars','updated']

state = {'cursor':0, 'total_runs':0, 'seen':0}
if STATE.exists():
    try: state.update(json.loads(STATE.read_text(encoding='utf-8')))
    except: pass

items = {}
base_file = RAW / 'github-repos-deep.json'
if base_file.exists():
    try:
        for it in json.loads(base_file.read_text(encoding='utf-8')):
            items[it['full_name']] = it
    except: pass

start = state['cursor']
max_jobs = 18  # per run budget
jobs = []
for kw in keywords:
    for sb in stars_bins:
        for s in sorts:
            jobs.append((kw,sb,s))

selected = jobs[start:start+max_jobs]
log = ['# GitHub Deep Research Run', '', f"time: {time.strftime('%Y-%m-%d %H:%M:%S %Z')}", f'start cursor: {start}', f'jobs this run: {len(selected)}', '']

base='https://api.github.com/search/repositories'
rate_limited = False
for idx, (kw,sb,sort) in enumerate(selected,1):
    q = f'{kw} in:name,description,readme stars:{sb}'
    log.append(f'## job {idx}: {kw} | stars:{sb} | sort:{sort}')
    for page in [1,2]:
        r = requests.get(base, params={'q':q,'sort':sort,'order':'desc','per_page':50,'page':page}, headers=headers, timeout=35)
        rem = r.headers.get('X-RateLimit-Remaining','?')
        if r.status_code == 403 and rem == '0':
            log.append('- rate limit reached, stopping run')
            rate_limited = True
            break
        if r.status_code != 200:
            log.append(f'- page {page}: HTTP {r.status_code}')
            break
        data = r.json().get('items',[])
        log.append(f'- page {page}: {len(data)} items (remaining:{rem})')
        for it in data:
            fn = it.get('full_name')
            if not fn: continue
            prev = items.get(fn, {})
            labels = sorted(set(prev.get('labels',[]) + [kw]))
            items[fn] = {
                'full_name': fn,
                'url': it.get('html_url'),
                'description': (it.get('description') or '').strip(),
                'stars': int(it.get('stargazers_count',0)),
                'language': it.get('language') or '-',
                'updated_at': it.get('updated_at'),
                'labels': labels,
            }
        time.sleep(0.9)
    log.append(f'- unique repos now: {len(items)}')
    log.append('')
    if rate_limited:
        break

# persist
arr = sorted(items.values(), key=lambda x: (x['stars'], x.get('updated_at') or ''), reverse=True)
base_file.write_text(json.dumps(arr, ensure_ascii=False, indent=2), encoding='utf-8')

next_cursor = start + len(selected)
if next_cursor >= len(jobs) or rate_limited:
    next_cursor = 0 if next_cursor >= len(jobs) else next_cursor

state['cursor'] = next_cursor
state['total_runs'] = int(state.get('total_runs',0)) + 1
state['seen'] = len(arr)
STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')

# leaderboard
lead = REPORTS / 'github-wide-top200.md'
lines = ['# GitHub Wide Top200', '', f"repos: {len(arr)}", '']
for i,it in enumerate(arr[:200],1):
    lines.append(f"{i}. [{it['full_name']}]({it['url']}) ⭐ {it['stars']} · {it['language']} · labels: {', '.join(it['labels'][:3])}")
lead.write_text('\n'.join(lines), encoding='utf-8')

runlog = REPORTS / f"deep-run-{time.strftime('%Y%m%d-%H%M%S')}.md"
runlog.write_text('\n'.join(log), encoding='utf-8')
print(f'done: repos={len(arr)} next_cursor={next_cursor} token={"yes" if TOKEN else "no"}')
