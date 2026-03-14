#!/usr/bin/env python3
import pathlib, re
p = pathlib.Path('/home/sml/.openclaw/workspace/starter/backlog.md')
if not p.exists():
    raise SystemExit('missing backlog.md')
text = p.read_text(encoding='utf-8')
total = len(re.findall(r'^- \[[ xX]\] ', text, flags=re.M))
done = len(re.findall(r'^- \[[xX]\] ', text, flags=re.M))
ratio = (done/total*100) if total else 0
print(f'backlog: {done}/{total} ({ratio:.1f}%)')
